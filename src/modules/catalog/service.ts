import type { Movie, Screening, Seat } from './types.js';

export interface CatalogService {
  listActiveMovies(): Promise<Movie[]>;
  listActiveScreenings(date: string): Promise<Screening[]>;
  getSeatMap(screeningId: string): Promise<Seat[]>;
}
