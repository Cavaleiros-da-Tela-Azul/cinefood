import type { IssuedTicket } from './types.ts';

export interface TicketRepository {
  saveBatch(tickets: IssuedTicket[]): Promise<IssuedTicket[]>;
  findByPurchaseId(purchaseId: string): Promise<IssuedTicket[]>;
  findByToken(qrToken: string): Promise<IssuedTicket | undefined>;
  findById(ticketId: string): Promise<IssuedTicket | undefined>;
  listByBuyer(buyerUserId: string): Promise<IssuedTicket[]>;
  markCancelledByPurchase(purchaseId: string, cancelledAt: string): Promise<IssuedTicket[]>;
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
}
