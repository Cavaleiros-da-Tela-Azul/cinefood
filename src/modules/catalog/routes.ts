import { ScreeningUnavailableError, type CatalogService } from './service.ts';
import type { ProgrammedScreening, SeatMapSeat, ScreeningFilters } from './types.ts';

export type HttpResult<T> = { status: number; body: T };

/** HTTP-neutral query handler, shared by web, mobile and box-office channels. */
export async function getSeatMap(
  service: CatalogService,
  screeningId: string,
): Promise<HttpResult<SeatMapSeat[] | { error: string }>> {
  try {
    return { status: 200, body: await service.getSeatMap(screeningId) };
  } catch (error) {
    if (error instanceof ScreeningUnavailableError) {
      return { status: 409, body: { error: error.message } };
    }
    throw error;
  }
}

/** GET /screenings */
export async function getScreenings(
  service: CatalogService,
  filters: ScreeningFilters = {},
): Promise<HttpResult<ProgrammedScreening[]>> {
  return { status: 200, body: await service.listScreenings(filters) };
}

/** Guard used before creating a reservation or beginning a purchase. */
export async function beginScreeningSelection(
  service: CatalogService,
  screeningId: string,
): Promise<HttpResult<{ screeningId: string } | { error: string }>> {
  try {
    await service.assertScreeningAvailable(screeningId);
    return { status: 200, body: { screeningId } };
  } catch (error) {
    if (error instanceof ScreeningUnavailableError) {
      return { status: 409, body: { error: error.message } };
    }
    throw error;
  }
}
