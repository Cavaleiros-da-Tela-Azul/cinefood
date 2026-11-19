import { ForbiddenError, authorize } from './rbac.ts';
import {
  DuplicateEmailError,
  IdentityService,
  InvalidAuthInputError,
  InvalidCredentialsError,
  InvalidRecoveryTokenError,
  UserNotFoundError,
  type LoginInput,
  type LoginResult,
  type PasswordRecoveryResult,
  type PublicUserProfile,
  type RegisterUserInput,
  type UpdateProfileInput,
} from './service.ts';
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

/** POST /auth/register — Cadastro de conta (RF-01). */
export async function postRegister(
  service: IdentityService,
  input: RegisterUserInput,
  actorSession?: AuthenticatedSession,
): Promise<HttpResult<PublicUserProfile | { error: string }>> {
  try {
    const created = await service.registerUser(input, actorSession);
    return { status: 201, body: created };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof DuplicateEmailError) {
      return { status: 409, body: { error: error.message } };
    }
    if (error instanceof InvalidAuthInputError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/** POST /auth/login — Autenticação com senha salgada e JWT (RF-01). */
export async function postAuthLogin(
  service: IdentityService,
  input: LoginInput,
): Promise<HttpResult<LoginResult | { error: string }>> {
  try {
    const result = await service.login(input);
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return { status: 401, body: { error: error.message } };
    }
    throw error;
  }
}

/** POST /auth/password-recovery — Emissão de token temporário de recuperação (RF-01). */
export async function postPasswordRecoveryRequest(
  service: IdentityService,
  email: string,
): Promise<HttpResult<PasswordRecoveryResult | { error: string }>> {
  try {
    const res = await service.requestPasswordRecovery(email);
    return { status: 200, body: res };
  } catch (error) {
    if (error instanceof InvalidAuthInputError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/** POST /auth/password-reset — Redefinição com token de uso único (RF-01). */
export async function postPasswordReset(
  service: IdentityService,
  input: { token: string; newPassword: string },
): Promise<HttpResult<{ updated: true } | { error: string }>> {
  try {
    await service.confirmPasswordReset(input.token, input.newPassword);
    return { status: 200, body: { updated: true } };
  } catch (error) {
    if (error instanceof InvalidRecoveryTokenError || error instanceof InvalidAuthInputError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/** PATCH /me/profile — Edição de perfil próprio autenticado (RF-01). */
export async function patchMyProfile(
  service: IdentityService,
  session: AuthenticatedSession,
  input: UpdateProfileInput,
): Promise<HttpResult<PublicUserProfile | { error: string }>> {
  try {
    const updated = await service.updateProfile(session, input);
    return { status: 200, body: updated };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof UserNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    if (error instanceof DuplicateEmailError) {
      return { status: 409, body: { error: error.message } };
    }
    if (error instanceof InvalidAuthInputError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}
