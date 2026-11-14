import type { BookingRepository } from './repository.ts';
import {
  DEFAULT_FULL_TICKET_PRICE_CENTS,
  DEFAULT_HOLD_DURATION_MS,
  type BookingScreening,
  type ConfirmReservationResult,
  type HalfPriceDocumentType,
  type ReservableSeat,
  type ReserveSeatCommand,
  type SeatReservation,
  type TicketPricingInput,
  type TicketPricingResult,
} from './types.ts';

const VALID_HALF_PRICE_DOCS: readonly HalfPriceDocumentType[] = [
  'ESTUDANTE',
  'IDOSO',
  'PCD',
  'JOVEM_BAIXA_RENDA',
];

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

export class InvalidTicketPricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTicketPricingError';
  }
}

export class InvalidAssistedSaleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAssistedSaleError';
  }
}

export interface ReserveAssistedSeatCommand {
  screeningId: string;
  seatId: string;
  purchaseId: string;
  operatorUserId: string;
  buyerUserId: string;
  buyerDocument?: string;
  pricing: TicketPricingInput;
}

export interface BookingService {
  reserveSeat(
    command: ReserveSeatCommand & { pricing?: TicketPricingInput },
  ): Promise<SeatReservation>;
  reserveAssistedSeat(command: ReserveAssistedSeatCommand): Promise<SeatReservation>;
  calculateTicketPricing(
    screeningId: string,
    input: TicketPricingInput,
    options?: { ignoreClientPrice?: boolean },
  ): Promise<TicketPricingResult>;
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

  async calculateTicketPricing(
    screeningId: string,
    input: TicketPricingInput,
    options: { ignoreClientPrice?: boolean } = {},
  ): Promise<TicketPricingResult> {
    const screening = await this.assertScreeningAvailable(screeningId, this.now());
    return computeServerTicketPricing(screening, input, options);
  }

  async reserveSeat(
    command: ReserveSeatCommand & { pricing?: TicketPricingInput },
  ): Promise<SeatReservation> {
    const now = this.now();
    const screening = await this.assertScreeningAvailable(command.screeningId, now);
    const pricing = command.pricing
      ? computeServerTicketPricing(screening, command.pricing)
      : undefined;

    this.sequence += 1;
    const reservationId = `res-${this.sequence}`;
    const expiresAt = new Date(now.getTime() + this.holdDurationMs);

    const outcome = await this.repository.tryAcquireSeatHold({
      ...command,
      ...(pricing
        ? {
            ticketCategory: pricing.category,
            unitPriceCents: pricing.unitPriceCents,
            halfPriceDocumentType: pricing.halfPriceDocumentType,
            halfPriceDocumentCode: pricing.halfPriceDocumentCode,
          }
        : {}),
      ticketEmitted: false,
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

  async reserveAssistedSeat(command: ReserveAssistedSeatCommand): Promise<SeatReservation> {
    const buyerUserId = command.buyerUserId.trim();
    if (!buyerUserId) {
      throw new InvalidAssistedSaleError('Identificação do comprador é obrigatória na venda assistida.');
    }

    const operatorUserId = command.operatorUserId.trim();
    if (!operatorUserId) {
      throw new InvalidAssistedSaleError('Identificação do operador é obrigatória na venda assistida.');
    }

    return this.reserveSeat({
      screeningId: command.screeningId,
      seatId: command.seatId,
      buyerUserId,
      purchaseId: command.purchaseId,
      channel: 'BILHETERIA',
      operatorUserId,
      buyerDocument: command.buyerDocument?.trim() || undefined,
      pricing: command.pricing,
      ticketEmitted: false,
    });
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

  private async assertScreeningAvailable(
    screeningId: string,
    now: Date,
  ): Promise<BookingScreening> {
    const screening = await this.repository.findScreeningById(screeningId);
    if (!screening || screening.status !== 'ATIVA' || screening.startsAt <= now) {
      throw new ScreeningUnavailableError();
    }
    return screening;
  }
}

export function resolveFullPriceCents(screening: BookingScreening): number {
  if (screening.basePriceCents !== undefined) {
    if (!Number.isInteger(screening.basePriceCents) || screening.basePriceCents <= 0) {
      throw new InvalidTicketPricingError('Preço base da sessão inválido.');
    }
    return screening.basePriceCents;
  }
  if (screening.basePrice !== undefined) {
    const cents = Math.round(screening.basePrice * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      throw new InvalidTicketPricingError('Preço base da sessão inválido.');
    }
    return cents;
  }
  return DEFAULT_FULL_TICKET_PRICE_CENTS;
}

export function computeServerTicketPricing(
  screening: BookingScreening,
  input: TicketPricingInput,
  options: { ignoreClientPrice?: boolean } = {},
): TicketPricingResult {
  const fullPriceCents = resolveFullPriceCents(screening);

  if (input.category === 'INTEIRA') {
    if (
      !options.ignoreClientPrice &&
      input.clientUnitPriceCents !== undefined &&
      input.clientUnitPriceCents !== fullPriceCents
    ) {
      throw new InvalidTicketPricingError(
        'Adulteração de preço detectada: o valor da inteira é calculado exclusivamente no servidor.',
      );
    }

    return {
      category: 'INTEIRA',
      fullPriceCents,
      unitPriceCents: fullPriceCents,
      discountPercent: 0,
    };
  }

  if (input.category === 'MEIA_ENTRADA') {
    if (
      !input.halfPriceDocumentType ||
      !VALID_HALF_PRICE_DOCS.includes(input.halfPriceDocumentType)
    ) {
      throw new InvalidTicketPricingError(
        'Categoria documental legal obrigatória para meia-entrada (ESTUDANTE, IDOSO, PCD ou JOVEM_BAIXA_RENDA).',
      );
    }

    const docCode = input.halfPriceDocumentCode?.trim();
    if (!docCode) {
      throw new InvalidTicketPricingError(
        'Número/código do documento comprobatório é obrigatório para meia-entrada.',
      );
    }

    const halfPriceCents = Math.round(fullPriceCents / 2);

    if (
      !options.ignoreClientPrice &&
      input.clientUnitPriceCents !== undefined &&
      input.clientUnitPriceCents !== halfPriceCents
    ) {
      throw new InvalidTicketPricingError(
        'Adulteração de preço detectada: o valor da meia-entrada é calculado exclusivamente no servidor.',
      );
    }

    return {
      category: 'MEIA_ENTRADA',
      fullPriceCents,
      unitPriceCents: halfPriceCents,
      discountPercent: 50,
      halfPriceDocumentType: input.halfPriceDocumentType,
      halfPriceDocumentCode: docCode,
    };
  }

  throw new InvalidTicketPricingError('Categoria de ingresso inválida.');
}
