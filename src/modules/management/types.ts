export type ScreeningStatus = 'ATIVA' | 'INATIVA';

export type ManagedCanteenOrderStatus =
  | 'PENDENTE_PAGAMENTO'
  | 'AGUARDANDO_CHEGADA'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'SAIU_PARA_ENTREGA'
  | 'ENTREGUE'
  | 'RETIRADA_NO_BALCAO'
  | 'CANCELADO';

export interface ManagedMovie {
  movieId: string;
  title: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: string;
  active: boolean;
}

export interface ManagedRoom {
  roomId: string;
  cinemaName: string;
  name: string;
  sellableSeats: number;
  active: boolean;
}

export interface ManagedScreening {
  screeningId: string;
  movieId: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
  format: string;
  basePriceCents: number;
  sellableSeats: number;
  status: ScreeningStatus;
  updatedAt: string;
}

export interface ManagedCanteenItem {
  productId: string;
  name: string;
  category: string;
  unitPriceCents: number;
  availableStock: number;
  active: boolean;
  updatedAt: string;
}

export interface LinkedPurchaseCanteenOrder {
  orderId: string;
  status: ManagedCanteenOrderStatus;
  totalCents: number;
}

/**
 * Registro imutável de compra/ingresso emitido (RF-10): alterações administrativas
 * posteriores em sessão ou cardápio jamais alteram o preço pago historicamente.
 */
export interface ConfirmedTicketPurchaseRecord {
  ticketId: string;
  purchaseId: string;
  ownerUserId: string;
  screeningId: string;
  seatId: string;
  paidUnitPriceCents: number;
  paymentStatus: 'APROVADO' | 'ESTORNADO';
  ticketStatus: 'EMITIDO' | 'UTILIZADO' | 'CANCELADO';
  purchasedAt: string;
  cancelledAt?: string;
  gatewayChargeId?: string;
  refundId?: string;
  refundAmountCents?: number;
  linkedCanteenOrder?: LinkedPurchaseCanteenOrder;
}

export interface ScreeningHoldRecord {
  holdId: string;
  screeningId: string;
  seatId: string;
  expiresAt: string;
  status: 'ATIVA' | 'EXPIRADA' | 'CONFIRMADA' | 'CANCELADA';
}

export interface ScreeningOccupancyReport {
  screeningId: string;
  movieTitle: string;
  roomName: string;
  startsAt: string;
  sellableSeats: number;
  activeTicketsCount: number;
  cancelledTicketsCount: number;
  expiredHoldsCount: number;
  activeHoldsCount: number;
  occupancyPercent: number;
  grossRevenueCents: number;
  cancelledRevenueCents: number;
}

export interface ManagementSalesSummary {
  totalRevenueCents: number;
  activeTicketsCount: number;
  cancelledTicketsCount: number;
  screenings: ScreeningOccupancyReport[];
}
