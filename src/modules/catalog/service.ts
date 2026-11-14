import type { CatalogRepository } from './repository.ts';
import type { ProgrammedScreening, SeatMapSeat, ScreeningFilters, StoredSeat } from './types.ts';

export class ScreeningUnavailableError extends Error {
  constructor() {
    super('Sessão encerrada, inativa ou inexistente.');
    this.name = 'ScreeningUnavailableError';
  }
}

export interface CatalogService {
  getSeatMap(screeningId: string): Promise<SeatMapSeat[]>;
  listScreenings(filters?: ScreeningFilters): Promise<ProgrammedScreening[]>;
  assertScreeningAvailable(screeningId: string): Promise<void>;
}

export class DefaultCatalogService implements CatalogService {
  private readonly repository: CatalogRepository;
  private readonly now: () => Date;

  constructor(
    repository: CatalogRepository,
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository;
    this.now = now;
  }

  async getSeatMap(screeningId: string): Promise<SeatMapSeat[]> {
    const now = this.now();
    await this.assertScreeningAvailable(screeningId, now);

    const seats = await this.repository.findSeatsByScreening(screeningId);
    return seats
      .map((seat) => toCurrentSeatState(seat, now))
      .sort((left, right) => left.row.localeCompare(right.row) || left.number - right.number);
  }

  async listScreenings(filters: ScreeningFilters = {}): Promise<ProgrammedScreening[]> {
    const now = this.now();
    const screenings = await this.repository.findProgrammedScreenings(filters);
    return screenings
      .filter((screening) => screening.status === 'ATIVA' && screening.startsAt > now)
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  }

  async assertScreeningAvailable(screeningId: string, now = this.now()): Promise<void> {
    const screening = await this.repository.findScreeningById(screeningId);
    if (!screening || screening.status !== 'ATIVA' || screening.startsAt <= now) {
      throw new ScreeningUnavailableError();
    }
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
    category: seat.category ?? 'standard',
  };
}
