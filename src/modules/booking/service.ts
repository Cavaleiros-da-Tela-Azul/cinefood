import type { BookingRepository } from './repository.ts';
import {
  DEFAULT_HOLD_DURATION_MS,
  type ConfirmReservationResult,
  type ReservableSeat,
  type ReserveSeatCommand,
  type SeatReservation,
} from './types.ts';

export class ScreeningUnavailableError extends Error {
  constructor() {
    super('Sessão encerrada, inativa ou inexistente.');
    this.name = 'ScreeningUnavailableError';
  }
}

export class SeatConflictError extends Error {
  constructor() {
    super('Assento já reservado ou ocupado para esta sessão.');
    this.name = 'SeatConflictError';
  }
}

export class SeatNotFoundError extends Error {
  constructor() {
    super('Assento não encontrado para esta sessão.');
    this.name = 'SeatNotFoundError';
  }
}

export class ReservationNotFoundError extends Error {
  constructor() {
    super('Reserva não encontrada.');
    this.name = 'ReservationNotFoundError';
  }
}

export interface BookingService {
  reserveSeat(command: ReserveSeatCommand): Promise<SeatReservation>;
  confirmReservation(reservationId: string): Promise<ConfirmReservationResult>;
  cancelReservation(reservationId: string, buyerUserId: string): Promise<SeatReservation>;
  releaseExpiredReservations(screeningId?: string): Promise<number>;
  getSeatState(screeningId: string, seatId: string): Promise<ReservableSeat>;
}

export class DefaultBookingService implements BookingService {
  private readonly repository: BookingRepository;
  private readonly now: () => Date;
  private readonly holdDurationMs: number;
  private sequence = 0;

  constructor(
    repository: BookingRepository,
    now: () => Date = () => new Date(),
    holdDurationMs: number = DEFAULT_HOLD_DURATION_MS,
  ) {
    if (!Number.isFinite(holdDurationMs) || holdDurationMs <= 0) {
      throw new Error('O prazo de expiração da reserva deve ser positivo.');
    }
    this.repository = repository;
    this.now = now;
    this.holdDurationMs = holdDurationMs;
  }

  async reserveSeat(command: ReserveSeatCommand): Promise<SeatReservation> {
    const now = this.now();
    await this.assertScreeningAvailable(command.screeningId, now);

    this.sequence += 1;
    const reservationId = `res-${this.sequence}`;
    const expiresAt = new Date(now.getTime() + this.holdDurationMs);

    const outcome = await this.repository.tryAcquireSeatHold({
      ...command,
      reservationId,
      now,
      expiresAt,
    });

    if (outcome.status === 'SEAT_NOT_FOUND') {
      throw new SeatNotFoundError();
    }

    if (outcome.status === 'CONFLICT') {
      throw new SeatConflictError();
    }

    return outcome.reservation;
  }

  async confirmReservation(reservationId: string): Promise<ConfirmReservationResult> {
    const now = this.now();
    const result = await this.repository.confirmReservation(reservationId, now);
    if (!result) {
      throw new ReservationNotFoundError();
    }
    return result;
  }

  async cancelReservation(reservationId: string, buyerUserId: string): Promise<SeatReservation> {
    const now = this.now();
    const reservation = await this.repository.cancelReservation(reservationId, buyerUserId, now);
    if (!reservation) {
      throw new ReservationNotFoundError();
    }
    return reservation;
  }

  async releaseExpiredReservations(screeningId?: string): Promise<number> {
    return this.repository.releaseExpiredHolds(this.now(), screeningId);
  }

  async getSeatState(screeningId: string, seatId: string): Promise<ReservableSeat> {
    const now = this.now();
    await this.repository.releaseExpiredHolds(now, screeningId);
    const seat = await this.repository.findSeat(screeningId, seatId);
    if (!seat) {
      throw new SeatNotFoundError();
    }
    return seat;
  }

  private async assertScreeningAvailable(screeningId: string, now: Date): Promise<void> {
    const screening = await this.repository.findScreeningById(screeningId);
    if (!screening || screening.status !== 'ATIVA' || screening.startsAt <= now) {
      throw new ScreeningUnavailableError();
    }
  }
}
