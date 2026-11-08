import { ScreeningUnavailableError, type CatalogService } from './service.ts';
import type { SeatMapSeat } from './types.ts';

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
