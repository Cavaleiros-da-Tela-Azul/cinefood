import type { Screening, StoredSeat } from './types.ts';

export interface CatalogRepository {
  findScreeningById(screeningId: string): Promise<Screening | null>;
  findSeatsByScreening(screeningId: string): Promise<StoredSeat[]>;
}

/** In-memory adapter used by the composition root and deterministic tests. */
export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly screenings = new Map<string, Screening>();
  private readonly seats: StoredSeat[];

  constructor(screenings: Screening[] = [], seats: StoredSeat[] = []) {
    for (const screening of screenings) this.screenings.set(screening.id, { ...screening });
    this.seats = seats.map((seat) => ({ ...seat }));
  }

  async findScreeningById(screeningId: string): Promise<Screening | null> {
    const screening = this.screenings.get(screeningId);
    return screening ? { ...screening } : null;
  }

  async findSeatsByScreening(screeningId: string): Promise<StoredSeat[]> {
    return this.seats
      .filter((seat) => seat.screeningId === screeningId)
      .map((seat) => ({ ...seat }));
  }
}
