import { ForbiddenError } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import {
  EmptyTicketSeatsError,
  PaymentNotConfirmedForTicketError,
  TicketAlreadyUsedError,
  TicketCancelledError,
  TicketNotFoundError,
  TicketPurchaseNotFoundError,
  TicketSessionExpiredError,
  TicketWrongScreeningError,
  type TicketsService,
} from './service.ts';
import type {
  IssuedTicket,
  IssueTicketsInput,
  IssueTicketsResult,
  ValidateQrInput,
  ValidateQrResult,
} from './types.ts';

export type HttpResult<T> = { status: number; body: T };

/**
 * Emissão de ingressos individuais pós-liquidação confirmada (RF-05).
 */
export async function postIssueTickets(
  service: TicketsService,
  input: IssueTicketsInput,
): Promise<HttpResult<IssueTicketsResult | { error: string }>> {
  try {
    const result = await service.issueTicketsForPaidOrder(input);
    return { status: 201, body: result };
  } catch (error) {
    if (
      error instanceof PaymentNotConfirmedForTicketError ||
      error instanceof EmptyTicketSeatsError
    ) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * GET /purchases/:purchaseId/tickets — retorna os QR Codes emitidos somente ao titular.
 */
export async function getTicketsForPurchase(
  service: TicketsService,
  session: AuthenticatedSession,
  purchaseId: string,
): Promise<HttpResult<IssuedTicket[] | { error: string }>> {
  try {
    const tickets = await service.getTicketPassByPurchase(session, purchaseId);
    return { status: 200, body: tickets };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof TicketPurchaseNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * POST /gate/validate — Consumo atômico único de QR Code na portaria e gatilho RN-02.
 */
export async function postGateValidateTicket(
  service: TicketsService,
  session: AuthenticatedSession,
  input: ValidateQrInput,
): Promise<HttpResult<ValidateQrResult | { error: string }>> {
  try {
    const result = await service.validateTicketAtGate(session, input);
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof TicketNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    if (error instanceof TicketAlreadyUsedError) {
      return { status: 409, body: { error: error.message } };
    }
    if (
      error instanceof TicketCancelledError ||
      error instanceof TicketWrongScreeningError ||
      error instanceof TicketSessionExpiredError
    ) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}
