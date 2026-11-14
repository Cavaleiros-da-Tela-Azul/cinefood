import { authenticatedUserId, authorize, ForbiddenError } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import {
  InvalidAssistedSaleError,
  InvalidTicketPricingError,
  ReservationNotFoundError,
  ScreeningUnavailableError,
  SeatConflictError,
  SeatNotFoundError,
  type BookingService,
} from './service.ts';
import type {
  AssistedReserveSeatRequest,
  ConfirmReservationResult,
  ReserveSeatRequest,
  SeatReservation,
  TicketPricingInput,
  TicketPricingResult,
} from './types.ts';

export type HttpResult<T> = { status: number; body: T };

/**
 * POST /reservations — Reserva exclusiva de poltrona com trava de 10 minutos (RF-03 / ADR-002).
 * Compartilhada entre os canais web, mobile/Android e bilheteria (ADR-004).
 */
export async function postReservation(
  service: BookingService,
  session: AuthenticatedSession,
  request: ReserveSeatRequest,
): Promise<HttpResult<SeatReservation | { error: string }>> {
  try {
    const reservation = await service.reserveSeat({
      screeningId: request.screeningId,
      seatId: request.seatId,
      buyerUserId: authenticatedUserId(session),
      purchaseId: request.purchaseId,
      channel: request.channel,
      ...(request.ticketCategory
        ? {
            pricing: {
              category: request.ticketCategory,
              halfPriceDocumentType: request.halfPriceDocumentType,
              halfPriceDocumentCode: request.halfPriceDocumentCode,
              clientUnitPriceCents: request.clientUnitPriceCents,
            },
          }
        : {}),
    });
    return { status: 200, body: reservation };
  } catch (error) {
    if (error instanceof SeatConflictError || error instanceof ScreeningUnavailableError) {
      return { status: 409, body: { error: error.message } };
    }
    if (error instanceof SeatNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    if (error instanceof InvalidTicketPricingError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * POST /box-office/reservations — Venda assistida na bilheteria (RF-14 / ADR-004).
 * Exige papel OPERADOR_BILHETERIA ou ADMIN_CINEMA, registra operador + comprador,
 * calcula categoria no servidor e compartilha a mesma trava sem emitir bilhete antes do pagamento.
 */
export async function postAssistedReservation(
  service: BookingService,
  session: AuthenticatedSession,
  request: AssistedReserveSeatRequest,
): Promise<HttpResult<SeatReservation | { error: string }>> {
  try {
    authorize({ session, operation: 'ASSISTED_BOOKING' });
    const reservation = await service.reserveAssistedSeat({
      screeningId: request.screeningId,
      seatId: request.seatId,
      purchaseId: request.purchaseId,
      operatorUserId: authenticatedUserId(session),
      buyerUserId: request.buyerUserId,
      buyerDocument: request.buyerDocument,
      pricing: {
        category: request.ticketCategory,
        halfPriceDocumentType: request.halfPriceDocumentType,
        halfPriceDocumentCode: request.halfPriceDocumentCode,
        clientUnitPriceCents: request.clientUnitPriceCents,
      },
    });
    return { status: 200, body: reservation };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof SeatConflictError || error instanceof ScreeningUnavailableError) {
      return { status: 409, body: { error: error.message } };
    }
    if (error instanceof SeatNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    if (error instanceof InvalidTicketPricingError || error instanceof InvalidAssistedSaleError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * POST /screenings/:id/quote — Recálculo oficial de categorias de ingresso no servidor (RF-16).
 */
export async function postTicketPricingQuote(
  service: BookingService,
  screeningId: string,
  input: TicketPricingInput,
): Promise<HttpResult<TicketPricingResult | { error: string }>> {
  try {
    const pricing = await service.calculateTicketPricing(screeningId, input, {
      ignoreClientPrice: true,
    });
    return { status: 200, body: pricing };
  } catch (error) {
    if (error instanceof ScreeningUnavailableError) {
      return { status: 409, body: { error: error.message } };
    }
    if (error instanceof InvalidTicketPricingError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * Confirmação transacional da reserva após aprovação do pagamento (RF-03 / RN-01).
 * Caso a reserva tenha expirado e o assento já pertença a outro comprador, preserva
 * a nova reserva e retorna HTTP 409 com encaminhamento para estorno automático.
 */
export async function confirmSeatReservation(
  service: BookingService,
  reservationId: string,
): Promise<HttpResult<ConfirmReservationResult | { error: string }>> {
  try {
    const result = await service.confirmReservation(reservationId);
    return {
      status: result.status === 'CONFIRMADA' ? 200 : 409,
      body: result,
    };
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    throw error;
  }
}

/** Liberação explícita de reserva ativa pelo titular antes da expiração. */
export async function cancelSeatReservation(
  service: BookingService,
  session: AuthenticatedSession,
  reservationId: string,
): Promise<HttpResult<SeatReservation | { error: string }>> {
  try {
    const reservation = await service.cancelReservation(
      reservationId,
      authenticatedUserId(session),
    );
    return { status: 200, body: reservation };
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    throw error;
  }
}
