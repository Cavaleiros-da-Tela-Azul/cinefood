import { ForbiddenError } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import {
  CancellationNotEligibleError,
  type CdcCancellationResult,
  type CdcCancellationService,
} from './cdc-cancellation.ts';
import {
  InvalidManagementInputError,
  ManagementEntityNotFoundError,
  type ManagementService,
} from './service.ts';
import type {
  ManagedCanteenItem,
  ManagedMovie,
  ManagedOperator,
  ManagedRoom,
  ManagedScreening,
  ManagementSalesSummary,
  RoomSeatMapConfig,
  ScreeningOccupancyReport,
  ScreeningStatus,
} from './types.ts';

export type HttpResult<T> = { status: number; body: T };

function handleManagementError(error: unknown): HttpResult<{ error: string }> {
  if (error instanceof ForbiddenError) {
    return { status: 403, body: { error: error.message } };
  }
  if (error instanceof ManagementEntityNotFoundError) {
    return { status: 404, body: { error: error.message } };
  }
  if (error instanceof InvalidManagementInputError) {
    return { status: 422, body: { error: error.message } };
  }
  throw error;
}

export async function putAdminMovie(
  service: ManagementService,
  session: AuthenticatedSession,
  input: ManagedMovie,
): Promise<HttpResult<ManagedMovie | { error: string }>> {
  try {
    return { status: 200, body: await service.upsertMovie(session, input) };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function putAdminRoom(
  service: ManagementService,
  session: AuthenticatedSession,
  input: ManagedRoom,
): Promise<HttpResult<ManagedRoom | { error: string }>> {
  try {
    return { status: 200, body: await service.upsertRoom(session, input) };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function putAdminRoomSeatMap(
  service: ManagementService,
  session: AuthenticatedSession,
  roomId: string,
  seatMapConfig: RoomSeatMapConfig,
): Promise<HttpResult<ManagedRoom | { error: string }>> {
  try {
    return { status: 200, body: await service.updateRoomSeatMap(session, roomId, seatMapConfig) };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function putAdminOperator(
  service: ManagementService,
  session: AuthenticatedSession,
  input: Omit<ManagedOperator, 'updatedAt'>,
): Promise<HttpResult<ManagedOperator | { error: string }>> {
  try {
    return { status: 200, body: await service.upsertOperator(session, input) };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function getAdminOperators(
  service: ManagementService,
  session: AuthenticatedSession,
): Promise<HttpResult<ManagedOperator[] | { error: string }>> {
  try {
    return { status: 200, body: await service.listOperators(session) };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function postAdminScreening(
  service: ManagementService,
  session: AuthenticatedSession,
  input: {
    screeningId: string;
    movieId: string;
    roomId: string;
    startsAt: string;
    endsAt: string;
    format: string;
    basePriceCents: number;
    status?: ScreeningStatus;
  },
): Promise<HttpResult<ManagedScreening | { error: string }>> {
  try {
    return { status: 201, body: await service.createScreening(session, input) };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function patchAdminScreening(
  service: ManagementService,
  session: AuthenticatedSession,
  screeningId: string,
  patch: {
    basePriceCents?: number;
    startsAt?: string;
    endsAt?: string;
    status?: ScreeningStatus;
  },
): Promise<HttpResult<ManagedScreening | { error: string }>> {
  try {
    return { status: 200, body: await service.updateScreening(session, screeningId, patch) };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function putAdminCanteenItem(
  service: ManagementService,
  session: AuthenticatedSession,
  input: {
    productId: string;
    name: string;
    category: string;
    unitPriceCents: number;
    availableStock: number;
    active: boolean;
  },
): Promise<HttpResult<ManagedCanteenItem | { error: string }>> {
  try {
    return { status: 200, body: await service.upsertCanteenItem(session, input) };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function patchAdminCanteenItemPrice(
  service: ManagementService,
  session: AuthenticatedSession,
  productId: string,
  unitPriceCents: number,
): Promise<HttpResult<ManagedCanteenItem | { error: string }>> {
  try {
    return {
      status: 200,
      body: await service.updateCanteenItemPrice(session, productId, unitPriceCents),
    };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function getAdminOccupancyReport(
  service: ManagementService,
  session: AuthenticatedSession,
  screeningId: string,
): Promise<HttpResult<ScreeningOccupancyReport | { error: string }>> {
  try {
    return {
      status: 200,
      body: await service.getScreeningOccupancyReport(session, screeningId),
    };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function getAdminSalesDashboard(
  service: ManagementService,
  session: AuthenticatedSession,
): Promise<HttpResult<ManagementSalesSummary | { error: string }>> {
  try {
    return { status: 200, body: await service.getSalesAndOccupancySummary(session) };
  } catch (error) {
    return handleManagementError(error);
  }
}

export async function getPublicScreeningQuote(
  service: ManagementService,
  screeningId: string,
): Promise<
  HttpResult<{ screeningId: string; fullPriceCents: number; halfPriceCents: number } | { error: string }>
> {
  try {
    return { status: 200, body: await service.quoteCurrentScreeningPrice(screeningId) };
  } catch (error) {
    return handleManagementError(error);
  }
}

/**
 * POST /tickets/:ticketId/cancel-cdc — Arrependimento CDC e janela de corte de 2h (RF-12 / RN-04).
 */
export async function postCancelTicketCdc(
  service: CdcCancellationService,
  session: AuthenticatedSession,
  ticketId: string,
): Promise<HttpResult<CdcCancellationResult | { error: string }>> {
  try {
    return { status: 200, body: await service.cancelTicketWithCdcRefund(session, ticketId) };
  } catch (error) {
    if (error instanceof CancellationNotEligibleError) {
      return { status: 422, body: { error: error.message } };
    }
    return handleManagementError(error);
  }
}
