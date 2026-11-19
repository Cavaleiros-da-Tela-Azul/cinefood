import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { authorize } from './rbac.ts';
import type { IdentityRepository, StoredUserRecord } from './repository.ts';
import type { AuthenticatedSession, UserRole } from './types.ts';

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Já existe uma conta cadastrada com o e-mail ${email}.`);
    this.name = 'DuplicateEmailError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('E-mail ou senha inválidos.');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidAuthInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAuthInputError';
  }
}

export class InvalidRecoveryTokenError extends Error {
  constructor(message = 'Token de recuperação inválido, expirado ou já utilizado.') {
    super(message);
    this.name = 'InvalidRecoveryTokenError';
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`Usuário ${userId} não encontrado.`);
    this.name = 'UserNotFoundError';
  }
}

export interface PublicUserProfile {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterUserInput {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  session: AuthenticatedSession;
  user: PublicUserProfile;
}

export interface PasswordRecoveryResult {
  accepted: true;
  /** Retornado apenas em fluxo simulado/sandbox de teste; nunca exposto em logs. */
  recoveryToken?: string;
  expiresAt?: string;
}

export interface UpdateProfileInput {
  targetUserId?: string;
  fullName?: string;
  email?: string;
  newPassword?: string;
}

export interface IdentityServiceOptions {
  jwtSecret?: string;
  now?: () => Date;
  sessionTtlSeconds?: number;
  recoveryTtlMs?: number;
}

const DEFAULT_SESSION_TTL_SECONDS = 2 * 60 * 60;
const DEFAULT_RECOVERY_TTL_MS = 15 * 60 * 1000;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, salt, expectedHex] = parts;
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const actualBuf = scryptSync(password, salt, expectedBuf.length);
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(actualBuf, expectedBuf);
}

function hashRecoveryToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function toPublicProfile(record: StoredUserRecord): PublicUserProfile {
  return {
    userId: record.userId,
    fullName: record.fullName,
    email: record.email,
    role: record.role,
    active: record.active,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export class IdentityService {
  private readonly repository: IdentityRepository;
  private readonly jwtSecret: string;
  private readonly now: () => Date;
  private readonly sessionTtlSeconds: number;
  private readonly recoveryTtlMs: number;

  constructor(repository: IdentityRepository, options: IdentityServiceOptions = {}) {
    this.repository = repository;
    this.jwtSecret =
      options.jwtSecret ??
      process.env.CINEFOOD_JWT_SECRET ??
      randomBytes(32).toString('hex');
    this.now = options.now ?? (() => new Date());
    this.sessionTtlSeconds = options.sessionTtlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;
    this.recoveryTtlMs = options.recoveryTtlMs ?? DEFAULT_RECOVERY_TTL_MS;
  }

  async registerUser(
    input: RegisterUserInput,
    actorSession?: AuthenticatedSession,
  ): Promise<PublicUserProfile> {
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();

    if (fullName.length < 2) {
      throw new InvalidAuthInputError('Informe um nome completo válido.');
    }
    if (!isValidEmail(email)) {
      throw new InvalidAuthInputError('Informe um endereço de e-mail válido.');
    }
    if (input.password.length < 8) {
      throw new InvalidAuthInputError('A senha deve ter no mínimo 8 caracteres.');
    }

    const requestedRole = input.role ?? 'CLIENTE';
    if (requestedRole !== 'CLIENTE') {
      if (!actorSession) {
        throw new InvalidAuthInputError(
          'Cadastro público permite apenas o perfil CLIENTE.',
        );
      }
      authorize({ session: actorSession, operation: 'ADMINISTRATION' });
    }

    const existing = await this.repository.findUserByEmail(email);
    if (existing) {
      throw new DuplicateEmailError(email);
    }

    const timestamp = this.now().toISOString();
    const created = await this.repository.createUser({
      userId: `usr_${randomUUID()}`,
      fullName,
      email,
      passwordHash: hashPassword(input.password),
      role: requestedRole,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return toPublicProfile(created);
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.repository.findUserByEmail(email);
    if (!user || !user.active || !verifyPassword(input.password, user.passwordHash)) {
      throw new InvalidCredentialsError();
    }

    const iat = Math.floor(this.now().getTime() / 1000);
    const exp = iat + this.sessionTtlSeconds;
    const session: AuthenticatedSession = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      iat,
      exp,
    };

    const accessToken = this.signSession(session);
    return {
      accessToken,
      session,
      user: toPublicProfile(user),
    };
  }

  verifySessionToken(token: string): AuthenticatedSession {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new InvalidCredentialsError();
    }
    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSig = createHmac('sha256', this.jwtSecret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signatureB64);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      throw new InvalidCredentialsError();
    }

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as AuthenticatedSession;
    const nowSeconds = Math.floor(this.now().getTime() / 1000);
    if (!payload.userId || !payload.role || nowSeconds >= payload.exp) {
      throw new InvalidCredentialsError();
    }
    return payload;
  }

  async requestPasswordRecovery(email: string): Promise<PasswordRecoveryResult> {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      throw new InvalidAuthInputError('Informe um e-mail válido para recuperação.');
    }

    const user = await this.repository.findUserByEmail(normalized);
    if (!user || !user.active) {
      return { accepted: true };
    }

    const rawToken = `cf_rec_${randomBytes(24).toString('base64url')}`;
    const expiresAt = new Date(this.now().getTime() + this.recoveryTtlMs).toISOString();
    await this.repository.saveRecoveryToken({
      tokenHash: hashRecoveryToken(rawToken),
      userId: user.userId,
      expiresAt,
    });

    return {
      accepted: true,
      recoveryToken: rawToken,
      expiresAt,
    };
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new InvalidAuthInputError('A nova senha deve ter no mínimo 8 caracteres.');
    }

    const tokenHash = hashRecoveryToken(token.trim());
    const record = await this.repository.findRecoveryTokenByHash(tokenHash);
    if (!record || record.usedAt) {
      throw new InvalidRecoveryTokenError();
    }

    const nowDate = this.now();
    if (nowDate.getTime() > Date.parse(record.expiresAt)) {
      throw new InvalidRecoveryTokenError('Token de recuperação expirado.');
    }

    const user = await this.repository.findUserById(record.userId);
    if (!user || !user.active) {
      throw new InvalidRecoveryTokenError();
    }

    const timestamp = nowDate.toISOString();
    await this.repository.markRecoveryTokenUsed(tokenHash, timestamp);
    await this.repository.updateUser({
      ...user,
      passwordHash: hashPassword(newPassword),
      updatedAt: timestamp,
    });
  }

  async updateProfile(
    session: AuthenticatedSession,
    input: UpdateProfileInput,
  ): Promise<PublicUserProfile> {
    const targetUserId = input.targetUserId ?? session.userId;
    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: targetUserId,
    });

    const user = await this.repository.findUserById(targetUserId);
    if (!user) {
      throw new UserNotFoundError(targetUserId);
    }

    let nextName = user.fullName;
    if (input.fullName !== undefined) {
      const trimmed = input.fullName.trim();
      if (trimmed.length < 2) {
        throw new InvalidAuthInputError('Nome completo inválido.');
      }
      nextName = trimmed;
    }

    let nextEmail = user.email;
    if (input.email !== undefined) {
      const normalized = input.email.trim().toLowerCase();
      if (!isValidEmail(normalized)) {
        throw new InvalidAuthInputError('E-mail informado é inválido.');
      }
      if (normalized !== user.email) {
        const conflict = await this.repository.findUserByEmail(normalized);
        if (conflict && conflict.userId !== user.userId) {
          throw new DuplicateEmailError(normalized);
        }
      }
      nextEmail = normalized;
    }

    let nextPasswordHash = user.passwordHash;
    if (input.newPassword !== undefined) {
      if (input.newPassword.length < 8) {
        throw new InvalidAuthInputError('A nova senha deve ter no mínimo 8 caracteres.');
      }
      nextPasswordHash = hashPassword(input.newPassword);
    }

    const updated = await this.repository.updateUser({
      ...user,
      fullName: nextName,
      email: nextEmail,
      passwordHash: nextPasswordHash,
      updatedAt: this.now().toISOString(),
    });
    return toPublicProfile(updated);
  }

  private signSession(session: AuthenticatedSession): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
      'base64url',
    );
    const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
    const signature = createHmac('sha256', this.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    return `${header}.${payload}.${signature}`;
  }
}
