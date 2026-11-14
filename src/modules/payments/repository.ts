import type { AccountNotification, PaymentRecord } from './types.ts';

export interface PaymentRepository {
  findByIdempotencyKey(buyerUserId: string, idempotencyKey: string): Promise<PaymentRecord | null>;
  findByGatewayChargeId(gatewayChargeId: string): Promise<PaymentRecord | null>;
  savePayment(record: PaymentRecord): Promise<PaymentRecord>;
  updatePayment(record: PaymentRecord): Promise<PaymentRecord>;
  hasProcessedWebhookEvent(eventId: string): Promise<boolean>;
  markWebhookEventProcessed(eventId: string): Promise<void>;
  addNotification(notification: AccountNotification): Promise<void>;
  listNotificationsByUser(userId: string): Promise<AccountNotification[]>;
}

export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly payments = new Map<string, PaymentRecord>();
  private readonly idempotencyIndex = new Map<string, string>();
  private readonly chargeIndex = new Map<string, string>();
  private readonly processedWebhookEvents = new Set<string>();
  private readonly notifications: AccountNotification[] = [];

  async findByIdempotencyKey(
    buyerUserId: string,
    idempotencyKey: string,
  ): Promise<PaymentRecord | null> {
    const paymentId = this.idempotencyIndex.get(idemKey(buyerUserId, idempotencyKey));
    if (!paymentId) return null;
    const record = this.payments.get(paymentId);
    return record ? clonePayment(record) : null;
  }

  async findByGatewayChargeId(gatewayChargeId: string): Promise<PaymentRecord | null> {
    const paymentId = this.chargeIndex.get(gatewayChargeId);
    if (!paymentId) return null;
    const record = this.payments.get(paymentId);
    return record ? clonePayment(record) : null;
  }

  async savePayment(record: PaymentRecord): Promise<PaymentRecord> {
    const cloned = clonePayment(record);
    this.payments.set(cloned.id, cloned);
    this.idempotencyIndex.set(idemKey(cloned.buyerUserId, cloned.idempotencyKey), cloned.id);
    this.chargeIndex.set(cloned.gatewayChargeId, cloned.id);
    return clonePayment(cloned);
  }

  async updatePayment(record: PaymentRecord): Promise<PaymentRecord> {
    const cloned = clonePayment(record);
    this.payments.set(cloned.id, cloned);
    return clonePayment(cloned);
  }

  async hasProcessedWebhookEvent(eventId: string): Promise<boolean> {
    return this.processedWebhookEvents.has(eventId);
  }

  async markWebhookEventProcessed(eventId: string): Promise<void> {
    this.processedWebhookEvents.add(eventId);
  }

  async addNotification(notification: AccountNotification): Promise<void> {
    this.notifications.push({
      ...notification,
      createdAt: new Date(notification.createdAt.getTime()),
    });
  }

  async listNotificationsByUser(userId: string): Promise<AccountNotification[]> {
    return this.notifications
      .filter((n) => n.userId === userId)
      .map((n) => ({ ...n, createdAt: new Date(n.createdAt.getTime()) }));
  }
}

function idemKey(buyerUserId: string, key: string): string {
  return `${buyerUserId}::${key}`;
}

function clonePayment(record: PaymentRecord): PaymentRecord {
  return {
    ...record,
    createdAt: new Date(record.createdAt.getTime()),
    updatedAt: new Date(record.updatedAt.getTime()),
  };
}
