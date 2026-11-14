import { ForbiddenError } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import {
  SandboxEnvironmentLockError,
  type OperationsService,
} from './service.ts';
import type {
  OperationalHealthReport,
  PilotHealthConfig,
  ShiftClosingInput,
  ShiftClosingReport,
} from './types.ts';

export type HttpResult<T> = { status: number; body: T };

/**
 * GET /operations/health — Verifica prontidão operacional e trava Sandbox (RST-03).
 */
export async function getOperationsHealthRoute(
  service: OperationsService,
  config: PilotHealthConfig,
): Promise<HttpResult<OperationalHealthReport | { error: string }>> {
  try {
    service.assertSandboxAllowed(config);
    const report = service.verifyOperationalReadiness(config);
    return {
      status: report.status === 'READY' ? 200 : 503,
      body: report,
    };
  } catch (error) {
    if (error instanceof SandboxEnvironmentLockError) {
      return { status: 403, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * POST /operations/shift-closing — Conciliação diária de fechamento de turno (ADMIN_CINEMA).
 */
export async function postShiftClosingReconciliationRoute(
  service: OperationsService,
  session: AuthenticatedSession,
  input: ShiftClosingInput,
): Promise<HttpResult<ShiftClosingReport | { error: string }>> {
  try {
    const report = service.reconcileShiftClosing(session, input);
    return { status: 200, body: report };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    throw error;
  }
}
