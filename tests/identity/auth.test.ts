import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryIdentityRepository } from '../../src/modules/identity/repository.ts';
import {
  DefaultIdentityService,
  verifySessionToken,
} from '../../src/modules/identity/service.ts';
import { createIdentityHandlers, verifyBearerToken } from '../../src/modules/identity/routes.ts';

const JWT_SECRET = 'test-only-secret-with-at-least-thirty-two-characters';

function createIdentity(now = new Date('2030-01-01T00:00:00Z'), ttlSeconds = 3600) {
  const repository = new InMemoryIdentityRepository();
  const service = new DefaultIdentityService(repository, {
    jwtSecret: JWT_SECRET,
    sessionTtlSeconds: ttlSeconds,
    now: () => now,
    createId: () => 'user-123',
  });
  return { service, handlers: createIdentityHandlers(service) };
}

describe('Identity & Auth (RF-01 / AC-1)', () => {
  it('cadastra e autentica usuário válido, emitindo JWT com userId e role', async () => {
    const { service, handlers } = createIdentity();
    const registration = await handlers.register({
      email: '  Ana@Example.com ',
      displayName: 'Ana',
      password: 'uma-senha-segura',
      role: 'OPERADOR_PORTARIA',
    });

    assert.equal(registration.status, 201);
    assert.deepEqual(registration.body, {
      id: 'user-123',
      email: 'ana@example.com',
      displayName: 'Ana',
      role: 'OPERADOR_PORTARIA',
    });
    assert.doesNotMatch(JSON.stringify(registration.body), /senha|password|scrypt/i);

    const login = await handlers.login({ email: 'ana@example.com', password: 'uma-senha-segura' });
    assert.equal(login.status, 200);
    assert.ok('token' in login.body);
    if (!('token' in login.body)) return;
    assert.doesNotMatch(JSON.stringify(login.body), /uma-senha-segura|scrypt/i);
    assert.deepEqual(service.verifySession(login.body.token), {
      userId: 'user-123',
      email: 'ana@example.com',
      role: 'OPERADOR_PORTARIA',
      iat: 1893456000,
      exp: 1893459600,
    });
  });

  it('rejeita e-mail duplicado com HTTP 409', async () => {
    const { handlers } = createIdentity();
    const input = { email: 'ana@example.com', displayName: 'Ana', password: 'uma-senha-segura' };
    assert.equal((await handlers.register(input)).status, 201);

    const duplicate = await handlers.register({ ...input, email: 'ANA@example.com' });
    assert.equal(duplicate.status, 409);
    assert.deepEqual(duplicate.body, { error: 'E-mail indisponível.' });
  });

  it('rejeita senha incorreta e conta inexistente com HTTP 401, sem token', async () => {
    const { handlers } = createIdentity();
    await handlers.register({ email: 'ana@example.com', displayName: 'Ana', password: 'uma-senha-segura' });

    for (const input of [
      { email: 'ana@example.com', password: 'senha-errada' },
      { email: 'inexistente@example.com', password: 'uma-senha-segura' },
    ]) {
      const result = await handlers.login(input);
      assert.equal(result.status, 401);
      assert.deepEqual(result.body, { error: 'Credenciais inválidas.' });
      assert.equal('token' in result.body, false);
    }
  });

  it('rejeita token de sessão expirado com HTTP 401', async () => {
    const { service } = createIdentity(new Date('2030-01-01T00:00:00Z'), 1);
    const user = await service.register({ email: 'ana@example.com', displayName: 'Ana', password: 'uma-senha-segura' });
    const token = service.issueToken(user);

    const expiredVerifier = { verifySession: (candidate: string) => verifySessionToken(candidate, JWT_SECRET, 1893456001) };
    const result = verifyBearerToken(`Bearer ${token}`, expiredVerifier);
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { error: 'Sessão inválida ou expirada.' });
  });
});
