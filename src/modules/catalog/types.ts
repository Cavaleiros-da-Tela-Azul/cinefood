export type SeatState = 'DISPONIVEL' | 'RESERVADO' | 'OCUPADO';
export type ScreeningStatus = 'ATIVA' | 'INATIVA';

export interface Screening {
  id: string;
  roomId: string;
  startsAt: Date;
  status: ScreeningStatus;
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
