import { ForbiddenError } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import {
  CanteenCatalogItemUnavailableError,
  CanteenEmptyCartError,
  CanteenInsufficientStockError,
  CanteenOrderNotFoundError,
  CanteenOrderStateError,
  type CanteenService,
} from './service.ts';
import type {
  CanteenCartItemInput,
  CanteenCheckoutInput,
  CanteenMenuItemView,
  CanteenOrder,
  CanteenQuoteResult,
} from './types.ts';

export type HttpResult<T> = { status: number; body: T };

/**
 * GET /canteen/menu — Cardápio da cantina com combos, adicionais e estoque (RF-07).
 */
export async function getCanteenMenu(
  service: CanteenService,
): Promise<HttpResult<CanteenMenuItemView[]>> {
  const menu = await service.listMenu();
  return { status: 200, body: menu };
}

/**
 * POST /canteen/quote — Recálculo oficial server-side de carrinho e adicionais (RF-07 / AC-1).
 */
export async function postCanteenQuote(
  service: CanteenService,
  items: CanteenCartItemInput[],
): Promise<HttpResult<CanteenQuoteResult | { error: string }>> {
  try {
    const quote = await service.quoteCart(items);
    return { status: 200, body: quote };
  } catch (error) {
    if (
      error instanceof CanteenEmptyCartError ||
      error instanceof CanteenCatalogItemUnavailableError
    ) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * POST /canteen/checkout — Checkout da cantina com reserva atômica de estoque (RF-08 / AC-2).
 */
export async function postCanteenCheckout(
  service: CanteenService,
  session: AuthenticatedSession,
  input: CanteenCheckoutInput,
): Promise<HttpResult<CanteenOrder | { error: string }>> {
  try {
    const order = await service.checkoutOrder(session, input);
    return { status: 201, body: order };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof CanteenInsufficientStockError) {
      return { status: 409, body: { error: error.message } };
    }
    if (
      error instanceof CanteenEmptyCartError ||
      error instanceof CanteenCatalogItemUnavailableError
    ) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * POST /canteen/orders/:orderId/confirm-payment — Baixa definitiva pós-liquidação (RF-08).
 */
export async function postConfirmCanteenPayment(
  service: CanteenService,
  orderId: string,
): Promise<HttpResult<CanteenOrder | { error: string }>> {
  try {
    const order = await service.confirmOrderPayment(orderId);
    return { status: 200, body: order };
  } catch (error) {
    if (error instanceof CanteenOrderNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    if (error instanceof CanteenOrderStateError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * POST /canteen/orders/:orderId/compensate — Estorno de estoque em falha/expiração de pagamento.
 */
export async function postCompensateCanteenPayment(
  service: CanteenService,
  orderId: string,
  reason: 'EXPIRADO' | 'FALHOU',
): Promise<HttpResult<CanteenOrder | { error: string }>> {
  try {
    const order = await service.compensateOrderPaymentFailure(orderId, reason);
    return { status: 200, body: order };
  } catch (error) {
    if (error instanceof CanteenOrderNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    if (error instanceof CanteenOrderStateError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}
