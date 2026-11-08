import { ForbiddenError, authorize } from './rbac.ts';
import type { AuthenticatedSession, ProtectedOperation } from './types.ts';

export type HttpResult<T> = { status: number; body: T };

/** Framework-neutral adapter for handlers after JWT authentication. */
export function requireRole(
  session: AuthenticatedSession,
  operation: ProtectedOperation,
  resourceOwnerUserId?: string,
): HttpResult<{ userId: string } | { error: string }> {
  try {
    authorize({ session, operation, resourceOwnerUserId });
    return { status: 200, body: { userId: session.userId } };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    throw error;
  }
}
