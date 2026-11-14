export type UserRole =
  | 'CLIENTE'
  | 'OPERADOR_PORTARIA'
  | 'OPERADOR_CANTINA'
  | 'OPERADOR_BILHETERIA'
  | 'RUNNER'
  | 'ADMIN_CINEMA';

/** Claims extracted from a JWT whose signature and expiry were already verified. */
export interface AuthenticatedSession {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export type ProtectedOperation =
  | 'CLIENT_ACCOUNT'
  | 'TICKET_VALIDATION'
  | 'CANTEEN_OPERATION'
  | 'ASSISTED_BOOKING'
  | 'DELIVERY_OPERATION'
  | 'ADMINISTRATION';
