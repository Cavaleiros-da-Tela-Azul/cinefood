import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authenticatedUserId, rolesFor } from '../../src/modules/identity/rbac.ts';
import { requireRole } from '../../src/modules/identity/routes.ts';
import type { AuthenticatedSession, UserRole } from '../../src/modules/identity/types.ts';

function session(role: UserRole, userId = 'user-authenticated'): AuthenticatedSession {
  return {
    userId,
    email: `${userId}@example.com`,
    role,
    iat: 1_893_456_000,
    exp: 1_893_460_000,
  };
}

describe('RBAC Authorization (RF-01 / AC-2)', () => {
  it('suporta os cinco perfis e autoriza cada operação somente ao perfil correto', () => {
    assert.deepEqual(rolesFor('CLIENT_ACCOUNT'), ['CLIENTE', 'ADMIN_CINEMA']);
    assert.deepEqual(rolesFor('TICKET_VALIDATION'), ['OPERADOR_PORTARIA', 'ADMIN_CINEMA']);
    assert.deepEqual(rolesFor('CANTEEN_OPERATION'), ['OPERADOR_CANTINA', 'ADMIN_CINEMA']);
    assert.deepEqual(rolesFor('DELIVERY_OPERATION'), ['RUNNER', 'ADMIN_CINEMA']);
    assert.deepEqual(rolesFor('ADMINISTRATION'), ['ADMIN_CINEMA']);

    assert.equal(requireRole(session('OPERADOR_PORTARIA'), 'TICKET_VALIDATION').status, 200);
    assert.equal(requireRole(session('OPERADOR_CANTINA'), 'CANTEEN_OPERATION').status, 200);
    assert.equal(requireRole(session('RUNNER'), 'DELIVERY_OPERATION').status, 200);
    assert.equal(requireRole(session('ADMIN_CINEMA'), 'ADMINISTRATION').status, 200);
  });

  it('bloqueia CLIENTE de rotas operacionais e administrativas com HTTP 403', () => {
    const client = session('CLIENTE');
    for (const operation of ['TICKET_VALIDATION', 'CANTEEN_OPERATION', 'DELIVERY_OPERATION', 'ADMINISTRATION'] as const) {
      const result = requireRole(client, operation);
      assert.equal(result.status, 403);
      assert.deepEqual(result.body, { error: 'Acesso negado para este perfil.' });
    }
  });

  it('bloqueia escalonamento entre papéis operacionais com HTTP 403', () => {
    assert.equal(requireRole(session('OPERADOR_PORTARIA'), 'CANTEEN_OPERATION').status, 403);
    assert.equal(requireRole(session('OPERADOR_CANTINA'), 'DELIVERY_OPERATION').status, 403);
    assert.equal(requireRole(session('RUNNER'), 'TICKET_VALIDATION').status, 403);
  });

  it('usa sempre o userId do token e bloqueia acesso de CLIENTE a outra conta', () => {
    const client = session('CLIENTE', 'buyer-1');
    const ownAccount = requireRole(client, 'CLIENT_ACCOUNT', 'buyer-1');
    const anotherAccount = requireRole(client, 'CLIENT_ACCOUNT', 'buyer-2');

    assert.deepEqual(ownAccount, { status: 200, body: { userId: 'buyer-1' } });
    assert.deepEqual(anotherAccount, { status: 403, body: { error: 'Acesso negado para este perfil.' } });
    assert.equal(authenticatedUserId(client), 'buyer-1');
  });
});
