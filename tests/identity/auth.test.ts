import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryIdentityRepository } from '../../src/modules/identity/repository.ts';
import { IdentityService } from '../../src/modules/identity/service.ts';
import {
  patchMyProfile,
  postAuthLogin,
  postPasswordRecoveryRequest,
  postPasswordReset,
  postRegister,
} from '../../src/modules/identity/routes.ts';

describe('Identity & Auth (RF-01 / AC-1)', () => {
  it('AC-1: cadastra conta com senha scrypt salgada, autentica usuário válido e rejeita duplicidade ou credencial incorreta', async () => {
    let clockMs = Date.parse('2026-11-18T12:00:00.000Z');
    const repo = new InMemoryIdentityRepository();
    const service = new IdentityService(repo, {
      jwtSecret: 'test-jwt-secret-identity',
      now: () => new Date(clockMs),
    });

    const regRes = await postRegister(service, {
      fullName: 'Joana Silva',
      email: 'Joana@CineFood.app',
      password: 'Password123!',
    });
    assert.equal(regRes.status, 201);
    if ('error' in regRes.body) {
      throw new Error(regRes.body.error);
    }
    assert.equal(regRes.body.email, 'joana@cinefood.app');
    assert.equal(regRes.body.role, 'CLIENTE');

    // Hash armazenado não contém senha em texto plano
    const stored = await repo.findUserByEmail('joana@cinefood.app');
    assert.ok(stored);
    assert.ok(stored.passwordHash.startsWith('scrypt:'));
    assert.ok(!stored.passwordHash.includes('Password123!'));

    // E-mail duplicado -> HTTP 409
    const dupRes = await postRegister(service, {
      fullName: 'Outra Pessoa',
      email: 'joana@cinefood.app',
      password: 'Password123!',
    });
    assert.equal(dupRes.status, 409);

    // Credencial incorreta -> HTTP 401
    const badLogin = await postAuthLogin(service, {
      email: 'joana@cinefood.app',
      password: 'WrongPassword!',
    });
    assert.equal(badLogin.status, 401);

    // Login válido -> HTTP 200 com token verificável
    const okLogin = await postAuthLogin(service, {
      email: 'joana@cinefood.app',
      password: 'Password123!',
    });
    assert.equal(okLogin.status, 200);
    if ('error' in okLogin.body) {
      throw new Error(okLogin.body.error);
    }
    const verifiedSession = service.verifySessionToken(okLogin.body.accessToken);
    assert.equal(verifiedSession.userId, regRes.body.userId);
    assert.equal(verifiedSession.role, 'CLIENTE');
  });

  it('recuperação de senha rejeita token expirado/reutilizado e edição de perfil bloqueia acesso cruzado', async () => {
    let clockMs = Date.parse('2026-11-18T12:00:00.000Z');
    const repo = new InMemoryIdentityRepository();
    const service = new IdentityService(repo, {
      jwtSecret: 'test-jwt-secret-identity',
      now: () => new Date(clockMs),
      recoveryTtlMs: 15 * 60 * 1000,
    });

    const alice = await postRegister(service, {
      fullName: 'Alice Souza',
      email: 'alice@cinefood.app',
      password: 'AliceSecret123',
    });
    const bob = await postRegister(service, {
      fullName: 'Bob Lima',
      email: 'bob@cinefood.app',
      password: 'BobSecret123',
    });
    if ('error' in alice.body || 'error' in bob.body) {
      throw new Error('Falha ao registrar usuários de teste');
    }

    // Token expirado é rejeitado
    const rec1 = await postPasswordRecoveryRequest(service, 'alice@cinefood.app');
    assert.equal(rec1.status, 200);
    if ('error' in rec1.body || !rec1.body.recoveryToken) {
      throw new Error('Esperava recoveryToken');
    }
    clockMs += 16 * 60 * 1000;
    const expiredReset = await postPasswordReset(service, {
      token: rec1.body.recoveryToken,
      newPassword: 'NewAlicePassword99',
    });
    assert.equal(expiredReset.status, 422);

    // Novo token válido redefine senha e bloqueia reutilização
    const rec2 = await postPasswordRecoveryRequest(service, 'alice@cinefood.app');
    if ('error' in rec2.body || !rec2.body.recoveryToken) {
      throw new Error('Esperava recoveryToken 2');
    }
    const validReset = await postPasswordReset(service, {
      token: rec2.body.recoveryToken,
      newPassword: 'NewAlicePassword99',
    });
    assert.equal(validReset.status, 200);

    const replayReset = await postPasswordReset(service, {
      token: rec2.body.recoveryToken,
      newPassword: 'AnotherPassword99',
    });
    assert.equal(replayReset.status, 422);

    const loginNew = await postAuthLogin(service, {
      email: 'alice@cinefood.app',
      password: 'NewAlicePassword99',
    });
    assert.equal(loginNew.status, 200);
    if ('error' in loginNew.body) {
      throw new Error(loginNew.body.error);
    }

    // Edição de perfil própria permitida; edição de perfil alheio -> HTTP 403
    const crossEdit = await patchMyProfile(service, loginNew.body.session, {
      targetUserId: bob.body.userId,
      fullName: 'Hacked Name',
    });
    assert.equal(crossEdit.status, 403);

    const ownEdit = await patchMyProfile(service, loginNew.body.session, {
      fullName: 'Alice M. Souza',
    });
    assert.equal(ownEdit.status, 200);
    if ('error' in ownEdit.body) {
      throw new Error(ownEdit.body.error);
    }
    assert.equal(ownEdit.body.fullName, 'Alice M. Souza');
  });
});
