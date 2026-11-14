import type { Screening, SeatState, StoredSeat } from '../catalog/types.ts';

export type BookingChannel = 'WEB' | 'MOBILE' | 'ANDROID' | 'BILHETERIA';

export type ReservationStatus =
  | 'ATIVA'
  | 'CONFIRMADA'
  | 'EXPIRADA'
  | 'CANCELADA'
  | 'CONFLITO_EXPIRACAO';

export type TicketCategory = 'INTEIRA' | 'MEIA_ENTRADA';

export type HalfPriceDocumentType =
  | 'ESTUDANTE'
  | 'IDOSO'
  | 'PCD'
  | 'JOVEM_BAIXA_RENDA';

export interface BookingScreening extends Screening {
  /** Valor oficial da inteira em centavos (ex.: 4000 = R$ 40,00). */
  basePriceCents?: number;
  /** Valor oficial em reais para compatibilidade com catálogo. */
  basePrice?: number;
}

export interface TicketPricingInput {
  category: TicketCategory;
  halfPriceDocumentType?: HalfPriceDocumentType;
  halfPriceDocumentCode?: string;
  /** Campo opcional enviado pelo cliente; nunca confiável e rejeitado quando divergente. */
  clientUnitPriceCents?: number;
}

export interface TicketPricingResult {
  category: TicketCategory;
  fullPriceCents: number;
  unitPriceCents: number;
  discountPercent: 0 | 50;
  halfPriceDocumentType?: HalfPriceDocumentType;
  halfPriceDocumentCode?: string;
}

/** Prazo padrão de bloqueio temporário de poltrona: 10 minutos (RF-03 / ADR-002). */
export const DEFAULT_HOLD_DURATION_MS = 10 * 60 * 1000;

/** Preço padrão da inteira caso a sessão não informe valor explícito: R$ 40,00. */
export const DEFAULT_FULL_TICKET_PRICE_CENTS = 4000;

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
  operatorUserId?: string;
  buyerDocument?: string;
  ticketCategory?: TicketCategory;
  unitPriceCents?: number;
  halfPriceDocumentType?: HalfPriceDocumentType;
  halfPriceDocumentCode?: string;
  ticketEmitted?: boolean;
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
  operatorUserId?: string;
  buyerDocument?: string;
  ticketCategory?: TicketCategory;
  unitPriceCents?: number;
  halfPriceDocumentType?: HalfPriceDocumentType;
  halfPriceDocumentCode?: string;
  ticketEmitted?: boolean;
}

export interface ReserveSeatRequest {
  screeningId: string;
  seatId: string;
  purchaseId: string;
  channel: BookingChannel;
  ticketCategory?: TicketCategory;
  halfPriceDocumentType?: HalfPriceDocumentType;
  halfPriceDocumentCode?: string;
  clientUnitPriceCents?: number;
  /** Ignorado pelo servidor: o titular sempre vem da sessão autenticada (CMP-01). */
  userId?: string;
}

export interface AssistedReserveSeatRequest {
  screeningId: string;
  seatId: string;
  purchaseId: string;
  buyerUserId: string;
  buyerDocument?: string;
  ticketCategory: TicketCategory;
  halfPriceDocumentType?: HalfPriceDocumentType;
  halfPriceDocumentCode?: string;
  clientUnitPriceCents?: number;
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
