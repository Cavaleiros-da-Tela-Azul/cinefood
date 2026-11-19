import type { UserRole } from './types.ts';

export interface StoredUserRecord {
  userId: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordRecoveryTokenRecord {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  usedAt?: string;
}

export interface IdentityRepository {
  findUserById(userId: string): Promise<StoredUserRecord | undefined>;
  findUserByEmail(email: string): Promise<StoredUserRecord | undefined>;
  createUser(user: StoredUserRecord): Promise<StoredUserRecord>;
  updateUser(user: StoredUserRecord): Promise<StoredUserRecord>;
  saveRecoveryToken(record: PasswordRecoveryTokenRecord): Promise<void>;
  findRecoveryTokenByHash(tokenHash: string): Promise<PasswordRecoveryTokenRecord | undefined>;
  markRecoveryTokenUsed(tokenHash: string, usedAt: string): Promise<void>;
}

export class InMemoryIdentityRepository implements IdentityRepository {
  private readonly usersById = new Map<string, StoredUserRecord>();
  private readonly userIdByEmail = new Map<string, string>();
  private readonly recoveryTokens = new Map<string, PasswordRecoveryTokenRecord>();

  async findUserById(userId: string): Promise<StoredUserRecord | undefined> {
    const user = this.usersById.get(userId);
    return user ? { ...user } : undefined;
  }

  async findUserByEmail(email: string): Promise<StoredUserRecord | undefined> {
    const normalized = email.trim().toLowerCase();
    const userId = this.userIdByEmail.get(normalized);
    if (!userId) return undefined;
    return this.findUserById(userId);
  }

  async createUser(user: StoredUserRecord): Promise<StoredUserRecord> {
    const normalizedEmail = user.email.trim().toLowerCase();
    const copy: StoredUserRecord = { ...user, email: normalizedEmail };
    this.usersById.set(copy.userId, copy);
    this.userIdByEmail.set(normalizedEmail, copy.userId);
    return { ...copy };
  }

  async updateUser(user: StoredUserRecord): Promise<StoredUserRecord> {
    const existing = this.usersById.get(user.userId);
    if (existing && existing.email !== user.email.trim().toLowerCase()) {
      this.userIdByEmail.delete(existing.email);
    }
    const normalizedEmail = user.email.trim().toLowerCase();
    const copy: StoredUserRecord = { ...user, email: normalizedEmail };
    this.usersById.set(copy.userId, copy);
    this.userIdByEmail.set(normalizedEmail, copy.userId);
    return { ...copy };
  }

  async saveRecoveryToken(record: PasswordRecoveryTokenRecord): Promise<void> {
    this.recoveryTokens.set(record.tokenHash, { ...record });
  }

  async findRecoveryTokenByHash(
    tokenHash: string,
  ): Promise<PasswordRecoveryTokenRecord | undefined> {
    const token = this.recoveryTokens.get(tokenHash);
    return token ? { ...token } : undefined;
  }

  async markRecoveryTokenUsed(tokenHash: string, usedAt: string): Promise<void> {
    const existing = this.recoveryTokens.get(tokenHash);
    if (existing) {
      this.recoveryTokens.set(tokenHash, { ...existing, usedAt });
    }
  }
}
