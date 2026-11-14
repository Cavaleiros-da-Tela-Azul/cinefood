import { randomUUID } from 'node:crypto';
import { authenticatedUserId, authorize, ForbiddenError } from '../identity/rbac.ts';
import type { AuthenticatedSession, ProtectedOperation } from '../identity/types.ts';
import type { TicketRepository } from '../tickets/repository.ts';
import type {
  LinkedCanteenOrderRef,
  TicketValidatedEvent,
} from '../tickets/types.ts';
import type { HistoryService, NoticeDispatchOutcome } from '../history/service.ts';
import type { CanteenRepository } from './repository.ts';
import type {
  CanteenCartItemInput,
  CanteenCheckoutInput,
  CanteenMenuItemView,
  CanteenOrder,
  CanteenQuoteResult,
  PricedCanteenOrderItem,
  RunnerIncidentInput,
  StockReservationLine,
} from './types.ts';

export class CanteenEmptyCartError extends Error {
  constructor() {
    super('O carrinho da cantina não pode estar vazio.');
    this.name = 'CanteenEmptyCartError';
  }
}

export class CanteenCatalogItemUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanteenCatalogItemUnavailableError';
  }
}

export class CanteenInsufficientStockError extends Error {
  public readonly productId: string;
  public readonly requested: number;
  public readonly available: number;

  constructor(productId: string, requested: number, available: number) {
    super(
      `Estoque insuficiente para o item ${productId}: solicitado ${requested}, disponível ${available}.`,
    );
    this.name = 'CanteenInsufficientStockError';
    this.productId = productId;
    this.requested = requested;
    this.available = available;
  }
}

export class CanteenOrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`Pedido da cantina ${orderId} não encontrado.`);
    this.name = 'CanteenOrderNotFoundError';
  }
}

export class CanteenOrderStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanteenOrderStateError';
  }
}

export class CanteenSeatDeliveryBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanteenSeatDeliveryBlockedError';
  }
}

export interface CanteenServiceOptions {
  now?: () => Date;
  ticketRepository?: TicketRepository;
  historyService?: Pick<HistoryService, 'recordInternalNoticeBestEffort'>;
}

export interface RunnerIncidentResult {
  order: CanteenOrder;
  noticeOutcome?: NoticeDispatchOutcome;
}

function authorizeAny(
  session: AuthenticatedSession,
  operations: ProtectedOperation[],
): void {
  for (const operation of operations) {
    try {
      authorize({ session, operation });
      return;
    } catch (error) {
      if (!(error instanceof ForbiddenError)) {
        throw error;
      }
    }
  }
  throw new ForbiddenError();
}

export class CanteenService {
  private readonly repository: CanteenRepository;
  private readonly now: () => Date;
  private readonly ticketRepository?: TicketRepository;
  private readonly historyService?: Pick<HistoryService, 'recordInternalNoticeBestEffort'>;

  constructor(repository: CanteenRepository, options: CanteenServiceOptions = {}) {
    this.repository = repository;
    this.now = options.now ?? (() => new Date());
    this.ticketRepository = options.ticketRepository;
    this.historyService = options.historyService;
  }

  /**
   * Lista o cardápio ativo da cantina com combos, adicionais permitidos
   * e estoque disponível em tempo real (RF-07).
   */
  async listMenu(): Promise<CanteenMenuItemView[]> {
    const products = await this.repository.listActiveProducts();
    const views: CanteenMenuItemView[] = [];

    for (const product of products) {
      const addons = await this.repository.listAddonsByIds(product.allowedAddonIds);
      views.push({
        productId: product.productId,
        name: product.name,
        description: product.description,
        category: product.category,
        unitPriceCents: product.unitPriceCents,
        availableStock: product.availableStock,
        isCombo: product.isCombo,
        ...(product.comboItems ? { comboItems: [...product.comboItems] } : {}),
        addons: addons.filter((addon) => addon.available),
      });
    }

    return views;
  }

  /**
   * Recalcula obrigatoriamente o carrinho no servidor (RF-07 / AC-1):
   * - Ignora qualquer clientUnitPriceCents, clientLineTotalCents ou clientTotalCents;
   * - Rejeita produto inexistente, inativo ou sem estoque disponível;
   * - Valida adicionais permitidos e disponíveis.
   */
  async quoteCart(items: CanteenCartItemInput[]): Promise<CanteenQuoteResult> {
    if (!items || items.length === 0) {
      throw new CanteenEmptyCartError();
    }

    const pricedItems: PricedCanteenOrderItem[] = [];
    const requestedPerProduct = new Map<string, number>();

    for (const inputItem of items) {
      if (!Number.isInteger(inputItem.quantity) || inputItem.quantity <= 0) {
        throw new CanteenCatalogItemUnavailableError(
          `Quantidade inválida para o produto ${inputItem.productId}.`,
        );
      }

      const product = await this.repository.findProductById(inputItem.productId);
      if (!product || !product.active) {
        throw new CanteenCatalogItemUnavailableError(
          `Item ${inputItem.productId} indisponível no cardápio da cantina.`,
        );
      }

      const accumulatedQty = (requestedPerProduct.get(product.productId) ?? 0) + inputItem.quantity;
      if (product.availableStock < accumulatedQty) {
        throw new CanteenCatalogItemUnavailableError(
          `Item ${product.name} sem estoque suficiente (${product.availableStock} disponível).`,
        );
      }
      requestedPerProduct.set(product.productId, accumulatedQty);

      const resolvedAddons: Array<{ addonId: string; name: string; priceCents: number }> = [];
      let addonsUnitPriceCents = 0;

      for (const addonId of inputItem.addonIds ?? []) {
        if (!product.allowedAddonIds.includes(addonId)) {
          throw new CanteenCatalogItemUnavailableError(
            `Adicional ${addonId} não é permitido para o produto ${product.name}.`,
          );
        }
        const addon = await this.repository.findAddonById(addonId);
        if (!addon || !addon.available) {
          throw new CanteenCatalogItemUnavailableError(
            `Adicional ${addonId} indisponível no momento.`,
          );
        }
        resolvedAddons.push({
          addonId: addon.addonId,
          name: addon.name,
          priceCents: addon.priceCents,
        });
        addonsUnitPriceCents += addon.priceCents;
      }

      const lineTotalCents =
        (product.unitPriceCents + addonsUnitPriceCents) * inputItem.quantity;

      pricedItems.push({
        productId: product.productId,
        productName: product.name,
        quantity: inputItem.quantity,
        officialUnitPriceCents: product.unitPriceCents,
        addons: resolvedAddons,
        addonsUnitPriceCents,
        lineTotalCents,
      });
    }

    const totalCents = pricedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    return {
      items: pricedItems,
      totalCents,
      clientPayloadIgnored: true,
    };
  }

  /**
   * Inicia checkout da cantina recalculando preços no servidor e executando reserva
   * atômica condicional de estoque (HTTP 409 Conflict em disputa pela última unidade).
   * Para ENTREGA_ASSENTO, exige ingresso válido do próprio titular (RST-04 / AC-3).
   */
  async checkoutOrder(
    session: AuthenticatedSession,
    input: CanteenCheckoutInput,
  ): Promise<CanteenOrder> {
    authorize({ session, operation: 'CLIENT_ACCOUNT' });
    const ownerUserId = authenticatedUserId(session);

    if (!input.items || input.items.length === 0) {
      throw new CanteenEmptyCartError();
    }

    let resolvedScreeningId = input.screeningId;
    let resolvedSeatId = input.seatId;

    if (input.deliveryChannel === 'ENTREGA_ASSENTO') {
      if (!input.linkedTicketId || !input.linkedTicketId.trim()) {
        throw new CanteenSeatDeliveryBlockedError(
          'Entrega no assento exige vínculo com ingresso próprio válido (RST-04).',
        );
      }
      if (this.ticketRepository) {
        const ticket = await this.ticketRepository.findById(input.linkedTicketId);
        if (!ticket) {
          throw new CanteenSeatDeliveryBlockedError(
            'Ingresso vinculado não encontrado para entrega no assento (RST-04).',
          );
        }
        if (ticket.buyerUserId !== ownerUserId) {
          throw new CanteenSeatDeliveryBlockedError(
            'Entrega no assento bloqueada: ingresso pertence a outro titular (RST-04).',
          );
        }
        if (ticket.status === 'CANCELADO') {
          throw new CanteenSeatDeliveryBlockedError(
            'Entrega no assento bloqueada: ingresso cancelado (RST-04).',
          );
        }
        resolvedScreeningId = ticket.screeningId;
        resolvedSeatId = ticket.seatId;
      }
    }

    const pricedItems: PricedCanteenOrderItem[] = [];
    const aggregatedQuantities = new Map<string, number>();

    for (const inputItem of input.items) {
      if (!Number.isInteger(inputItem.quantity) || inputItem.quantity <= 0) {
        throw new CanteenCatalogItemUnavailableError(
          `Quantidade inválida para o produto ${inputItem.productId}.`,
        );
      }

      const product = await this.repository.findProductById(inputItem.productId);
      if (!product || !product.active) {
        throw new CanteenCatalogItemUnavailableError(
          `Item ${inputItem.productId} indisponível no cardápio da cantina.`,
        );
      }

      aggregatedQuantities.set(
        product.productId,
        (aggregatedQuantities.get(product.productId) ?? 0) + inputItem.quantity,
      );

      const resolvedAddons: Array<{ addonId: string; name: string; priceCents: number }> = [];
      let addonsUnitPriceCents = 0;

      for (const addonId of inputItem.addonIds ?? []) {
        if (!product.allowedAddonIds.includes(addonId)) {
          throw new CanteenCatalogItemUnavailableError(
            `Adicional ${addonId} não é permitido para o produto ${product.name}.`,
          );
        }
        const addon = await this.repository.findAddonById(addonId);
        if (!addon || !addon.available) {
          throw new CanteenCatalogItemUnavailableError(
            `Adicional ${addonId} indisponível no momento.`,
          );
        }
        resolvedAddons.push({
          addonId: addon.addonId,
          name: addon.name,
          priceCents: addon.priceCents,
        });
        addonsUnitPriceCents += addon.priceCents;
      }

      const lineTotalCents =
        (product.unitPriceCents + addonsUnitPriceCents) * inputItem.quantity;

      pricedItems.push({
        productId: product.productId,
        productName: product.name,
        quantity: inputItem.quantity,
        officialUnitPriceCents: product.unitPriceCents,
        addons: resolvedAddons,
        addonsUnitPriceCents,
        lineTotalCents,
      });
    }

    const reservationLines: StockReservationLine[] = Array.from(
      aggregatedQuantities.entries(),
    ).map(([productId, quantity]) => ({ productId, quantity }));

    const reservation = await this.repository.reserveStockAtomically(reservationLines);
    if (!reservation.ok) {
      throw new CanteenInsufficientStockError(
        reservation.productId,
        reservation.requested,
        reservation.available,
      );
    }

    const timestamp = this.now().toISOString();
    const totalCents = pricedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);

    const order: CanteenOrder = {
      orderId: `cnt_${randomUUID()}`,
      ownerUserId,
      ...(input.linkedTicketId ? { linkedTicketId: input.linkedTicketId } : {}),
      ...(resolvedScreeningId ? { screeningId: resolvedScreeningId } : {}),
      ...(resolvedSeatId ? { seatId: resolvedSeatId } : {}),
      deliveryChannel: input.deliveryChannel,
      status: 'PENDENTE_PAGAMENTO',
      items: pricedItems,
      totalCents,
      stockStatus: 'RESERVADO',
      paymentStatus: 'PENDENTE',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return this.repository.saveOrder(order);
  }

  /**
   * Confirma liquidação financeira do pedido (RF-08 / RN-05):
   * - RETIRADA_BALCAO entra imediatamente em EM_PREPARO no KDS;
   * - ENTREGA_ASSENTO aguarda validação da portaria (AGUARDANDO_CHEGADA),
   *   ou entra em EM_PREPARO imediatamente se o ingresso já estiver UTILIZADO.
   */
  async confirmOrderPayment(orderId: string): Promise<CanteenOrder> {
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new CanteenOrderNotFoundError(orderId);
    }

    if (order.paymentStatus === 'APROVADO' && order.stockStatus === 'BAIXADO') {
      return order;
    }

    if (order.status !== 'PENDENTE_PAGAMENTO' || order.paymentStatus !== 'PENDENTE') {
      throw new CanteenOrderStateError(
        `Pedido ${orderId} em estado ${order.status} não pode confirmar pagamento.`,
      );
    }

    const timestamp = this.now().toISOString();
    let nextStatus: 'EM_PREPARO' | 'AGUARDANDO_CHEGADA' =
      order.deliveryChannel === 'RETIRADA_BALCAO' ? 'EM_PREPARO' : 'AGUARDANDO_CHEGADA';

    if (
      order.deliveryChannel === 'ENTREGA_ASSENTO' &&
      order.linkedTicketId &&
      this.ticketRepository
    ) {
      const ticket = await this.ticketRepository.findById(order.linkedTicketId);
      if (ticket && ticket.buyerUserId === order.ownerUserId && ticket.status === 'UTILIZADO') {
        nextStatus = 'EM_PREPARO';
      }
    }

    return this.repository.updateOrder({
      ...order,
      status: nextStatus,
      stockStatus: 'BAIXADO',
      paymentStatus: 'APROVADO',
      ...(nextStatus === 'EM_PREPARO' ? { kitchenQueuedAt: timestamp } : {}),
      settledAt: timestamp,
      updatedAt: timestamp,
    });
  }

  /**
   * Listener do evento TicketValidatedEvent (RN-02 / RF-09):
   * libera automaticamente pedidos pagos vinculados ao ingresso validado para EM_PREPARO no KDS.
   */
  async handleTicketValidated(event: TicketValidatedEvent): Promise<LinkedCanteenOrderRef[]> {
    const allOrders = await this.repository.listOrders();
    const transitioned: LinkedCanteenOrderRef[] = [];

    for (const order of allOrders) {
      if (
        order.linkedTicketId === event.ticketId &&
        order.deliveryChannel === 'ENTREGA_ASSENTO' &&
        order.status === 'AGUARDANDO_CHEGADA' &&
        order.paymentStatus === 'APROVADO'
      ) {
        const updated = await this.repository.updateOrder({
          ...order,
          status: 'EM_PREPARO',
          kitchenQueuedAt: event.validatedAt,
          updatedAt: event.validatedAt,
        });
        transitioned.push({
          orderId: updated.orderId,
          ticketId: event.ticketId,
          purchaseId: event.purchaseId,
          seatId: updated.seatId ?? event.seatId,
          deliveryChannel: updated.deliveryChannel,
          status: 'EM_PREPARO',
          kitchenQueuedAt: event.validatedAt,
        });
      }
    }

    return transitioned;
  }

  /**
   * Verifica trava inegociável RST-04 para pedidos de entrega no assento:
   * o ingresso vinculado precisa existir, pertencer ao mesmo titular do pedido,
   * estar pago e ter entrada física validada na portaria (status === 'UTILIZADO').
   */
  private async assertSeatDeliveryAuthorized(order: CanteenOrder): Promise<void> {
    if (order.paymentStatus !== 'APROVADO') {
      throw new CanteenSeatDeliveryBlockedError(
        'Entrega no assento bloqueada: pedido sem pagamento confirmado (RST-04).',
      );
    }
    if (!order.linkedTicketId) {
      throw new CanteenSeatDeliveryBlockedError(
        'Entrega no assento bloqueada: nenhum ingresso vinculado ao pedido (RST-04).',
      );
    }
    if (!this.ticketRepository) {
      throw new CanteenSeatDeliveryBlockedError(
        'Entrega no assento bloqueada: verificação de portaria indisponível (RST-04).',
      );
    }

    const ticket = await this.ticketRepository.findById(order.linkedTicketId);
    if (!ticket) {
      throw new CanteenSeatDeliveryBlockedError(
        'Entrega no assento bloqueada: ingresso vinculado não encontrado (RST-04).',
      );
    }
    if (ticket.buyerUserId !== order.ownerUserId) {
      throw new CanteenSeatDeliveryBlockedError(
        'Entrega no assento bloqueada: ingresso pertence a outro usuário (RST-04).',
      );
    }
    if (ticket.status === 'CANCELADO') {
      throw new CanteenSeatDeliveryBlockedError(
        'Entrega no assento bloqueada: ingresso cancelado (RST-04).',
      );
    }
    if (ticket.status !== 'UTILIZADO') {
      throw new CanteenSeatDeliveryBlockedError(
        'Entrega no assento bloqueada: ingresso ainda não teve entrada validada na portaria (RST-04).',
      );
    }
  }

  /**
   * KDS — Inicia preparo de comanda em AGUARDANDO_CHEGADA (respeitando RST-04 para assento).
   */
  async startPreparation(
    session: AuthenticatedSession,
    orderId: string,
  ): Promise<CanteenOrder> {
    authorize({ session, operation: 'CANTEEN_OPERATION' });
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new CanteenOrderNotFoundError(orderId);
    }

    if (order.status === 'EM_PREPARO') {
      return order;
    }

    if (order.paymentStatus !== 'APROVADO') {
      throw new CanteenSeatDeliveryBlockedError(
        `Pedido ${orderId} não possui pagamento aprovado para preparo.`,
      );
    }

    if (order.status !== 'AGUARDANDO_CHEGADA') {
      throw new CanteenOrderStateError(
        `Transição inválida para EM_PREPARO a partir de ${order.status}.`,
      );
    }

    if (order.deliveryChannel === 'ENTREGA_ASSENTO') {
      await this.assertSeatDeliveryAuthorized(order);
    }

    const timestamp = this.now().toISOString();
    return this.repository.updateOrder({
      ...order,
      status: 'EM_PREPARO',
      kitchenQueuedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  /**
   * KDS — Marca pedido EM_PREPARO como PRONTO (RF-09).
   */
  async markOrderReady(
    session: AuthenticatedSession,
    orderId: string,
  ): Promise<CanteenOrder> {
    authorize({ session, operation: 'CANTEEN_OPERATION' });
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new CanteenOrderNotFoundError(orderId);
    }

    if (order.status !== 'EM_PREPARO') {
      throw new CanteenOrderStateError(
        `Pedido ${orderId} precisa estar em EM_PREPARO para avançar para PRONTO (atual: ${order.status}).`,
      );
    }

    const timestamp = this.now().toISOString();
    return this.repository.updateOrder({
      ...order,
      status: 'PRONTO',
      readyAt: timestamp,
      updatedAt: timestamp,
    });
  }

  /**
   * Despacho de pedido PRONTO para entrega na poltrona (SAIU_PARA_ENTREGA).
   * Exige validação estrita da regra RST-04 antes de autorizar saída da cozinha/runner.
   */
  async dispatchForSeatDelivery(
    session: AuthenticatedSession,
    orderId: string,
  ): Promise<CanteenOrder> {
    authorizeAny(session, ['CANTEEN_OPERATION', 'DELIVERY_OPERATION']);
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new CanteenOrderNotFoundError(orderId);
    }

    if (order.deliveryChannel !== 'ENTREGA_ASSENTO') {
      throw new CanteenOrderStateError(
        'Pedidos de retirada no balcão não utilizam saída para entrega no assento.',
      );
    }

    if (order.status !== 'PRONTO') {
      throw new CanteenOrderStateError(
        `Pedido ${orderId} precisa estar PRONTO para sair para entrega (atual: ${order.status}).`,
      );
    }

    await this.assertSeatDeliveryAuthorized(order);

    const timestamp = this.now().toISOString();
    return this.repository.updateOrder({
      ...order,
      status: 'SAIU_PARA_ENTREGA',
      dispatchedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  /**
   * Conclui entrega ao cliente (no balcão, após saída ao assento ou após conversão RETIRADA_NO_BALCAO).
   */
  async completeDelivery(
    session: AuthenticatedSession,
    orderId: string,
  ): Promise<CanteenOrder> {
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new CanteenOrderNotFoundError(orderId);
    }

    if (order.status === 'SAIU_PARA_ENTREGA') {
      authorize({ session, operation: 'DELIVERY_OPERATION' });
    } else if (order.status === 'PRONTO' && order.deliveryChannel === 'RETIRADA_BALCAO') {
      authorize({ session, operation: 'CANTEEN_OPERATION' });
    } else if (order.status === 'RETIRADA_NO_BALCAO') {
      authorize({ session, operation: 'CANTEEN_OPERATION' });
    } else {
      authorizeAny(session, ['CANTEEN_OPERATION', 'DELIVERY_OPERATION']);
      throw new CanteenOrderStateError(
        `Pedido ${orderId} no estado ${order.status} não pode ser concluído como ENTREGUE.`,
      );
    }

    const timestamp = this.now().toISOString();
    return this.repository.updateOrder({
      ...order,
      status: 'ENTREGUE',
      deliveredAt: timestamp,
      updatedAt: timestamp,
    });
  }

  /**
   * Registro de ocorrência pelo runner na sala escura (RF-20 / RN-03 / AC-4):
   * converte automaticamente o pedido para RETIRADA_NO_BALCAO e notifica o titular no histórico.
   */
  async reportRunnerIncident(
    session: AuthenticatedSession,
    orderId: string,
    input: RunnerIncidentInput,
  ): Promise<RunnerIncidentResult> {
    authorize({ session, operation: 'DELIVERY_OPERATION' });
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new CanteenOrderNotFoundError(orderId);
    }

    if (order.deliveryChannel !== 'ENTREGA_ASSENTO') {
      throw new CanteenOrderStateError(
        'Ocorrência de runner na sala é aplicável apenas a pedidos de entrega no assento.',
      );
    }

    if (order.status !== 'SAIU_PARA_ENTREGA' && order.status !== 'PRONTO') {
      throw new CanteenOrderStateError(
        `Não é possível registrar ocorrência de entrega no estado ${order.status}.`,
      );
    }

    const timestamp = this.now().toISOString();
    const notes = input.notes?.trim();
    const reasonLabel =
      input.reason === 'CLIENTE_AUSENTE'
        ? 'Cliente ausente na poltrona após tolerância'
        : input.reason === 'IMPEDIMENTO_SALA'
          ? 'Impedimento de acesso na sala durante exibição'
          : 'Poltrona não localizada';

    const updated = await this.repository.updateOrder({
      ...order,
      status: 'RETIRADA_NO_BALCAO',
      incidentReason: input.reason,
      incidentNote: notes && notes.length > 0 ? `${reasonLabel}: ${notes}` : reasonLabel,
      incidentReportedAt: timestamp,
      incidentReportedByRunnerId: session.userId,
      updatedAt: timestamp,
    });

    let noticeOutcome: NoticeDispatchOutcome | undefined;
    if (this.historyService) {
      noticeOutcome = await this.historyService.recordInternalNoticeBestEffort({
        ownerUserId: updated.ownerUserId,
        orderId: updated.orderId,
        type: 'WARNING',
        title: 'Pedido convertido para retirada no balcão',
        message: `Não foi possível concluir a entrega na poltrona (${reasonLabel}). Seu pedido ${updated.orderId} está disponível para retirada no balcão da cantina.`,
      });
    }

    return {
      order: updated,
      ...(noticeOutcome ? { noticeOutcome } : {}),
    };
  }

  /**
   * Compensa expiração ou falha de pagamento devolvendo os itens reservados ao estoque (RF-08).
   */
  async compensateOrderPaymentFailure(
    orderId: string,
    reason: 'EXPIRADO' | 'FALHOU',
  ): Promise<CanteenOrder> {
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new CanteenOrderNotFoundError(orderId);
    }

    if (order.stockStatus === 'DEVOLVIDO' && order.status === 'CANCELADO') {
      return order;
    }

    if (order.status !== 'PENDENTE_PAGAMENTO' || order.stockStatus !== 'RESERVADO') {
      throw new CanteenOrderStateError(
        `Pedido ${orderId} não possui reserva pendente elegível para devolução de estoque.`,
      );
    }

    const releaseMap = new Map<string, number>();
    for (const item of order.items) {
      releaseMap.set(item.productId, (releaseMap.get(item.productId) ?? 0) + item.quantity);
    }
    const releaseLines: StockReservationLine[] = Array.from(releaseMap.entries()).map(
      ([productId, quantity]) => ({ productId, quantity }),
    );
    await this.repository.releaseStockAtomically(releaseLines);

    return this.repository.updateOrder({
      ...order,
      status: 'CANCELADO',
      stockStatus: 'DEVOLVIDO',
      paymentStatus: reason,
      updatedAt: this.now().toISOString(),
    });
  }
}
