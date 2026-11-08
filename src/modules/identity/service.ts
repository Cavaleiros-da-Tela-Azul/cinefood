import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import type { IdentityRepository, StoredUser } from './repository.ts';
import { normalizeEmail } from './repository.ts';
import type { Session, SessionClaims, User, UserRole } from './types.ts';

const scrypt = promisify(scryptCallback);
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60;
const USER_ROLES: readonly UserRole[] = [
  'CLIENTE',
  'OPERADOR_PORTARIA',
  'OPERADOR_CANTINA',
  'RUNNER',
  'ADMIN_CINEMA',
];

export class DuplicateEmailError extends Error {
  constructor() {
    super('E-mail indisponível.');
    this.name = 'DuplicateEmailError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Credenciais inválidas.');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidSessionError extends Error {
  constructor() {
    super('Sessão inválida ou expirada.');
    this.name = 'InvalidSessionError';
  }
}

export interface IdentityService {
  register(input: { email: string; displayName: string; password: string; role?: UserRole }): Promise<User>;
  authenticate(email: string, password: string): Promise<Session>;
}

export interface CredentialRepository extends IdentityRepository {
  findCredentialsByEmail(email: string): Promise<StoredUser | null>;
}

export interface IdentityServiceOptions {
  jwtSecret: string;
  sessionTtlSeconds?: number;
  now?: () => Date;
  createId?: () => string;
}

export class DefaultIdentityService implements IdentityService {
  private readonly repository: CredentialRepository;
  private readonly options: IdentityServiceOptions;
  private readonly ttlSeconds: number;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(
    repository: CredentialRepository,
    options: IdentityServiceOptions,
  ) {
    this.repository = repository;
    this.options = options;
    if (options.jwtSecret.length < 32) {
      throw new Error('JWT secret must contain at least 32 characters.');
    }
    this.ttlSeconds = options.sessionTtlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? (() => randomBytes(16).toString('hex'));
  }

  async register(input: { email: string; displayName: string; password: string; role?: UserRole }): Promise<User> {
    const email = normalizeEmail(input.email);
    validateRegistration({ ...input, email });

    if (await this.repository.findByEmail(email)) {
      throw new DuplicateEmailError();
    }

    try {
      return await this.repository.create({
        id: this.createId(),
        email,
        displayName: input.displayName.trim(),
        role: input.role ?? 'CLIENTE',
        passwordHash: await hashPassword(input.password),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }

  async authenticate(email: string, password: string): Promise<Session> {
    const storedUser = await this.repository.findCredentialsByEmail(normalizeEmail(email));
    if (!storedUser || !(await verifyPassword(password, storedUser.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    const user: User = {
      id: storedUser.id,
      email: storedUser.email,
      displayName: storedUser.displayName,
      role: storedUser.role,
    };
    return { user, token: this.issueToken(user) };
  }

  issueToken(user: User): string {
    const issuedAt = Math.floor(this.now().getTime() / 1000);
    return signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: issuedAt,
      exp: issuedAt + this.ttlSeconds,
    }, this.options.jwtSecret);
  }

  verifySession(token: string): SessionClaims {
    return verifySessionToken(token, this.options.jwtSecret, Math.floor(this.now().getTime() / 1000));
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_LENGTH) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, saltValue, hashValue] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !saltValue || !hashValue) return false;
  try {
    const actual = await scrypt(password, Buffer.from(saltValue, 'base64url'), PASSWORD_KEY_LENGTH) as Buffer;
    const expected = Buffer.from(hashValue, 'base64url');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function signSessionToken(claims: SessionClaims, secret: string): string {
  const header = base64urlJson({ alg: 'HS256', typ: 'JWT' });
  const payload = base64urlJson(claims);
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifySessionToken(token: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): SessionClaims {
  const [header, payload, signature, ...rest] = token.split('.');
  if (!header || !payload || !signature || rest.length) throw new InvalidSessionError();
  const expectedSignature = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
  const suppliedSignature = Buffer.from(signature, 'base64url');
  if (expectedSignature.length !== suppliedSignature.length || !timingSafeEqual(expectedSignature, suppliedSignature)) {
    throw new InvalidSessionError();
  }
  try {
    const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as { alg?: string; typ?: string };
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionClaims;
    if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT' || !isSessionClaims(claims) || claims.exp <= nowSeconds) {
      throw new InvalidSessionError();
    }
    return claims;
  } catch (error) {
    if (error instanceof InvalidSessionError) throw error;
    throw new InvalidSessionError();
  }
}

function validateRegistration(input: { email: string; displayName: string; password: string }): void {
  if (!input.email || !input.email.includes('@') || !input.displayName.trim() || input.password.length < 8) {
    throw new Error('Dados de cadastro inválidos.');
  }
}

function isSessionClaims(value: SessionClaims): boolean {
  return typeof value.userId === 'string'
    && typeof value.email === 'string'
    && USER_ROLES.includes(value.role)
    && typeof value.iat === 'number'
    && typeof value.exp === 'number';
}

function base64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
