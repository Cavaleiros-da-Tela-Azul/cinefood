export type HistoryTicketStatus = 'EMITIDO' | 'UTILIZADO' | 'CANCELADO';

export interface HistoryTicketRecord {
  ticketId: string;
  purchaseId: string;
  ownerUserId: string;
  screeningId: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  seatId: string;
  startsAt: string;
  endsAt: string;
  status: HistoryTicketStatus;
  usedAt?: string;
}

export interface HistoryCanteenOrderRecord {
  orderId: string;
  purchaseId?: string;
  ownerUserId: string;
  summary: string;
  deliveryChannel: 'ENTREGA_ASSENTO' | 'RETIRADA_BALCAO';
  status: string;
  totalCents: number;
  createdAt: string;
}

export interface HistoryRefundRecord {
  refundId: string;
  purchaseId: string;
  ownerUserId: string;
  reason: 'PIX_TARDIO' | 'ARREPENDIMENTO_CDC';
  amountCents: number;
  status: 'ESTORNADO';
  createdAt: string;
}

export interface HistoryNoticeRecord {
  noticeId: string;
  ownerUserId: string;
  orderId?: string;
  type: 'INFO' | 'WARNING' | 'REFUND';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SessionReview {
  reviewId: string;
  ownerUserId: string;
  ticketId: string;
  screeningId: string;
  movieTitle: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrivateUserHistory {
  ownerUserId: string;
  tickets: HistoryTicketRecord[];
  canteenOrders: HistoryCanteenOrderRecord[];
  refunds: HistoryRefundRecord[];
  notices: HistoryNoticeRecord[];
  reviews: SessionReview[];
}

export interface CreateReviewInput {
  ticketId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  rating: number;
  comment?: string;
}
