export type SeatState = 'DISPONIVEL' | 'RESERVADO' | 'OCUPADO';
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
  temporaryHoldExpiresAt?: Date;
}

/** Public, current seat state returned to web, mobile, and box-office channels. */
export interface SeatMapSeat {
  id: string;
  row: string;
  number: number;
  state: SeatState;
}
