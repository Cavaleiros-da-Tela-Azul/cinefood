import type {
  HistoryCanteenOrderRecord,
  HistoryNoticeRecord,
  HistoryRefundRecord,
  HistoryTicketRecord,
  SessionReview,
} from './types.ts';

export interface HistoryRepository {
  findTicketById(ticketId: string): Promise<HistoryTicketRecord | undefined>;
  listTicketsByOwner(ownerUserId: string): Promise<HistoryTicketRecord[]>;
  listCanteenOrdersByOwner(ownerUserId: string): Promise<HistoryCanteenOrderRecord[]>;
  listRefundsByOwner(ownerUserId: string): Promise<HistoryRefundRecord[]>;
  listNoticesByOwner(ownerUserId: string): Promise<HistoryNoticeRecord[]>;
  saveNotice(notice: HistoryNoticeRecord): Promise<HistoryNoticeRecord>;
  listReviewsByOwner(ownerUserId: string): Promise<SessionReview[]>;
  findReviewById(reviewId: string): Promise<SessionReview | undefined>;
  findReviewByTicketId(ticketId: string): Promise<SessionReview | undefined>;
  createReview(review: SessionReview): Promise<SessionReview>;
  updateReview(review: SessionReview): Promise<SessionReview>;
  deleteReview(reviewId: string): Promise<boolean>;
}

export interface InMemoryHistoryRepositoryOptions {
  failNoticeWrite?: boolean;
}

export class InMemoryHistoryRepository implements HistoryRepository {
  private readonly tickets = new Map<string, HistoryTicketRecord>();
  private readonly canteenOrders = new Map<string, HistoryCanteenOrderRecord>();
  private readonly refunds = new Map<string, HistoryRefundRecord>();
  private readonly notices = new Map<string, HistoryNoticeRecord>();
  private readonly reviews = new Map<string, SessionReview>();
  private readonly reviewIdByTicket = new Map<string, string>();
  public failNoticeWrite: boolean;

  constructor(options: InMemoryHistoryRepositoryOptions = {}) {
    this.failNoticeWrite = options.failNoticeWrite ?? false;
  }

  seedTicket(ticket: HistoryTicketRecord): void {
    this.tickets.set(ticket.ticketId, { ...ticket });
  }

  seedCanteenOrder(order: HistoryCanteenOrderRecord): void {
    this.canteenOrders.set(order.orderId, { ...order });
  }

  seedRefund(refund: HistoryRefundRecord): void {
    this.refunds.set(refund.refundId, { ...refund });
  }

  async findTicketById(ticketId: string): Promise<HistoryTicketRecord | undefined> {
    const ticket = this.tickets.get(ticketId);
    return ticket ? { ...ticket } : undefined;
  }

  async listTicketsByOwner(ownerUserId: string): Promise<HistoryTicketRecord[]> {
    return Array.from(this.tickets.values())
      .filter((t) => t.ownerUserId === ownerUserId)
      .map((t) => ({ ...t }));
  }

  async listCanteenOrdersByOwner(
    ownerUserId: string,
  ): Promise<HistoryCanteenOrderRecord[]> {
    return Array.from(this.canteenOrders.values())
      .filter((o) => o.ownerUserId === ownerUserId)
      .map((o) => ({ ...o }));
  }

  async listRefundsByOwner(ownerUserId: string): Promise<HistoryRefundRecord[]> {
    return Array.from(this.refunds.values())
      .filter((r) => r.ownerUserId === ownerUserId)
      .map((r) => ({ ...r }));
  }

  async listNoticesByOwner(ownerUserId: string): Promise<HistoryNoticeRecord[]> {
    return Array.from(this.notices.values())
      .filter((n) => n.ownerUserId === ownerUserId)
      .map((n) => ({ ...n }));
  }

  async saveNotice(notice: HistoryNoticeRecord): Promise<HistoryNoticeRecord> {
    if (this.failNoticeWrite) {
      throw new Error('Falha simulada no canal de notificações internas');
    }
    const copy = { ...notice };
    this.notices.set(copy.noticeId, copy);
    return { ...copy };
  }

  async listReviewsByOwner(ownerUserId: string): Promise<SessionReview[]> {
    return Array.from(this.reviews.values())
      .filter((r) => r.ownerUserId === ownerUserId)
      .map((r) => ({ ...r }));
  }

  async findReviewById(reviewId: string): Promise<SessionReview | undefined> {
    const review = this.reviews.get(reviewId);
    return review ? { ...review } : undefined;
  }

  async findReviewByTicketId(ticketId: string): Promise<SessionReview | undefined> {
    const reviewId = this.reviewIdByTicket.get(ticketId);
    if (!reviewId) return undefined;
    return this.findReviewById(reviewId);
  }

  async createReview(review: SessionReview): Promise<SessionReview> {
    const copy = { ...review };
    this.reviews.set(copy.reviewId, copy);
    this.reviewIdByTicket.set(copy.ticketId, copy.reviewId);
    return { ...copy };
  }

  async updateReview(review: SessionReview): Promise<SessionReview> {
    const copy = { ...review };
    this.reviews.set(copy.reviewId, copy);
    return { ...copy };
  }

  async deleteReview(reviewId: string): Promise<boolean> {
    const existing = this.reviews.get(reviewId);
    if (!existing) return false;
    this.reviews.delete(reviewId);
    this.reviewIdByTicket.delete(existing.ticketId);
    return true;
  }
}
