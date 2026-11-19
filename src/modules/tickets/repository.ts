import type {
  IssuedTicket,
  LinkedCanteenOrderRef,
  TicketValidatedEvent,
} from './types.ts';

export interface AtomicConsumeInput {
  qrToken: string;
  operatorId: string;
  usedAt: string;
  expectedScreeningId?: string;
  expectedRoomName?: string;
}

export type AtomicConsumeResult =
  | { kind: 'CONSUMED'; ticket: IssuedTicket }
  | { kind: 'NOT_FOUND' }
  | { kind: 'ALREADY_USED'; ticket: IssuedTicket }
  | { kind: 'CANCELLED'; ticket: IssuedTicket }
  | { kind: 'WRONG_SCREENING'; ticket: IssuedTicket }
  | { kind: 'EXPIRED_SESSION'; ticket: IssuedTicket };

export interface TicketRepository {
  saveBatch(tickets: IssuedTicket[]): Promise<IssuedTicket[]>;
  findByPurchaseId(purchaseId: string): Promise<IssuedTicket[]>;
  findByToken(qrToken: string): Promise<IssuedTicket | undefined>;
  findById(ticketId: string): Promise<IssuedTicket | undefined>;
  listByBuyer(buyerUserId: string): Promise<IssuedTicket[]>;
  markCancelledByPurchase(purchaseId: string, cancelledAt: string): Promise<IssuedTicket[]>;
  markCancelledByTicketId(ticketId: string, cancelledAt: string): Promise<IssuedTicket | undefined>;
  consumeTokenAtomically(input: AtomicConsumeInput): Promise<AtomicConsumeResult>;
}

export class InMemoryTicketRepository implements TicketRepository {
  private readonly byId = new Map<string, IssuedTicket>();
  private readonly idByToken = new Map<string, string>();
  private readonly idsByPurchase = new Map<string, string[]>();

  async saveBatch(tickets: IssuedTicket[]): Promise<IssuedTicket[]> {
    if (tickets.length === 0) return [];
    const purchaseId = tickets[0].purchaseId;
    const existingIds = this.idsByPurchase.get(purchaseId);
    if (existingIds && existingIds.length > 0) {
      return existingIds
        .map((id) => this.byId.get(id))
        .filter((t): t is IssuedTicket => t !== undefined)
        .map((t) => ({ ...t }));
    }

    const storedIds: string[] = [];
    for (const ticket of tickets) {
      const copy = { ...ticket };
      this.byId.set(copy.ticketId, copy);
      this.idByToken.set(copy.qrToken, copy.ticketId);
      storedIds.push(copy.ticketId);
    }
    this.idsByPurchase.set(purchaseId, storedIds);
    return tickets.map((t) => ({ ...t }));
  }

  async findByPurchaseId(purchaseId: string): Promise<IssuedTicket[]> {
    const ids = this.idsByPurchase.get(purchaseId) ?? [];
    return ids
      .map((id) => this.byId.get(id))
      .filter((t): t is IssuedTicket => t !== undefined)
      .map((t) => ({ ...t }));
  }

  async findByToken(qrToken: string): Promise<IssuedTicket | undefined> {
    const id = this.idByToken.get(qrToken);
    if (!id) return undefined;
    const ticket = this.byId.get(id);
    return ticket ? { ...ticket } : undefined;
  }

  async findById(ticketId: string): Promise<IssuedTicket | undefined> {
    const ticket = this.byId.get(ticketId);
    return ticket ? { ...ticket } : undefined;
  }

  async listByBuyer(buyerUserId: string): Promise<IssuedTicket[]> {
    return Array.from(this.byId.values())
      .filter((t) => t.buyerUserId === buyerUserId)
      .map((t) => ({ ...t }));
  }

  async markCancelledByPurchase(
    purchaseId: string,
    cancelledAt: string,
  ): Promise<IssuedTicket[]> {
    const ids = this.idsByPurchase.get(purchaseId) ?? [];
    const updated: IssuedTicket[] = [];
    for (const id of ids) {
      const current = this.byId.get(id);
      if (!current) continue;
      const next: IssuedTicket = {
        ...current,
        status: 'CANCELADO',
        cancelledAt,
      };
      this.byId.set(id, next);
      updated.push({ ...next });
    }
    return updated;
  }

  async markCancelledByTicketId(
    ticketId: string,
    cancelledAt: string,
  ): Promise<IssuedTicket | undefined> {
    const current = this.byId.get(ticketId);
    if (!current) return undefined;
    const next: IssuedTicket = {
      ...current,
      status: 'CANCELADO',
      cancelledAt,
    };
    this.byId.set(ticketId, next);
    return { ...next };
  }

  /**
   * Simula exatamente o UPDATE atômico SQL:
   * UPDATE ingressos SET status = 'UTILIZADO', data_utilizacao = :usedAt, operador_id = :operatorId
   * WHERE qr_token = :qrToken AND status = 'EMITIDO'
   * Executado de forma síncrona antes de qualquer yield assíncrono para imunidade a race conditions.
   */
  async consumeTokenAtomically(input: AtomicConsumeInput): Promise<AtomicConsumeResult> {
    const id = this.idByToken.get(input.qrToken);
    if (!id) {
      return { kind: 'NOT_FOUND' };
    }
    const current = this.byId.get(id);
    if (!current) {
      return { kind: 'NOT_FOUND' };
    }

    if (current.status === 'CANCELADO') {
      return { kind: 'CANCELLED', ticket: { ...current } };
    }

    if (current.status === 'UTILIZADO') {
      return { kind: 'ALREADY_USED', ticket: { ...current } };
    }

    if (
      (input.expectedScreeningId && current.screeningId !== input.expectedScreeningId) ||
      (input.expectedRoomName && current.roomName !== input.expectedRoomName)
    ) {
      return { kind: 'WRONG_SCREENING', ticket: { ...current } };
    }

    if (Date.parse(input.usedAt) > Date.parse(current.endsAt)) {
      return { kind: 'EXPIRED_SESSION', ticket: { ...current } };
    }

    const updated: IssuedTicket = {
      ...current,
      status: 'UTILIZADO',
      usedAt: input.usedAt,
      validatedByOperatorId: input.operatorId,
    };
    this.byId.set(id, updated);
    return { kind: 'CONSUMED', ticket: { ...updated } };
  }
}

/**
 * Ponte in-memory de eventos de domínio entre CMP-04 (Portaria) e CMP-05 (Cantina KDS)
 * para execução automática da regra RN-02.
 */
export class InMemoryCanteenKdsTrigger {
  private readonly orders = new Map<string, LinkedCanteenOrderRef>();
  private readonly events: TicketValidatedEvent[] = [];

  registerOrder(order: LinkedCanteenOrderRef): void {
    this.orders.set(order.orderId, { ...order });
  }

  async handleTicketValidated(event: TicketValidatedEvent): Promise<LinkedCanteenOrderRef[]> {
    this.events.push({ ...event });
    const transitioned: LinkedCanteenOrderRef[] = [];

    for (const [orderId, order] of this.orders.entries()) {
      if (
        order.ticketId === event.ticketId &&
        order.deliveryChannel === 'ENTREGA_ASSENTO' &&
        order.status === 'AGUARDANDO_CHEGADA'
      ) {
        const next: LinkedCanteenOrderRef = {
          ...order,
          status: 'EM_PREPARO',
          kitchenQueuedAt: event.validatedAt,
        };
        this.orders.set(orderId, next);
        transitioned.push({ ...next });
      }
    }

    return transitioned;
  }

  getOrder(orderId: string): LinkedCanteenOrderRef | undefined {
    const order = this.orders.get(orderId);
    return order ? { ...order } : undefined;
  }

  listEvents(): TicketValidatedEvent[] {
    return this.events.map((e) => ({ ...e }));
  }
}
