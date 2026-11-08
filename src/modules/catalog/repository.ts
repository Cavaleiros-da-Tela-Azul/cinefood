import type { Movie, Screening, Seat } from './types.js';

export interface CatalogRepository {
  findActiveMovies(): Promise<Movie[]>;
  findActiveScreenings(date: string): Promise<Screening[]>;
  findSeatsByScreening(screeningId: string): Promise<Seat[]>;
}
