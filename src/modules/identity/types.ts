export type UserRole =
  | 'CLIENTE'
  | 'OPERADOR_PORTARIA'
  | 'OPERADOR_CANTINA'
  | 'RUNNER'
  | 'ADMIN_CINEMA';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

/** Information carried by a verified session token. */
export interface SessionClaims {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface Session {
  user: User;
  token: string;
}
