import { authenticatedUserId, ForbiddenError } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import {
  InvalidWebhookPayloadError,
  InvalidWebhookSignatureError,
  MissingIdempotencyKeyError,
  PaymentChargeNotFoundError,
  PaymentReservationNotFoundError,
  ReservationNotPayableError,
  SensitiveCardDataRejectedError,
  type PaymentService,
} from './service.ts';
import type {
  AccountNotification,
  CheckoutRequest,
  CheckoutResult,
  WebhookProcessResult,
} from './types.ts';

export type HttpResult<T> = { status: number; body: T };

function readHeader(
  headers: Record<string, string | undefined>,
  name: string,
): string | undefined {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) {
      return v;
    }
  }
  return undefined;
}

/**
 * POST /payments/checkout — Inicia cobrança Sandbox exigindo `Idempotency-Key` (RF-04 / ADR-003).
 */
export async function postPaymentCheckout(
  service: PaymentService,
  session: AuthenticatedSession,
  headers: Record<string, string | undefined>,
  request: CheckoutRequest,
): Promise<HttpResult<CheckoutResult | { error: string }>> {
  try {
    const idempotencyKey = readHeader(headers, 'Idempotency-Key');
    const result = await service.initiateCheckout(
      authenticatedUserId(session),
      idempotencyKey,
      request,
    );
    return { status: result.idempotentReplay ? 200 : 201, body: result };
  } catch (error) {
    if (error instanceof MissingIdempotencyKeyError || error instanceof SensitiveCardDataRejectedError) {
      return { status: 400, body: { error: error.message } };
    }
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof PaymentReservationNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    if (error instanceof ReservationNotPayableError) {
      return { status: 409, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * POST /payments/webhooks — Recebe notificações assinadas HMAC-SHA256 do provedor (ADR-003 / RN-01).
 */
export async function postPaymentWebhook(
  service: PaymentService,
  rawBody: string,
  headers: Record<string, string | undefined>,
): Promise<HttpResult<WebhookProcessResult | { error: string }>> {
  try {
    const signature = readHeader(headers, 'x-webhook-signature');
    const result = await service.processWebhook(rawBody, signature);
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      return { status: 401, body: { error: error.message } };
    }
    if (error instanceof InvalidWebhookPayloadError) {
      return { status: 400, body: { error: error.message } };
    }
    if (error instanceof PaymentChargeNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * GET /payments/notifications — Consulta avisos de estorno/pagamento da própria conta autenticada.
 */
export async function getPaymentNotifications(
  service: PaymentService,
  session: AuthenticatedSession,
): Promise<HttpResult<AccountNotification[]>> {
  return { status: 200, body: await service.listNotifications(authenticatedUserId(session)) };
}
