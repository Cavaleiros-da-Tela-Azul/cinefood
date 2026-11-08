import type { AuthenticatedSession, ProtectedOperation, UserRole } from './types.ts';

const OPERATION_ROLES: Readonly<Record<ProtectedOperation, readonly UserRole[]>> = {
  CLIENT_ACCOUNT: ['CLIENTE', 'ADMIN_CINEMA'],
  TICKET_VALIDATION: ['OPERADOR_PORTARIA', 'ADMIN_CINEMA'],
  CANTEEN_OPERATION: ['OPERADOR_CANTINA', 'ADMIN_CINEMA'],
  DELIVERY_OPERATION: ['RUNNER', 'ADMIN_CINEMA'],
  ADMINISTRATION: ['ADMIN_CINEMA'],
};

export class ForbiddenError extends Error {
  constructor() {
    super('Acesso negado para este perfil.');
    this.name = 'ForbiddenError';
  }
}

export interface AuthorizationInput {
  session: AuthenticatedSession;
  operation: ProtectedOperation;
  /** Owner of a customer-scoped resource read from server persistence. */
  resourceOwnerUserId?: string;
}

/**
 * Server-side authorization for protected operations.
 * The caller receives no way to supply or override the authenticated user id.
 */
export function authorize(input: AuthorizationInput): void {
  const allowedRoles = OPERATION_ROLES[input.operation];
  if (!allowedRoles.includes(input.session.role)) {
    throw new ForbiddenError();
  }

  if (
    input.operation === 'CLIENT_ACCOUNT'
    && input.session.role === 'CLIENTE'
    && input.resourceOwnerUserId !== undefined
    && input.resourceOwnerUserId !== input.session.userId
  ) {
    throw new ForbiddenError();
  }
}

/**
 * Returns the buyer/user id for writes. Request payload userId values are
 * intentionally not accepted, preventing client-controlled account selection.
 */
export function authenticatedUserId(session: AuthenticatedSession): string {
  return session.userId;
}

export function rolesFor(operation: ProtectedOperation): readonly UserRole[] {
  return OPERATION_ROLES[operation];
}
