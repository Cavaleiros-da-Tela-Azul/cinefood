import type { SeatState, StoredSeat } from '../catalog/types.ts';

export type BookingChannel = 'WEB' | 'MOBILE' | 'ANDROID' | 'BILHETERIA';

export type ReservationStatus =
  | 'ATIVA'
  | 'CONFIRMADA'
  | 'EXPIRADA'
  | 'CANCELADA'
  | 'CONFLITO_EXPIRACAO';

/** Prazo padrão de bloqueio temporário de poltrona: 10 minutos (RF-03 / ADR-002). */
export const DEFAULT_HOLD_DURATION_MS = 10 * 60 * 1000;

export interface ReservableSeat extends StoredSeat {
  reservedByUserId?: string;
  reservationId?: string;
  occupiedByUserId?: string;
}

export interface SeatReservation {
  id: string;
  screeningId: string;
  seatId: string;
  buyerUserId: string;
  purchaseId: string;
  channel: BookingChannel;
  status: ReservationStatus;
  createdAt: Date;
  expiresAt: Date;
  confirmedAt?: Date;
  releasedAt?: Date;
}

export interface ReserveSeatCommand {
  screeningId: string;
  seatId: string;
  buyerUserId: string;
  purchaseId: string;
  channel: BookingChannel;
}

export interface ReserveSeatRequest {
  screeningId: string;
  seatId: string;
  purchaseId: string;
  channel: BookingChannel;
  /** Ignorado pelo servidor: o titular sempre vem da sessão autenticada (CMP-01). */
  userId?: string;
}

export type ConfirmReservationResult =
  | {
      status: 'CONFIRMADA';
      reservation: SeatReservation;
      seat: ReservableSeat;
      requiresRefund: false;
    }
  | {
      status: 'CONFLITO_EXPIRACAO';
      reservation: SeatReservation;
      currentSeat: ReservableSeat;
      requiresRefund: true;
      reason: string;
    };

export type { SeatState };
