export type SeatState = 'DISPONIVEL' | 'RESERVADO' | 'OCUPADO';
export type SeatCategory = 'standard' | 'pcd-wheelchair' | 'pcd-plus';
export type ScreeningStatus = 'ATIVA' | 'INATIVA';

export interface Screening {
  id: string;
  roomId: string;
  startsAt: Date;
  status: ScreeningStatus;
}

export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: string;
  genre?: string;
  director?: string;
}

export interface ProgrammedScreening extends Screening {
  movie: Movie;
  cinemaName: string;
  roomName: string;
  format: string;
  basePrice: number;
}

export interface ScreeningFilters {
  movieId?: string;
  movieQuery?: string;
  genre?: string;
  director?: string;
  cinemaName?: string;
  complex?: string;
  date?: string;
  format?: string;
  startTime?: string;
}

/** Persisted seat state. A reservation can be a temporary ten-minute hold. */
export interface StoredSeat {
  id: string;
  screeningId: string;
  row: string;
  number: number;
  state: SeatState;
  category?: SeatCategory;
  temporaryHoldExpiresAt?: Date;
}

/** Public, current seat state returned to web, mobile, and box-office channels. */
export interface SeatMapSeat {
  id: string;
  row: string;
  number: number;
  state: SeatState;
  category: SeatCategory;
}
