import type { Screening } from '../catalog/types.ts';
import type {
  ConfirmReservationResult,
  ReservableSeat,
  ReserveSeatCommand,
  SeatReservation,
} from './types.ts';

export interface AcquireSeatHoldParams extends ReserveSeatCommand {
  reservationId: string;
  now: Date;
  expiresAt: Date;
}

export type AcquireSeatHoldOutcome =
  | { status: 'RESERVED'; reservation: SeatReservation; seat: ReservableSeat }
  | { status: 'SEAT_NOT_FOUND' }
  | { status: 'CONFLICT'; currentSeat: ReservableSeat };

export interface BookingRepository {
  findScreeningById(screeningId: string): Promise<Screening | null>;
  findSeat(screeningId: string, seatId: string): Promise<ReservableSeat | null>;
  findReservationById(reservationId: string): Promise<SeatReservation | null>;
  listReservationsByScreening(screeningId: string): Promise<SeatReservation[]>;
  tryAcquireSeatHold(params: AcquireSeatHoldParams): Promise<AcquireSeatHoldOutcome>;
  releaseExpiredHolds(now: Date, screeningId?: string): Promise<number>;
  cancelReservation(reservationId: string, buyerUserId: string, now: Date): Promise<SeatReservation | null>;
  confirmReservation(reservationId: string, now: Date): Promise<ConfirmReservationResult | null>;
}

/**
 * Adaptador determinístico em memória que aplica a mesma semântica transacional
 * da atualização condicional do PostgreSQL (ADR-002):
 * `estado = 'DISPONIVEL' OR (estado = 'RESERVADO' AND reservado_ate <= NOW())`.
 */
export class InMemoryBookingRepository implements BookingRepository {
  private readonly screenings = new Map<string, Screening>();
  private readonly seats = new Map<string, ReservableSeat>();
  private readonly reservations = new Map<string, SeatReservation>();
  private transactionQueue: Promise<unknown> = Promise.resolve();

  constructor(screenings: Screening[] = [], seats: ReservableSeat[] = []) {
    for (const screening of screenings) {
      this.screenings.set(screening.id, cloneScreening(screening));
    }
    for (const seat of seats) {
      this.seats.set(seatKey(seat.screeningId, seat.id), cloneSeat(seat));
    }
  }

  async findScreeningById(screeningId: string): Promise<Screening | null> {
    const screening = this.screenings.get(screeningId);
    return screening ? cloneScreening(screening) : null;
  }

  async findSeat(screeningId: string, seatId: string): Promise<ReservableSeat | null> {
    const seat = this.seats.get(seatKey(screeningId, seatId));
    return seat ? cloneSeat(seat) : null;
  }

  async findReservationById(reservationId: string): Promise<SeatReservation | null> {
    const reservation = this.reservations.get(reservationId);
    return reservation ? cloneReservation(reservation) : null;
  }

  async listReservationsByScreening(screeningId: string): Promise<SeatReservation[]> {
    return [...this.reservations.values()]
      .filter((reservation) => reservation.screeningId === screeningId)
      .map(cloneReservation);
  }

  async tryAcquireSeatHold(params: AcquireSeatHoldParams): Promise<AcquireSeatHoldOutcome> {
    return this.runInTransaction(() => {
      const key = seatKey(params.screeningId, params.seatId);
      const seat = this.seats.get(key);
      if (!seat) {
        return { status: 'SEAT_NOT_FOUND' };
      }

      this.expireSeatIfNeeded(seat, params.now);

      if (seat.state !== 'DISPONIVEL') {
        return { status: 'CONFLICT', currentSeat: cloneSeat(seat) };
      }

      const reservation: SeatReservation = {
        id: params.reservationId,
        screeningId: params.screeningId,
        seatId: params.seatId,
        buyerUserId: params.buyerUserId,
        purchaseId: params.purchaseId,
        channel: params.channel,
        status: 'ATIVA',
        createdAt: new Date(params.now.getTime()),
        expiresAt: new Date(params.expiresAt.getTime()),
      };

      const updatedSeat: ReservableSeat = {
        ...seat,
        state: 'RESERVADO',
        reservedByUserId: params.buyerUserId,
        reservationId: reservation.id,
        temporaryHoldExpiresAt: new Date(params.expiresAt.getTime()),
      };

      this.seats.set(key, updatedSeat);
      this.reservations.set(reservation.id, reservation);

      return {
        status: 'RESERVED',
        reservation: cloneReservation(reservation),
        seat: cloneSeat(updatedSeat),
      };
    });
  }

  async releaseExpiredHolds(now: Date, screeningId?: string): Promise<number> {
    return this.runInTransaction(() => {
      let releasedCount = 0;
      for (const seat of this.seats.values()) {
        if (screeningId && seat.screeningId !== screeningId) {
          continue;
        }
        if (this.expireSeatIfNeeded(seat, now)) {
          releasedCount += 1;
        }
      }
      return releasedCount;
    });
  }

  async cancelReservation(
    reservationId: string,
    buyerUserId: string,
    now: Date,
  ): Promise<SeatReservation | null> {
    return this.runInTransaction(() => {
      const reservation = this.reservations.get(reservationId);
      if (!reservation || reservation.buyerUserId !== buyerUserId) {
        return null;
      }

      const key = seatKey(reservation.screeningId, reservation.seatId);
      const seat = this.seats.get(key);

      if (reservation.status === 'ATIVA') {
        reservation.status = 'CANCELADA';
        reservation.releasedAt = new Date(now.getTime());
      }

      if (seat && seat.reservationId === reservation.id && seat.state === 'RESERVADO') {
        seat.state = 'DISPONIVEL';
        delete seat.reservedByUserId;
        delete seat.reservationId;
        delete seat.temporaryHoldExpiresAt;
      }

      return cloneReservation(reservation);
    });
  }

  async confirmReservation(
    reservationId: string,
    now: Date,
  ): Promise<ConfirmReservationResult | null> {
    return this.runInTransaction(() => {
      const reservation = this.reservations.get(reservationId);
      if (!reservation) {
        return null;
      }

      const key = seatKey(reservation.screeningId, reservation.seatId);
      const seat = this.seats.get(key);
      if (!seat) {
        return null;
      }

      if (reservation.status === 'CONFIRMADA' && seat.reservationId === reservation.id) {
        return {
          status: 'CONFIRMADA',
          reservation: cloneReservation(reservation),
          seat: cloneSeat(seat),
          requiresRefund: false,
        };
      }

      const holdExpired = reservation.expiresAt <= now || reservation.status === 'EXPIRADA';
      const seatTakenByAnotherReservation = seat.reservationId !== reservation.id;

      if (holdExpired || seatTakenByAnotherReservation || reservation.status !== 'ATIVA') {
        if (seat.reservationId === reservation.id && seat.state === 'RESERVADO' && holdExpired) {
          this.expireSeatIfNeeded(seat, now);
        }

        reservation.status = 'CONFLITO_EXPIRACAO';
        reservation.releasedAt ??= new Date(now.getTime());

        return {
          status: 'CONFLITO_EXPIRACAO',
          reservation: cloneReservation(reservation),
          currentSeat: cloneSeat(seat),
          requiresRefund: true,
          reason:
            'Reserva expirada após a janela de 10 minutos; pagamento tardio encaminhado para compensação e estorno automático.',
        };
      }

      reservation.status = 'CONFIRMADA';
      reservation.confirmedAt = new Date(now.getTime());

      seat.state = 'OCUPADO';
      seat.occupiedByUserId = reservation.buyerUserId;
      delete seat.temporaryHoldExpiresAt;

      return {
        status: 'CONFIRMADA',
        reservation: cloneReservation(reservation),
        seat: cloneSeat(seat),
        requiresRefund: false,
      };
    });
  }

  private expireSeatIfNeeded(seat: ReservableSeat, now: Date): boolean {
    if (
      seat.state === 'RESERVADO'
      && seat.temporaryHoldExpiresAt !== undefined
      && seat.temporaryHoldExpiresAt <= now
    ) {
      if (seat.reservationId) {
        const previousReservation = this.reservations.get(seat.reservationId);
        if (previousReservation && previousReservation.status === 'ATIVA') {
          previousReservation.status = 'EXPIRADA';
          previousReservation.releasedAt = new Date(seat.temporaryHoldExpiresAt.getTime());
        }
      }

      seat.state = 'DISPONIVEL';
      delete seat.reservedByUserId;
      delete seat.reservationId;
      delete seat.temporaryHoldExpiresAt;
      return true;
    }
    return false;
  }

  private runInTransaction<T>(operation: () => T | Promise<T>): Promise<T> {
    const next = this.transactionQueue.then(operation, operation);
    this.transactionQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}

function seatKey(screeningId: string, seatId: string): string {
  return `${screeningId}::${seatId}`;
}

function cloneScreening(screening: Screening): Screening {
  return {
    ...screening,
    startsAt: new Date(screening.startsAt.getTime()),
  };
}

function cloneSeat(seat: ReservableSeat): ReservableSeat {
  return {
    ...seat,
    ...(seat.temporaryHoldExpiresAt
      ? { temporaryHoldExpiresAt: new Date(seat.temporaryHoldExpiresAt.getTime()) }
      : {}),
  };
}

function cloneReservation(reservation: SeatReservation): SeatReservation {
  return {
    ...reservation,
    createdAt: new Date(reservation.createdAt.getTime()),
    expiresAt: new Date(reservation.expiresAt.getTime()),
    ...(reservation.confirmedAt
      ? { confirmedAt: new Date(reservation.confirmedAt.getTime()) }
      : {}),
    ...(reservation.releasedAt
      ? { releasedAt: new Date(reservation.releasedAt.getTime()) }
      : {}),
  };
}
