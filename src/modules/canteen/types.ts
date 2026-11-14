export type CanteenProductCategory = 'PIPOCA' | 'BEBIDA' | 'COMBO' | 'DOCE' | 'SNACK';

export type CanteenDeliveryChannel = 'ENTREGA_ASSENTO' | 'RETIRADA_BALCAO';

export type CanteenOrderStatus =
  | 'PENDENTE_PAGAMENTO'
  | 'AGUARDANDO_CHEGADA'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'SAIU_PARA_ENTREGA'
  | 'ENTREGUE'
  | 'RETIRADA_NO_BALCAO'
  | 'CANCELADO'
  | 'ESTORNADO';

export type CanteenStockStatus = 'RESERVADO' | 'BAIXADO' | 'DEVOLVIDO';

export type CanteenPaymentStatus = 'PENDENTE' | 'APROVADO' | 'EXPIRADO' | 'FALHOU' | 'ESTORNADO';

export interface CanteenAddon {
  addonId: string;
  name: string;
  priceCents: number;
  available: boolean;
}

export interface CanteenProduct {
  productId: string;
  name: string;
  description: string;
  category: CanteenProductCategory;
  unitPriceCents: number;
  availableStock: number;
  active: boolean;
  isCombo: boolean;
  comboItems?: string[];
  allowedAddonIds: string[];
}

export interface CanteenMenuItemView {
  productId: string;
  name: string;
  description: string;
  category: CanteenProductCategory;
  unitPriceCents: number;
  availableStock: number;
  isCombo: boolean;
  comboItems?: string[];
  addons: CanteenAddon[];
}

export interface CanteenCartItemInput {
  productId: string;
  quantity: number;
  addonIds?: string[];
  /** Campos opcionais enviados pelo cliente; sempre ignorados no recálculo server-side (RF-07). */
  clientUnitPriceCents?: number;
  clientLineTotalCents?: number;
}

export interface PricedCanteenOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  officialUnitPriceCents: number;
  addons: Array<{
    addonId: string;
    name: string;
    priceCents: number;
  }>;
  addonsUnitPriceCents: number;
  lineTotalCents: number;
}

export interface CanteenQuoteResult {
  items: PricedCanteenOrderItem[];
  totalCents: number;
  clientPayloadIgnored: true;
}

export interface CanteenCheckoutInput {
  items: CanteenCartItemInput[];
  deliveryChannel: CanteenDeliveryChannel;
  linkedTicketId?: string;
  screeningId?: string;
  seatId?: string;
  /** Campo opcional manipulado pelo cliente; sempre ignorado no servidor. */
  clientTotalCents?: number;
}

export interface CanteenOrder {
  orderId: string;
  ownerUserId: string;
  linkedTicketId?: string;
  screeningId?: string;
  seatId?: string;
  deliveryChannel: CanteenDeliveryChannel;
  status: CanteenOrderStatus;
  items: PricedCanteenOrderItem[];
  totalCents: number;
  stockStatus: CanteenStockStatus;
  paymentStatus: CanteenPaymentStatus;
  incidentNote?: string;
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
}

export interface StockReservationLine {
  productId: string;
  quantity: number;
}

export type AtomicStockReservationResult =
  | { ok: true }
  | { ok: false; productId: string; requested: number; available: number };
