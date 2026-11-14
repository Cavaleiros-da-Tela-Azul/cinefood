import type { CanteenAddon, CanteenProduct } from '../canteen/types.ts';
import type { ManagedMovie, ManagedRoom, ManagedScreening } from '../management/types.ts';

export interface PilotHealthConfig {
  pilotUnitId: string;
  apiArchitecture: 'MODULAR_MONOLITH';
  sandboxMode: boolean;
  commercialHomologationApproved: boolean;
  paymentWebhookSecretConfigured: boolean;
  databaseReachable: boolean;
}

export interface OperationalHealthReport {
  status: 'READY' | 'BLOCKED';
  checkedAt: string;
  sandboxLocked: boolean;
  checks: {
    pilotSingleUnit: boolean;
    modularApiActive: boolean;
    sandboxEnforcement: boolean;
    databaseOk: boolean;
  };
  message: string;
}

export interface ShiftPaymentEntry {
  purchaseId: string;
  kind: 'TICKET' | 'CANTEEN';
  grossAmountCents: number;
  status: 'APROVADO' | 'PENDENTE' | 'ESTORNADO';
  refundAmountCents?: number;
  refundReason?: 'CDC_ARREPENDIMENTO' | 'PIX_TARDIO';
}

export interface ShiftClosingInput {
  shiftId: string;
  unitId: string;
  operatorUserId: string;
  openedAt: string;
  closedAt: string;
  issuedTicketsCount: number;
  validActiveTicketsCount: number;
  cancelledTicketsCount: number;
  payments: ShiftPaymentEntry[];
  canteenOrdersDeliveredCount: number;
  expectedNetCashCents: number;
}

export interface ShiftClosingReport {
  shiftId: string;
  unitId: string;
  closedAt: string;
  issuedTicketsCount: number;
  validActiveTicketsCount: number;
  cancelledTicketsCount: number;
  canteenOrdersDeliveredCount: number;
  grossSalesCents: number;
  cdcRefundsCents: number;
  latePixRefundsCents: number;
  totalRefundsCents: number;
  settledNetCents: number;
  expectedNetCashCents: number;
  discrepancyCents: number;
  balanced: boolean;
}

export interface PilotDemoSeed {
  unitId: string;
  unitName: string;
  movies: ManagedMovie[];
  rooms: ManagedRoom[];
  screening: ManagedScreening;
  canteenProducts: CanteenProduct[];
  canteenAddons: CanteenAddon[];
}
