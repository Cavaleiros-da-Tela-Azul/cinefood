import type { BookingRepository } from '../booking/repository.ts';
import type { BookingService } from '../booking/service.ts';
import type { SeatReservation } from '../booking/types.ts';
import { ForbiddenError } from '../identity/rbac.ts';

const DEFAULT_TICKET_PRICE_CENTS = 4000;
import { verifyWebhookSignature, type PaymentGatewayAdapter } from './gateway.ts';
import type { PaymentRepository } from './repository.ts';
import type {
  AccountNotification,
  CheckoutRequest,
  CheckoutResult,
  PaymentRecord,
  WebhookEventPayload,
  WebhookProcessResult,
} from './types.ts';

export class MissingIdempotencyKeyError extends Error {
  constructor() {
    super('Header Idempotency-Key é obrigatório para iniciar o checkout.');
    this.name = 'MissingIdempotencyKeyError';
  }
}

export class InvalidWebhookSignatureError extends Error {
  constructor() {
    super('Assinatura HMAC do webhook ausente ou inválida.');
    this.name = 'InvalidWebhookSignatureError';
  }
}

export class InvalidWebhookPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWebhookPayloadError';
  }
}

export class PaymentReservationNotFoundError extends Error {
  constructor() {
    super('Reserva associada ao pagamento não encontrada.');
    this.name = 'PaymentReservationNotFoundError';
  }
}

export class ReservationNotPayableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservationNotPayableError';
  }
}

export class PaymentChargeNotFoundError extends Error {
  constructor() {
    super('Cobrança não localizada para o webhook recebido.');
    this.name = 'PaymentChargeNotFoundError';
  }
}

export class SensitiveCardDataRejectedError extends Error {
  constructor() {
    super('Dados sensíveis completos de cartão (PAN/CVV) não podem trafegar ou ser persistidos.');
    this.name = 'SensitiveCardDataRejectedError';
  }
}

export interface PaymentService {
  initiateCheckout(
    buyerUserId: string,
    idempotencyKey: string | undefined,
    request: CheckoutRequest,
  ): Promise<CheckoutResult>;
  processWebhook(rawBody: string, signatureHeader: string | undefined): Promise<WebhookProcessResult>;
  listNotifications(userId: string): Promise<AccountNotification[]>;
}

export class DefaultPaymentService implements PaymentService {
  private readonly paymentRepository: PaymentRepository;
  private readonly bookingRepository: Pick<BookingRepository, 'findReservationById' | 'findScreeningById'>;
  private readonly bookingService: Pick<BookingService, 'confirmReservation'>;
  private readonly gateway: PaymentGatewayAdapter;
  private readonly webhookSecret: string;
  private readonly now: () => Date;
  private sequence = 0;
  private notificationSequence = 0;
  private readonly inFlightCheckouts = new Map<string, Promise<CheckoutResult>>();
  private webhookQueue: Promise<unknown> = Promise.resolve();

  constructor(
    paymentRepository: PaymentRepository,
    bookingRepository: Pick<BookingRepository, 'findReservationById' | 'findScreeningById'>,
    bookingService: Pick<BookingService, 'confirmReservation'>,
    gateway: PaymentGatewayAdapter,
    webhookSecret: string,
    now: () => Date = () => new Date(),
  ) {
    this.paymentRepository = paymentRepository;
    this.bookingRepository = bookingRepository;
    this.bookingService = bookingService;
    this.gateway = gateway;
    this.webhookSecret = webhookSecret;
    this.now = now;
  }

  async initiateCheckout(
    buyerUserId: string,
    idempotencyKey: string | undefined,
    request: CheckoutRequest,
  ): Promise<CheckoutResult> {
    const cleanKey = idempotencyKey?.trim();
    if (!cleanKey) {
      throw new MissingIdempotencyKeyError();
    }

    assertNoSensitiveCardData(request as unknown as Record<string, unknown>);

    const scopeKey = `${buyerUserId}::${cleanKey}`;
    const inflight = this.inFlightCheckouts.get(scopeKey);
    if (inflight) {
      const result = await inflight;
      return { payment: result.payment, idempotentReplay: true };
    }

    const work = this.executeCheckout(buyerUserId, cleanKey, request);
    this.inFlightCheckouts.set(scopeKey, work);
    try {
      return await work;
    } finally {
      this.inFlightCheckouts.delete(scopeKey);
    }
  }

  private async executeCheckout(
    buyerUserId: string,
    cleanKey: string,
    request: CheckoutRequest,
  ): Promise<CheckoutResult> {
    const existing = await this.paymentRepository.findByIdempotencyKey(buyerUserId, cleanKey);
    if (existing) {
      return { payment: existing, idempotentReplay: true };
    }

    const reservation = await this.bookingRepository.findReservationById(request.reservationId);
    if (!reservation) {
      throw new PaymentReservationNotFoundError();
    }

    if (reservation.buyerUserId !== buyerUserId) {
      throw new ForbiddenError();
    }

    const now = this.now();
    if (reservation.status !== 'ATIVA' || reservation.expiresAt <= now) {
      throw new ReservationNotPayableError(
        'Reserva expirada ou cancelada; não é possível iniciar nova cobrança.',
      );
    }

    const amountCents = await this.resolveServerAmountCents(reservation);

    // Chamada externa ao gateway ocorre estritamente fora de transações críticas de banco (ADR-003).
    const charge = await this.gateway.createSandboxCharge({
      idempotencyKey: cleanKey,
      purchaseId: request.purchaseId,
      reservationId: reservation.id,
      amountCents,
      method: request.method,
      cardToken: request.cardToken,
    });

    this.sequence += 1;
    const payment: PaymentRecord = {
      id: `pay-${this.sequence}`,
      buyerUserId,
      reservationId: reservation.id,
      purchaseId: request.purchaseId,
      idempotencyKey: cleanKey,
      method: request.method,
      amountCents,
      sandboxMode: true,
      gatewayChargeId: charge.gatewayChargeId,
      ...(charge.pixCopyPaste ? { pixCopyPaste: charge.pixCopyPaste } : {}),
      ...(charge.pixQrPayload ? { pixQrPayload: charge.pixQrPayload } : {}),
      ...(request.cardLast4 ? { cardLast4: request.cardLast4.slice(-4) } : {}),
      status: 'PENDENTE',
      ticketEmitted: false,
      createdAt: new Date(now.getTime()),
      updatedAt: new Date(now.getTime()),
    };

    const saved = await this.paymentRepository.savePayment(payment);
    return { payment: saved, idempotentReplay: false };
  }

  async processWebhook(
    rawBody: string,
    signatureHeader: string | undefined,
  ): Promise<WebhookProcessResult> {
    if (!verifyWebhookSignature(rawBody, signatureHeader, this.webhookSecret)) {
      throw new InvalidWebhookSignatureError();
    }

    let payload: WebhookEventPayload;
    try {
      payload = JSON.parse(rawBody) as WebhookEventPayload;
    } catch {
      throw new InvalidWebhookPayloadError('Payload JSON do webhook inválido.');
    }

    if (!payload.eventId || !payload.eventType || !payload.gatewayChargeId || !payload.reservationId) {
      throw new InvalidWebhookPayloadError('Campos obrigatórios do webhook ausentes.');
    }

    return this.runWebhookSerialized(async () => {
      const payment = await this.paymentRepository.findByGatewayChargeId(payload.gatewayChargeId);
      if (!payment) {
        throw new PaymentChargeNotFoundError();
      }

      const alreadyProcessed = await this.paymentRepository.hasProcessedWebhookEvent(payload.eventId);
      if (alreadyProcessed) {
        return {
          duplicate: true,
          payment,
          refundTriggered: false,
        };
      }

      const now = this.now();

      if (payload.eventType === 'PAYMENT_FAILED') {
        const failed: PaymentRecord = {
          ...payment,
          status: 'FALHA_GATEWAY',
          updatedAt: new Date(now.getTime()),
        };
        const saved = await this.paymentRepository.updatePayment(failed);
        await this.paymentRepository.markWebhookEventProcessed(payload.eventId);
        return { duplicate: false, payment: saved, refundTriggered: false };
      }

      if (payment.status === 'APROVADO' || payment.status === 'ESTORNADO_CONFLITO_EXPIRACAO') {
        await this.paymentRepository.markWebhookEventProcessed(payload.eventId);
        return {
          duplicate: true,
          payment,
          refundTriggered: false,
        };
      }

      const confirmOutcome = await this.bookingService.confirmReservation(payload.reservationId);

      if (confirmOutcome.status === 'CONFIRMADA') {
        const approved: PaymentRecord = {
          ...payment,
          status: 'APROVADO',
          ticketEmitted: true,
          updatedAt: new Date(now.getTime()),
        };
        const saved = await this.paymentRepository.updatePayment(approved);
        await this.paymentRepository.markWebhookEventProcessed(payload.eventId);
        await this.recordNotification(
          payment.buyerUserId,
          'PAGAMENTO_APROVADO',
          payment.purchaseId,
          payment.reservationId,
          'Pagamento confirmado com sucesso; ingresso liberado para emissão.',
          now,
        );
        return { duplicate: false, payment: saved, refundTriggered: false };
      }

      // RN-01: Pix tardio após expiração dos 10 min e perda de assento -> CONFLITO_EXPIRACAO + estorno automático idempotente.
      const refundIdempotencyKey = `refund-conflict:${payment.id}`;
      const conflictRecord: PaymentRecord = {
        ...payment,
        status: 'CONFLITO_EXPIRACAO',
        refundIdempotencyKey,
        ticketEmitted: false,
        updatedAt: new Date(now.getTime()),
      };
      await this.paymentRepository.updatePayment(conflictRecord);

      const refundOutput = await this.gateway.refundSandboxCharge({
        gatewayChargeId: payment.gatewayChargeId,
        amountCents: payment.amountCents,
        idempotencyKey: refundIdempotencyKey,
        reason: confirmOutcome.reason,
      });

      const refundedRecord: PaymentRecord = {
        ...conflictRecord,
        status: 'ESTORNADO_CONFLITO_EXPIRACAO',
        refundId: refundOutput.refundId,
        updatedAt: new Date(now.getTime()),
      };
      const saved = await this.paymentRepository.updatePayment(refundedRecord);
      await this.paymentRepository.markWebhookEventProcessed(payload.eventId);
      await this.recordNotification(
        payment.buyerUserId,
        'PIX_TARDIO_ESTORNO',
        payment.purchaseId,
        payment.reservationId,
        `Pagamento confirmado após expiração da reserva de 10 minutos. Estorno automático (${refundOutput.refundId}) realizado.`,
        now,
      );

      return { duplicate: false, payment: saved, refundTriggered: true };
    });
  }

  async listNotifications(userId: string): Promise<AccountNotification[]> {
    return this.paymentRepository.listNotificationsByUser(userId);
  }

  private async resolveServerAmountCents(reservation: SeatReservation): Promise<number> {
    const unitPriceCents = (reservation as SeatReservation & { unitPriceCents?: number }).unitPriceCents;
    if (typeof unitPriceCents === 'number' && Number.isInteger(unitPriceCents) && unitPriceCents > 0) {
      return unitPriceCents;
    }
    const screening = (await this.bookingRepository.findScreeningById(reservation.screeningId)) as
      | { basePriceCents?: number; basePrice?: number }
      | null;
    if (screening?.basePriceCents && Number.isInteger(screening.basePriceCents)) {
      return screening.basePriceCents;
    }
    if (screening?.basePrice && Number.isFinite(screening.basePrice)) {
      return Math.round(screening.basePrice * 100);
    }
    return DEFAULT_TICKET_PRICE_CENTS;
  }

  private async recordNotification(
    userId: string,
    type: AccountNotification['type'],
    purchaseId: string,
    reservationId: string,
    message: string,
    now: Date,
  ): Promise<void> {
    this.notificationSequence += 1;
    await this.paymentRepository.addNotification({
      id: `notif-${this.notificationSequence}`,
      userId,
      type,
      purchaseId,
      reservationId,
      message,
      createdAt: new Date(now.getTime()),
    });
  }

  private runWebhookSerialized<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.webhookQueue.then(fn, fn);
    this.webhookQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}

function assertNoSensitiveCardData(payload: Record<string, unknown>): void {
  const forbiddenKeys = ['cardNumber', 'pan', 'cvv', 'cvc', 'securityCode'];
  for (const key of forbiddenKeys) {
    if (key in payload && payload[key] !== undefined) {
      throw new SensitiveCardDataRejectedError();
    }
  }
}
