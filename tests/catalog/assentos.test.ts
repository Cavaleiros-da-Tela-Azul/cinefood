import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCatalogRepository } from '../../src/modules/catalog/repository.ts';
import { getSeatMap } from '../../src/modules/catalog/routes.ts';
import { DefaultCatalogService } from '../../src/modules/catalog/service.ts';

const now = new Date('2030-01-01T12:00:00.000Z');

function createService(screeningOverrides = {}) {
  const repository = new InMemoryCatalogRepository(
    [{
      id: 'session-1',
      roomId: 'room-1',
      startsAt: new Date('2030-01-01T14:00:00.000Z'),
      status: 'ATIVA' as const,
      ...screeningOverrides,
    }],
    [
      { id: 'seat-b2', screeningId: 'session-1', row: 'B', number: 2, state: 'OCUPADO' as const },
      { id: 'seat-a2', screeningId: 'session-1', row: 'A', number: 2, state: 'RESERVADO' as const, temporaryHoldExpiresAt: new Date('2030-01-01T12:10:00.000Z') },
      { id: 'seat-a1', screeningId: 'session-1', row: 'A', number: 1, state: 'DISPONIVEL' as const },
      { id: 'seat-b1', screeningId: 'session-1', row: 'B', number: 1, state: 'RESERVADO' as const, temporaryHoldExpiresAt: new Date('2030-01-01T12:00:00.000Z') },
    ],
  );
  return new DefaultCatalogService(repository, () => now);
}

describe('Mapa de Assentos (RF-02 / AC-4)', () => {
  it('retorna o mapa completo, ordenado e com os estados atuais da sessão', async () => {
    const result = await getSeatMap(createService(), 'session-1');

    assert.deepEqual(result, {
      status: 200,
      body: [
        { id: 'seat-a1', row: 'A', number: 1, state: 'DISPONIVEL' },
        { id: 'seat-a2', row: 'A', number: 2, state: 'RESERVADO' },
        { id: 'seat-b1', row: 'B', number: 1, state: 'DISPONIVEL' },
        { id: 'seat-b2', row: 'B', number: 2, state: 'OCUPADO' },
      ],
    });
  });

  it('considera disponível o bloqueio temporário cuja janela de dez minutos expirou', async () => {
    const result = await getSeatMap(createService(), 'session-1');
    assert.equal(result.status, 200);
    if (Array.isArray(result.body)) {
      assert.equal(result.body.find((seat) => seat.id === 'seat-b1')?.state, 'DISPONIVEL');
      assert.equal(result.body.find((seat) => seat.id === 'seat-a2')?.state, 'RESERVADO');
    }
  });

  it('rejeita a consulta de sessão encerrada ou inativa', async () => {
    const ended = await getSeatMap(createService({ startsAt: new Date('2030-01-01T11:59:59.000Z') }), 'session-1');
    const inactive = await getSeatMap(createService({ status: 'INATIVA' as const }), 'session-1');

    assert.deepEqual(ended, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
    assert.deepEqual(inactive, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
  });
});
