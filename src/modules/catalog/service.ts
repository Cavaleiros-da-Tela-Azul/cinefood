import type { CatalogRepository } from './repository.ts';
import type { SeatMapSeat, StoredSeat } from './types.ts';

export class ScreeningUnavailableError extends Error {
  constructor() {
    super('Sessão encerrada, inativa ou inexistente.');
    this.name = 'ScreeningUnavailableError';
  }
}

export interface CatalogService {
  getSeatMap(screeningId: string): Promise<SeatMapSeat[]>;
}

export class DefaultCatalogService implements CatalogService {
  constructor(
    private readonly repository: CatalogRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getSeatMap(screeningId: string): Promise<SeatMapSeat[]> {
    const screening = await this.repository.findScreeningById(screeningId);
    const now = this.now();
    if (!screening || screening.status !== 'ATIVA' || screening.startsAt <= now) {
      throw new ScreeningUnavailableError();
    }

    const seats = await this.repository.findSeatsByScreening(screeningId);
    return seats
      .map((seat) => toCurrentSeatState(seat, now))
      .sort((left, right) => left.row.localeCompare(right.row) || left.number - right.number);
  }
}

function toCurrentSeatState(seat: StoredSeat, now: Date): SeatMapSeat {
  const expiredTemporaryHold = seat.state === 'RESERVADO'
    && seat.temporaryHoldExpiresAt !== undefined
    && seat.temporaryHoldExpiresAt <= now;
  return {
    id: seat.id,
    row: seat.row,
    number: seat.number,
    state: expiredTemporaryHold ? 'DISPONIVEL' : seat.state,
  };
}
