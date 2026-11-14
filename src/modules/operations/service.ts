import { authorize } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import type {
  OperationalHealthReport,
  PilotDemoSeed,
  PilotHealthConfig,
  ShiftClosingInput,
  ShiftClosingReport,
} from './types.ts';

export class SandboxEnvironmentLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SandboxEnvironmentLockError';
  }
}

export interface OperationsServiceOptions {
  now?: () => Date;
}

/**
 * Serviço de Transição e Operação Piloto (MAR-06 / RST-01..04):
 * - Verificação de prontidão operacional e trava estrita de sandbox (RST-03);
 * - Conciliação financeira de fechamento de turno;
 * - Seed determinístico para demonstração na unidade piloto (RST-01).
 */
export class OperationsService {
  private readonly now: () => Date;

  constructor(options: OperationsServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  /**
   * Garante bloqueio inegociável de cobrança real quando a unidade piloto e o
   * gateway comercial não possuem homologação formal aprovada (RST-03).
   */
  assertSandboxAllowed(config: PilotHealthConfig): { sandboxMode: true } {
    if (!config.sandboxMode || config.commercialHomologationApproved) {
      throw new SandboxEnvironmentLockError(
        'Trava RST-03 ativa: unidade piloto sem homologação comercial formal deve operar estritamente em modo sandbox.',
      );
    }
    return { sandboxMode: true };
  }

  verifyOperationalReadiness(config: PilotHealthConfig): OperationalHealthReport {
    const pilotSingleUnit = Boolean(config.pilotUnitId.trim());
    const modularApiActive = config.apiArchitecture === 'MODULAR_MONOLITH';
    const sandboxEnforcement =
      config.sandboxMode === true && config.commercialHomologationApproved === false;
    const databaseOk = config.databaseReachable === true;

    const allGreen =
      pilotSingleUnit &&
      modularApiActive &&
      sandboxEnforcement &&
      databaseOk &&
      config.paymentWebhookSecretConfigured;

    return {
      status: allGreen ? 'READY' : 'BLOCKED',
      checkedAt: this.now().toISOString(),
      sandboxLocked: sandboxEnforcement,
      checks: {
        pilotSingleUnit,
        modularApiActive,
        sandboxEnforcement,
        databaseOk,
      },
      message: allGreen
        ? 'Unidade piloto pronta para operação controlada em modo Sandbox (RST-01..04).'
        : 'Prontidão bloqueada: verifique trava sandbox, banco de dados ou configuração de webhook.',
    };
  }

  /**
   * Executa rotina de fechamento de turno e reconciliação diária comparando
   * ingressos emitidos, liquidações aprovadas, cancelamentos CDC e Pix tardio.
   */
  reconcileShiftClosing(
    session: AuthenticatedSession,
    input: ShiftClosingInput,
  ): ShiftClosingReport {
    authorize({ session, operation: 'ADMINISTRATION' });

    let grossSalesCents = 0;
    let cdcRefundsCents = 0;
    let latePixRefundsCents = 0;

    for (const entry of input.payments) {
      if (entry.status === 'APROVADO') {
        grossSalesCents += entry.grossAmountCents;
      } else if (entry.status === 'ESTORNADO') {
        grossSalesCents += entry.grossAmountCents;
        const refunded = entry.refundAmountCents ?? entry.grossAmountCents;
        if (entry.refundReason === 'PIX_TARDIO') {
          latePixRefundsCents += refunded;
        } else {
          cdcRefundsCents += refunded;
        }
      }
    }

    const totalRefundsCents = cdcRefundsCents + latePixRefundsCents;
    const settledNetCents = grossSalesCents - totalRefundsCents;
    const discrepancyCents = settledNetCents - input.expectedNetCashCents;

    return {
      shiftId: input.shiftId,
      unitId: input.unitId,
      closedAt: input.closedAt,
      issuedTicketsCount: input.issuedTicketsCount,
      validActiveTicketsCount: input.validActiveTicketsCount,
      cancelledTicketsCount: input.cancelledTicketsCount,
      canteenOrdersDeliveredCount: input.canteenOrdersDeliveredCount,
      grossSalesCents,
      cdcRefundsCents,
      latePixRefundsCents,
      totalRefundsCents,
      settledNetCents,
      expectedNetCashCents: input.expectedNetCashCents,
      discrepancyCents,
      balanced: discrepancyCents === 0,
    };
  }

  buildPilotDemoSeed(referenceNow: Date = this.now()): PilotDemoSeed {
    const startsAt = new Date(referenceNow.getTime() + 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 135 * 60 * 1000);

    return {
      unitId: 'cinefood-piloto-paulista',
      unitName: 'CineFood Paulista IMAX (Unidade Piloto)',
      movies: [
        {
          movieId: 'mov-piloto-ferro',
          title: 'CIDADE DE FERRO',
          synopsis: 'Thriller cyberpunk da programação inaugural da unidade piloto.',
          durationMinutes: 135,
          ageRating: '14',
          active: true,
        },
      ],
      rooms: [
        {
          roomId: 'room-piloto-imax-01',
          cinemaName: 'CineFood Paulista IMAX',
          name: 'Sala 1 IMAX',
          sellableSeats: 96,
          active: true,
        },
      ],
      screening: {
        screeningId: 'scr-piloto-01',
        movieId: 'mov-piloto-ferro',
        roomId: 'room-piloto-imax-01',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        format: 'IMAX',
        basePriceCents: 4400,
        sellableSeats: 96,
        status: 'ATIVA',
        updatedAt: referenceNow.toISOString(),
      },
      canteenProducts: [
        {
          productId: 'prod-combo-imax',
          name: 'Combo IMAX Manteiga Trufada',
          description: 'Pipoca grande amanteigada + bebida 700ml.',
          category: 'COMBO',
          unitPriceCents: 4800,
          availableStock: 25,
          active: true,
          isCombo: true,
          comboItems: ['Pipoca G Trufada', 'Refrigerante 700ml'],
          allowedAddonIds: ['add-cheddar'],
        },
      ],
      canteenAddons: [
        {
          addonId: 'add-cheddar',
          name: 'Cheddar cremoso extra',
          priceCents: 600,
          available: true,
        },
      ],
    };
  }
}
