export type PaymentMethod = 'PIX' | 'CARD';

export type PaymentStatus =
  | 'PENDENTE'
  | 'APROVADO'
  | 'CONFLITO_EXPIRACAO'
  | 'ESTORNADO_CONFLITO_EXPIRACAO'
  | 'FALHA_GATEWAY';

export interface PaymentRecord {
  id: string;
  buyerUserId: string;
  reservationId: string;
  purchaseId: string;
  idempotencyKey: string;
  method: PaymentMethod;
  amountCents: number;
  sandboxMode: true;
  gatewayChargeId: string;
  pixCopyPaste?: string;
  pixQrPayload?: string;
  cardLast4?: string;
  status: PaymentStatus;
  refundId?: string;
  refundIdempotencyKey?: string;
  ticketEmitted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountNotification {
  id: string;
  userId: string;
  type: 'PIX_TARDIO_ESTORNO' | 'PAGAMENTO_APROVADO' | 'PAGAMENTO_RECUSADO';
  purchaseId: string;
  reservationId: string;
  message: string;
  createdAt: Date;
}

export interface CheckoutRequest {
  reservationId: string;
  purchaseId: string;
  method: PaymentMethod;
  /** Token opaco simulado do cartão em sandbox; PAN/CVV completos nunca são aceitos ou persistidos. */
  cardToken?: string;
  cardLast4?: string;
  /** Ignorado pelo servidor: valor é sempre calculado a partir da reserva/sessão. */
  amountCents?: number;
}

export interface CheckoutResult {
  payment: PaymentRecord;
  idempotentReplay: boolean;
}

export interface WebhookEventPayload {
  eventId: string;
  eventType: 'PAYMENT_APPROVED' | 'PAYMENT_FAILED';
  gatewayChargeId: string;
  reservationId: string;
  paidAt?: string;
}

export interface WebhookProcessResult {
  duplicate: boolean;
  payment: PaymentRecord;
  refundTriggered: boolean;
}
