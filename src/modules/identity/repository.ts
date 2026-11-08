import type { User } from './types.ts';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface IdentityRepository {
  findByEmail(email: string): Promise<User | null>;
  create(input: User & { passwordHash: string }): Promise<User>;
}

/**
 * Minimal repository for the API composition root and unit tests. A database
 * adapter can implement IdentityRepository without exposing password hashes.
 */
export class InMemoryIdentityRepository implements IdentityRepository {
  private readonly usersByEmail = new Map<string, StoredUser>();

  async findByEmail(email: string): Promise<User | null> {
    const stored = this.usersByEmail.get(normalizeEmail(email));
    return stored ? toUser(stored) : null;
  }

  async create(input: User & { passwordHash: string }): Promise<User> {
    const email = normalizeEmail(input.email);
    if (this.usersByEmail.has(email)) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const stored: StoredUser = { ...input, email };
    this.usersByEmail.set(email, stored);
    return toUser(stored);
  }

  /** Internal-only lookup used by the authentication service. */
  async findCredentialsByEmail(email: string): Promise<StoredUser | null> {
    return this.usersByEmail.get(normalizeEmail(email)) ?? null;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toUser({ passwordHash: _passwordHash, ...user }: StoredUser): User {
  return user;
}
