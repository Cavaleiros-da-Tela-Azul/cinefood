import {
  DuplicateEmailError,
  InvalidCredentialsError,
  InvalidSessionError,
  type IdentityService,
} from './service.ts';
import type { Session, SessionClaims, User, UserRole } from './types.ts';

export const identityRoutes = {
  prefix: '/identity',
  endpoints: ['POST /users', 'POST /sessions'],
} as const;

export type HttpResult<T> = { status: number; body: T };

export interface SessionVerifier {
  verifySession(token: string): SessionClaims;
}

/** HTTP-neutral adapters so any web framework can keep identity errors consistent. */
export function createIdentityHandlers(service: IdentityService) {
  return {
    async register(input: { email: string; displayName: string; password: string; role?: UserRole }): Promise<HttpResult<User | { error: string }>> {
      try {
        return { status: 201, body: await service.register(input) };
      } catch (error) {
        if (error instanceof DuplicateEmailError) return { status: 409, body: { error: error.message } };
        return { status: 400, body: { error: 'Dados de cadastro inválidos.' } };
      }
    },
    async login(input: { email: string; password: string }): Promise<HttpResult<Session | { error: string }>> {
      try {
        return { status: 200, body: await service.authenticate(input.email, input.password) };
      } catch (error) {
        if (error instanceof InvalidCredentialsError) return { status: 401, body: { error: error.message } };
        throw error;
      }
    },
  };
}

/** Converts expired, malformed, and tampered bearer tokens into HTTP 401. */
export function verifyBearerToken(
  authorization: string | undefined,
  verifier: SessionVerifier,
): HttpResult<SessionClaims | { error: string }> {
  const [scheme, token, ...rest] = authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token || rest.length) {
    return { status: 401, body: { error: 'Sessão inválida ou expirada.' } };
  }
  try {
    return { status: 200, body: verifier.verifySession(token) };
  } catch (error) {
    if (error instanceof InvalidSessionError) {
      return { status: 401, body: { error: error.message } };
    }
    throw error;
  }
}
