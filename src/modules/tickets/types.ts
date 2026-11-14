export type TicketStatus = 'EMITIDO' | 'UTILIZADO' | 'CANCELADO';

export type TicketCategory = 'INTEIRA' | 'MEIA';

export type PaymentSettlementStatus =
  | 'PENDENTE'
  | 'APROVADO'
  | 'RECUSADO'
  | 'ESTORNADO'
  | 'CANCELADO';

export type CanteenKdsStatus =
  | 'AGUARDANDO_CHEGADA'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'SAIU_PARA_ENTREGA'
  | 'ENTREGUE'
  | 'RETIRADA_NO_BALCAO'
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

export interface LinkedCanteenOrderRef {
  orderId: string;
  ticketId: string;
  purchaseId: string;
  seatId: string;
  deliveryChannel: 'ENTREGA_ASSENTO' | 'RETIRADA_BALCAO';
  status: CanteenKdsStatus;
  kitchenQueuedAt?: string;
}

export interface TicketValidatedEvent {
  eventName: 'TicketValidatedEvent';
  ticketId: string;
  purchaseId: string;
  screeningId: string;
  seatId: string;
  operatorId: string;
  validatedAt: string;
}

export interface ValidateQrInput {
  qrToken: string;
  expectedScreeningId?: string;
  expectedRoomName?: string;
}

export interface ValidateQrResult {
  outcome: 'LIBERADO';
  ticket: IssuedTicket;
  triggeredCanteenOrders: LinkedCanteenOrderRef[];
  event: TicketValidatedEvent;
}
