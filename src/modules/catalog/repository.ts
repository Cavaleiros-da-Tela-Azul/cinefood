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
    for (const screening of screenings) {
      this.screenings.set(
        screening.id,
        isProgrammedScreening(screening)
          ? {
              ...screening,
              startsAt: new Date(screening.startsAt.getTime()),
              movie: {
                ...screening.movie,
                genre: screening.movie.genre ?? '',
                director: screening.movie.director ?? '',
              },
            }
          : {
              ...screening,
              startsAt: new Date(screening.startsAt.getTime()),
            },
      );
    }
    this.seats = seats.map((seat) => ({ ...seat }));
  }

  async findScreeningById(screeningId: string): Promise<Screening | null> {
    const screening = this.screenings.get(screeningId);
    return screening ? { ...screening, startsAt: new Date(screening.startsAt.getTime()) } : null;
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
      .map((screening) => ({
        ...screening,
        startsAt: new Date(screening.startsAt.getTime()),
        movie: {
          ...screening.movie,
          genre: screening.movie.genre ?? '',
          director: screening.movie.director ?? '',
        },
      }));
  }
}

function isProgrammedScreening(screening: Screening | ProgrammedScreening): screening is ProgrammedScreening {
  return 'movie' in screening && 'cinemaName' in screening && 'roomName' in screening;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function matchesFilters(screening: ProgrammedScreening, filters: ScreeningFilters): boolean {
  const movieQuery = filters.movieQuery?.trim().toLocaleLowerCase();
  const genreFilter = filters.genre?.trim().toLocaleLowerCase();
  const directorFilter = filters.director?.trim().toLocaleLowerCase();
  const cinemaFilter = filters.cinemaName?.trim().toLocaleLowerCase();
  const complexFilter = filters.complex?.trim().toLocaleLowerCase();
  const dateFilter = filters.date?.trim();
  const formatFilter = filters.format?.trim().toLocaleLowerCase();
  const startTimeFilter = filters.startTime?.trim();

  const title = screening.movie.title.toLocaleLowerCase();
  const genre = (screening.movie.genre ?? '').toLocaleLowerCase();
  const director = (screening.movie.director ?? '').toLocaleLowerCase();
  const cinemaName = screening.cinemaName.toLocaleLowerCase();

  return (!filters.movieId || screening.movie.id === filters.movieId)
    && (!movieQuery || title.includes(movieQuery) || genre.includes(movieQuery) || director.includes(movieQuery))
    && (!genreFilter || genre.includes(genreFilter))
    && (!directorFilter || director.includes(directorFilter))
    && (!cinemaFilter || cinemaName.includes(cinemaFilter))
    && (!complexFilter || cinemaName.includes(complexFilter))
    && (!dateFilter || formatLocalDate(screening.startsAt) === dateFilter)
    && (!formatFilter || screening.format.toLocaleLowerCase() === formatFilter)
    && (!startTimeFilter || formatLocalTime(screening.startsAt) === startTimeFilter);
}
