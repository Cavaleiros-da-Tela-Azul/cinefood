export type TicketStatus = 'EMITIDO' | 'UTILIZADO' | 'CANCELADO';

export type TicketCategory = 'INTEIRA' | 'MEIA';

export type PaymentSettlementStatus =
  | 'PENDENTE'
  | 'APROVADO'
  | 'RECUSADO'
  | 'ESTORNADO'
  | 'CANCELADO';

export interface TicketScreeningMetadata {
  screeningId: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  startsAt: string;
  endsAt: string;
}

export interface TicketSeatAssignment {
  reservationId: string;
  seatId: string;
  row: string;
  number: number;
  category: TicketCategory;
  meiaDoc?: string;
}

export interface IssuedTicket {
  ticketId: string;
  purchaseId: string;
  reservationId: string;
  buyerUserId: string;
  screeningId: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  startsAt: string;
  endsAt: string;
  seatId: string;
  row: string;
  number: number;
  category: TicketCategory;
  qrToken: string;
  status: TicketStatus;
  canteenPreLinkEligible: boolean;
  issuedAt: string;
  usedAt?: string;
  validatedByOperatorId?: string;
  cancelledAt?: string;
}

export interface IssueTicketsInput {
  purchaseId: string;
  buyerUserId: string;
  paymentStatus: PaymentSettlementStatus;
  screening: TicketScreeningMetadata;
  seats: TicketSeatAssignment[];
}

export interface IssueTicketsResult {
  purchaseId: string;
  tickets: IssuedTicket[];
  canteenPreLinkAvailable: boolean;
}
