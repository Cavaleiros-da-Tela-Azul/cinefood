import { randomUUID } from 'node:crypto';
import { authenticatedUserId, authorize } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import type { CanteenRepository } from './repository.ts';
import type {
  CanteenCartItemInput,
  CanteenCheckoutInput,
  CanteenMenuItemView,
  CanteenOrder,
  CanteenQuoteResult,
  PricedCanteenOrderItem,
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

export interface CanteenServiceOptions {
  now?: () => Date;
}

export class CanteenService {
  private readonly repository: CanteenRepository;
  private readonly now: () => Date;

  constructor(repository: CanteenRepository, options: CanteenServiceOptions = {}) {
    this.repository = repository;
    this.now = options.now ?? (() => new Date());
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
      ...(input.screeningId ? { screeningId: input.screeningId } : {}),
      ...(input.seatId ? { seatId: input.seatId } : {}),
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
   * consolida a baixa de estoque e encaminha o pedido conforme o canal.
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
    const nextStatus =
      order.deliveryChannel === 'RETIRADA_BALCAO' ? 'EM_PREPARO' : 'AGUARDANDO_CHEGADA';

    return this.repository.updateOrder({
      ...order,
      status: nextStatus,
      stockStatus: 'BAIXADO',
      paymentStatus: 'APROVADO',
      settledAt: timestamp,
      updatedAt: timestamp,
    });
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
