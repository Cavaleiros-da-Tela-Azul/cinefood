import { authorize } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import type { CanteenRepository } from '../canteen/repository.ts';
import type { PaymentGatewayAdapter } from '../payments/gateway.ts';
import type { TicketRepository } from '../tickets/repository.ts';
import type { ManagementRepository } from './repository.ts';
import { ManagementEntityNotFoundError } from './service.ts';
import type { ConfirmedTicketPurchaseRecord } from './types.ts';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export class CancellationNotEligibleError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'CancellationNotEligibleError';
  }
}

export interface CdcCancellationResult {
  idempotentReplay: boolean;
  ticket: ConfirmedTicketPurchaseRecord;
  seatReleased: boolean;
  canteenStockRestored: boolean;
  ticketQrInvalidated: boolean;
  refundStatus: 'ESTORNADO' | 'PENDENTE_CONCILIACAO';
  cancelledCanteenOrderId?: string;
  refundId: string;
  refundAmountCents: number;
}

export interface CdcCancellationServiceOptions {
  now?: () => Date;
  gateway: PaymentGatewayAdapter;
  canteenRepository?: CanteenRepository;
  ticketRepository?: TicketRepository;
  onSeatReleased?: (screeningId: string, seatId: string, ticketId: string) => Promise<void>;
}

/**
 * Serviço de Arrependimento CDC e Cancelamento dentro da Janela Operacional (RF-12 / RN-04).
 */
export class CdcCancellationService {
  private readonly repository: ManagementRepository;
  private readonly gateway: PaymentGatewayAdapter;
  private readonly canteenRepository?: CanteenRepository;
  private readonly ticketRepository?: TicketRepository;
  private readonly now: () => Date;
  private readonly onSeatReleased?: (
    screeningId: string,
    seatId: string,
    ticketId: string,
  ) => Promise<void>;
  private readonly inFlightByTicket = new Map<string, Promise<CdcCancellationResult>>();

  constructor(
    repository: ManagementRepository,
    options: CdcCancellationServiceOptions,
  ) {
    this.repository = repository;
    this.gateway = options.gateway;
    this.canteenRepository = options.canteenRepository;
    this.ticketRepository = options.ticketRepository;
    this.now = options.now ?? (() => new Date());
    this.onSeatReleased = options.onSeatReleased;
  }

  async cancelTicketWithCdcRefund(
    session: AuthenticatedSession,
    ticketId: string,
  ): Promise<CdcCancellationResult> {
    const existingFlight = this.inFlightByTicket.get(ticketId);
    if (existingFlight) {
      const firstResult = await existingFlight;
      return { ...firstResult, idempotentReplay: true };
    }

    const work = this.executeCancellation(session, ticketId);
    this.inFlightByTicket.set(ticketId, work);
    try {
      return await work;
    } finally {
      this.inFlightByTicket.delete(ticketId);
    }
  }

  private async executeCancellation(
    session: AuthenticatedSession,
    ticketId: string,
  ): Promise<CdcCancellationResult> {
    const record = await this.repository.findTicketPurchaseById(ticketId);
    if (!record) {
      throw new ManagementEntityNotFoundError(`Ingresso ${ticketId} não encontrado.`);
    }

    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: record.ownerUserId,
    });

    if (
      record.ticketStatus === 'CANCELADO' &&
      (record.paymentStatus === 'ESTORNADO' || record.paymentStatus === 'PENDENTE_ESTORNO') &&
      record.refundId
    ) {
      return {
        idempotentReplay: true,
        ticket: record,
        seatReleased: true,
        canteenStockRestored: Boolean(record.linkedCanteenOrder),
        ticketQrInvalidated: true,
        refundStatus:
          record.paymentStatus === 'PENDENTE_ESTORNO'
            ? 'PENDENTE_CONCILIACAO'
            : 'ESTORNADO',
        ...(record.linkedCanteenOrder
          ? { cancelledCanteenOrderId: record.linkedCanteenOrder.orderId }
          : {}),
        refundId: record.refundId,
        refundAmountCents: record.refundAmountCents ?? record.paidUnitPriceCents,
      };
    }

    if (record.ticketStatus === 'UTILIZADO') {
      throw new CancellationNotEligibleError(
        'Cancelamento bloqueado: ingresso já foi validado/utilizado na portaria (RF-12 / RN-04).',
      );
    }

    if (record.ticketStatus !== 'EMITIDO') {
      throw new CancellationNotEligibleError(
        `Cancelamento bloqueado para ingresso no estado ${record.ticketStatus}.`,
      );
    }

    const screening = await this.repository.findScreeningById(record.screeningId);
    if (!screening) {
      throw new ManagementEntityNotFoundError(
        `Sessão ${record.screeningId} vinculada ao ingresso não encontrada.`,
      );
    }

    const nowMs = this.now().getTime();
    const purchasedMs = Date.parse(record.purchasedAt);
    const startsAtMs = Date.parse(screening.startsAt);

    if (nowMs > purchasedMs + SEVEN_DAYS_MS) {
      throw new CancellationNotEligibleError(
        'Prazo legal de 7 dias corridos do CDC expirado para arrependimento (RF-12).',
      );
    }

    if (nowMs > startsAtMs - TWO_HOURS_MS) {
      throw new CancellationNotEligibleError(
        'Cancelamento bloqueado: janela de corte operacional de 2 horas antes da sessão já encerrada (RN-04).',
      );
    }

    let refundAmountCents = record.paidUnitPriceCents;
    let cancelledCanteenOrder = record.linkedCanteenOrder;

    if (cancelledCanteenOrder) {
      if (
        cancelledCanteenOrder.status !== 'AGUARDANDO_CHEGADA' &&
        cancelledCanteenOrder.status !== 'PENDENTE_PAGAMENTO'
      ) {
        throw new CancellationNotEligibleError(
          `Cancelamento bloqueado: pedido de cantina vinculado já está em ${cancelledCanteenOrder.status} (RF-12).`,
        );
      }
      if (cancelledCanteenOrder.status === 'AGUARDANDO_CHEGADA') {
        refundAmountCents += cancelledCanteenOrder.totalCents;
      }
      cancelledCanteenOrder = {
        ...cancelledCanteenOrder,
        status: 'CANCELADO',
      };
    }

    const idempotencyKey = `refund:cdc:${record.ticketId}`;
    let refundId = `pending_refund_${record.ticketId}`;
    let refundStatus: 'ESTORNADO' | 'PENDENTE_CONCILIACAO' = 'ESTORNADO';
    try {
      const refundOutput = await this.gateway.refundSandboxCharge({
        gatewayChargeId: record.gatewayChargeId ?? `sbx_chg_${record.purchaseId}`,
        amountCents: refundAmountCents,
        idempotencyKey,
        reason: 'Arrependimento CDC / Janela de Corte 2h (RF-12)',
      });
      refundId = refundOutput.refundId;
    } catch {
      // CA-F12: falha externa do gateway mantém estorno pendente de conciliação sem antecipar confirmação
      refundStatus = 'PENDENTE_CONCILIACAO';
    }

    const cancelledAt = this.now().toISOString();
    await this.repository.releaseSeatHoldForCancellation(record.screeningId, record.seatId);

    let ticketQrInvalidated = false;
    if (this.ticketRepository) {
      const invalidated = await this.ticketRepository.markCancelledByTicketId(
        record.ticketId,
        cancelledAt,
      );
      ticketQrInvalidated = Boolean(invalidated);
    }

    let canteenStockRestored = false;
    if (cancelledCanteenOrder && this.canteenRepository) {
      const canteenOrder = await this.canteenRepository.findOrderById(
        cancelledCanteenOrder.orderId,
      );
      if (canteenOrder && canteenOrder.status !== 'CANCELADO') {
        if (
          canteenOrder.stockStatus === 'RESERVADO' ||
          canteenOrder.stockStatus === 'BAIXADO'
        ) {
          await this.canteenRepository.releaseStockAtomically(
            canteenOrder.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          );
          canteenStockRestored = true;
        }
        await this.canteenRepository.updateOrder({
          ...canteenOrder,
          status: 'CANCELADO',
          stockStatus: canteenStockRestored ? 'DEVOLVIDO' : canteenOrder.stockStatus,
          updatedAt: cancelledAt,
        });
      }
    }

    if (this.onSeatReleased) {
      await this.onSeatReleased(record.screeningId, record.seatId, record.ticketId);
    }

    const updated = await this.repository.updateTicketPurchase({
      ...record,
      ticketStatus: 'CANCELADO',
      paymentStatus: refundStatus === 'ESTORNADO' ? 'ESTORNADO' : 'PENDENTE_ESTORNO',
      cancelledAt,
      refundId,
      refundAmountCents,
      ...(cancelledCanteenOrder ? { linkedCanteenOrder: cancelledCanteenOrder } : {}),
    });

    return {
      idempotentReplay: false,
      ticket: updated,
      seatReleased: true,
      canteenStockRestored,
      ticketQrInvalidated,
      refundStatus,
      ...(cancelledCanteenOrder
        ? { cancelledCanteenOrderId: cancelledCanteenOrder.orderId }
        : {}),
      refundId,
      refundAmountCents,
    };
  }
}
