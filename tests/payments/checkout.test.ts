import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryBookingRepository } from '../../src/modules/booking/repository.ts';
import { postReservation } from '../../src/modules/booking/routes.ts';
import { DefaultBookingService } from '../../src/modules/booking/service.ts';
import type { SeatReservation } from '../../src/modules/booking/types.ts';
import type { AuthenticatedSession } from '../../src/modules/identity/types.ts';
import {
  SandboxPaymentGatewayAdapter,
  signWebhookPayload,
} from '../../src/modules/payments/gateway.ts';
import { InMemoryPaymentRepository } from '../../src/modules/payments/repository.ts';
import {
  getPaymentNotifications,
  postPaymentCheckout,
  postPaymentWebhook,
} from '../../src/modules/payments/routes.ts';
import { DefaultPaymentService } from '../../src/modules/payments/service.ts';
import type {
  AccountNotification,
  CheckoutResult,
  WebhookProcessResult,
} from '../../src/modules/payments/types.ts';

const WEBHOOK_SECRET = 'cinefood-sandbox-webhook-secret-2026';

function createSession(userId: string): AuthenticatedSession {
  return {
    userId,
    email: `${userId}@cinefood.example`,
    role: 'CLIENTE',
    iat: 1_893_456_000,
    exp: 1_893_460_000,
  };
}

function createFixture() {
  let currentTime = new Date('2030-07-01T15:00:00.000Z');
  const nowFn = () => new Date(currentTime.getTime());

  const bookingRepo = new InMemoryBookingRepository(
    [
      {
        id: 'session-pay-1',
        roomId: 'room-imax',
        startsAt: new Date('2030-07-01T20:00:00.000Z'),
        status: 'ATIVA',
      },
    ],
    [
      { id: 'seat-e5', screeningId: 'session-pay-1', row: 'E', number: 5, state: 'DISPONIVEL' },
      { id: 'seat-e6', screeningId: 'session-pay-1', row: 'E', number: 6, state: 'DISPONIVEL' },
    ],
  );
  const bookingService = new DefaultBookingService(bookingRepo, nowFn);
  const paymentRepo = new InMemoryPaymentRepository();
  const gateway = new SandboxPaymentGatewayAdapter();
  const paymentService = new DefaultPaymentService(
    paymentRepo,
    bookingRepo,
    bookingService,
    gateway,
    WEBHOOK_SECRET,
    nowFn,
  );

  return {
    bookingRepo,
    bookingService,
    paymentRepo,
    gateway,
    paymentService,
    setCurrentTime(iso: string) {
      currentTime = new Date(iso);
    },
  };
}

describe('Checkout e Pagamento com Idempotência (RF-04 / MAR-02)', () => {
  it('AC-3: requisições e webhooks repetidos não duplicam operação e eventos inválidos são rejeitados', async () => {
    const { bookingService, gateway, paymentService } = createFixture();
    const buyer = createSession('buyer-idem-1');

    const resResponse = await postReservation(bookingService, buyer, {
      screeningId: 'session-pay-1',
      seatId: 'seat-e5',
      purchaseId: 'purchase-idem-1',
      channel: 'WEB',
    });
    assert.equal(resResponse.status, 200);
    const reservation = resResponse.body as SeatReservation;

    // Sem Idempotency-Key deve rejeitar com HTTP 400
    const missingKey = await postPaymentCheckout(paymentService, buyer, {}, {
      reservationId: reservation.id,
      purchaseId: 'purchase-idem-1',
      method: 'PIX',
    });
    assert.equal(missingKey.status, 400);

    // Payload com dados completos de cartão (PAN/CVV) deve ser recusado (RNF-02)
    const sensitiveAttempt = await postPaymentCheckout(
      paymentService,
      buyer,
      { 'Idempotency-Key': 'idem-sensitive' },
      {
        reservationId: reservation.id,
        purchaseId: 'purchase-idem-1',
        method: 'CARD',
        cardNumber: '4111111111111111',
      } as unknown as Parameters<typeof postPaymentCheckout>[3],
    );
    assert.equal(sensitiveAttempt.status, 400);

    // Submissão repetida da mesma Idempotency-Key retorna payload original sem duplicar cobrança
    const firstCheckout = await postPaymentCheckout(
      paymentService,
      buyer,
      { 'Idempotency-Key': 'checkout-key-001' },
      {
        reservationId: reservation.id,
        purchaseId: 'purchase-idem-1',
        method: 'PIX',
        amountCents: 1, // ignorado pelo servidor
      },
    );
    assert.equal(firstCheckout.status, 201);
    const firstBody = firstCheckout.body as CheckoutResult;
    assert.equal(firstBody.idempotentReplay, false);
    assert.equal(firstBody.payment.amountCents, 4000);
    assert.equal(firstBody.payment.sandboxMode, true);
    assert.equal(firstBody.payment.status, 'PENDENTE');
    assert.equal(gateway.chargeCreateCalls, 1);

    const replayCheckout = await postPaymentCheckout(
      paymentService,
      buyer,
      { 'Idempotency-Key': 'checkout-key-001' },
      {
        reservationId: reservation.id,
        purchaseId: 'purchase-idem-1',
        method: 'PIX',
      },
    );
    assert.equal(replayCheckout.status, 200);
    const replayBody = replayCheckout.body as CheckoutResult;
    assert.equal(replayBody.idempotentReplay, true);
    assert.equal(replayBody.payment.gatewayChargeId, firstBody.payment.gatewayChargeId);
    assert.equal(gateway.chargeCreateCalls, 1);

    // Webhook sem assinatura ou com assinatura adulterada é rejeitado com HTTP 401 mantendo estado PENDENTE
    const rawWebhook = JSON.stringify({
      eventId: 'evt-approved-1',
      eventType: 'PAYMENT_APPROVED',
      gatewayChargeId: firstBody.payment.gatewayChargeId,
      reservationId: reservation.id,
    });

    const unsignedWebhook = await postPaymentWebhook(paymentService, rawWebhook, {});
    assert.equal(unsignedWebhook.status, 401);

    const tamperedWebhook = await postPaymentWebhook(paymentService, rawWebhook, {
      'x-webhook-signature': 'deadbeef00000000',
    });
    assert.equal(tamperedWebhook.status, 401);

    // Webhook assinado aprova pagamento e confirma assento; repetição do mesmo evento é idempotente
    const validSig = signWebhookPayload(rawWebhook, WEBHOOK_SECRET);
    const webhookOk = await postPaymentWebhook(paymentService, rawWebhook, {
      'x-webhook-signature': validSig,
    });
    assert.equal(webhookOk.status, 200);
    const webhookBody = webhookOk.body as WebhookProcessResult;
    assert.equal(webhookBody.duplicate, false);
    assert.equal(webhookBody.payment.status, 'APROVADO');
    assert.equal(webhookBody.refundTriggered, false);

    const webhookDuplicate = await postPaymentWebhook(paymentService, rawWebhook, {
      'x-webhook-signature': validSig,
    });
    assert.equal(webhookDuplicate.status, 200);
    assert.equal((webhookDuplicate.body as WebhookProcessResult).duplicate, true);
    assert.equal(gateway.refundCalls, 0);
  });

  it('AC-4: pagamento tardio (Pix tardio) com assento já ocupado aciona compensação e estorno automático', async () => {
    const { bookingRepo, bookingService, gateway, paymentService, setCurrentTime } = createFixture();
    const buyerA = createSession('buyer-pix-tardio-A');
    const buyerB = createSession('buyer-pix-novo-B');

    // 1. Comprador A reserva seat-e6 às 15:00 e inicia checkout Pix
    const resA = await postReservation(bookingService, buyerA, {
      screeningId: 'session-pay-1',
      seatId: 'seat-e6',
      purchaseId: 'purchase-A',
      channel: 'WEB',
    });
    assert.equal(resA.status, 200);
    const reservationA = resA.body as SeatReservation;

    const checkoutA = await postPaymentCheckout(
      paymentService,
      buyerA,
      { 'Idempotency-Key': 'checkout-A-pix' },
      {
        reservationId: reservationA.id,
        purchaseId: 'purchase-A',
        method: 'PIX',
      },
    );
    assert.equal(checkoutA.status, 201);
    const paymentA = (checkoutA.body as CheckoutResult).payment;

    // 2. Passam 11 minutos (trava de A expira); Comprador B reserva e confirma seat-e6
    setCurrentTime('2030-07-01T15:11:00.000Z');
    const resB = await postReservation(bookingService, buyerB, {
      screeningId: 'session-pay-1',
      seatId: 'seat-e6',
      purchaseId: 'purchase-B',
      channel: 'ANDROID',
    });
    assert.equal(resB.status, 200);
    const reservationB = resB.body as SeatReservation;

    const checkoutB = await postPaymentCheckout(
      paymentService,
      buyerB,
      { 'Idempotency-Key': 'checkout-B-card' },
      {
        reservationId: reservationB.id,
        purchaseId: 'purchase-B',
        method: 'CARD',
        cardToken: 'tok_sandbox_ok',
        cardLast4: '4242',
      },
    );
    assert.equal(checkoutB.status, 201);
    const paymentB = (checkoutB.body as CheckoutResult).payment;

    const rawWebhookB = JSON.stringify({
      eventId: 'evt-B-approved',
      eventType: 'PAYMENT_APPROVED',
      gatewayChargeId: paymentB.gatewayChargeId,
      reservationId: reservationB.id,
    });
    const webhookB = await postPaymentWebhook(paymentService, rawWebhookB, {
      'x-webhook-signature': signWebhookPayload(rawWebhookB, WEBHOOK_SECRET),
    });
    assert.equal(webhookB.status, 200);
    assert.equal((webhookB.body as WebhookProcessResult).payment.status, 'APROVADO');

    // 3. Webhook tardio de A chega às 15:12 (assento já ocupado por B) -> RN-01: estorno automático idempotente
    setCurrentTime('2030-07-01T15:12:00.000Z');
    const rawWebhookA = JSON.stringify({
      eventId: 'evt-A-late-pix',
      eventType: 'PAYMENT_APPROVED',
      gatewayChargeId: paymentA.gatewayChargeId,
      reservationId: reservationA.id,
    });
    const sigA = signWebhookPayload(rawWebhookA, WEBHOOK_SECRET);

    const lateResult = await postPaymentWebhook(paymentService, rawWebhookA, {
      'x-webhook-signature': sigA,
    });
    assert.equal(lateResult.status, 200);
    const lateBody = lateResult.body as WebhookProcessResult;
    assert.equal(lateBody.refundTriggered, true);
    assert.equal(lateBody.payment.status, 'ESTORNADO_CONFLITO_EXPIRACAO');
    assert.ok(lateBody.payment.refundId);
    assert.equal(gateway.refundCalls, 1);

    // Reenvio duplicado do webhook tardio não dispara segundo estorno
    const lateReplay = await postPaymentWebhook(paymentService, rawWebhookA, {
      'x-webhook-signature': sigA,
    });
    assert.equal(lateReplay.status, 200);
    assert.equal((lateReplay.body as WebhookProcessResult).duplicate, true);
    assert.equal(gateway.refundCalls, 1);

    // Assento permanece ocupado por B e reserva A marcada como CONFLITO_EXPIRACAO
    const finalSeat = await bookingRepo.findSeat('session-pay-1', 'seat-e6');
    assert.equal(finalSeat?.state, 'OCUPADO');
    assert.equal(finalSeat?.occupiedByUserId, 'buyer-pix-novo-B');

    const finalResA = await bookingRepo.findReservationById(reservationA.id);
    assert.equal(finalResA?.status, 'CONFLITO_EXPIRACAO');

    // Notificação registrada no histórico da conta de A
    const notificationsA = await getPaymentNotifications(paymentService, buyerA);
    assert.equal(notificationsA.status, 200);
    const items = notificationsA.body as AccountNotification[];
    assert.equal(items.length, 1);
    assert.equal(items[0].type, 'PIX_TARDIO_ESTORNO');
    assert.equal(items[0].purchaseId, 'purchase-A');
  });
});
