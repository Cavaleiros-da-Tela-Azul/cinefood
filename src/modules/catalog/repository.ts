import type { ProgrammedScreening, Screening, ScreeningFilters, StoredSeat } from './types.ts';

export interface CatalogRepository {
  findScreeningById(screeningId: string): Promise<Screening | null>;
  findSeatsByScreening(screeningId: string): Promise<StoredSeat[]>;
  findProgrammedScreenings(filters: ScreeningFilters): Promise<ProgrammedScreening[]>;
}

/** In-memory adapter used by the composition root and deterministic tests. */
export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly screenings = new Map<string, Screening | ProgrammedScreening>();
  private readonly seats: StoredSeat[];

  constructor(screenings: Array<Screening | ProgrammedScreening> = [], seats: StoredSeat[] = []) {
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

  async findProgrammedScreenings(filters: ScreeningFilters): Promise<ProgrammedScreening[]> {
    return [...this.screenings.values()]
      .filter(isProgrammedScreening)
      .filter((screening) => matchesFilters(screening, filters))
      .map((screening) => ({ ...screening, movie: { ...screening.movie } }));
  }
}

function isProgrammedScreening(screening: Screening | ProgrammedScreening): screening is ProgrammedScreening {
  return 'movie' in screening && 'cinemaName' in screening && 'roomName' in screening;
}

function matchesFilters(screening: ProgrammedScreening, filters: ScreeningFilters): boolean {
  const movieQuery = filters.movieQuery?.trim().toLocaleLowerCase();
  return (!filters.movieId || screening.movie.id === filters.movieId)
    && (!movieQuery || screening.movie.title.toLocaleLowerCase().includes(movieQuery))
    && (!filters.date || screening.startsAt.toISOString().slice(0, 10) === filters.date)
    && (!filters.format || screening.format === filters.format)
    && (!filters.startTime || screening.startsAt.toISOString().slice(11, 16) === filters.startTime);
}
