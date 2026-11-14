import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCatalogRepository } from '../../src/modules/catalog/repository.ts';
import { getSeatMap } from '../../src/modules/catalog/routes.ts';
import { DefaultCatalogService } from '../../src/modules/catalog/service.ts';
import type { StoredSeat } from '../../src/modules/catalog/types.ts';

const now = new Date('2030-01-01T12:00:00.000Z');

function createService(screeningOverrides = {}, seatsOverride?: StoredSeat[]) {
  const defaultSeats: StoredSeat[] = [
    { id: 'seat-b2', screeningId: 'session-1', row: 'B', number: 2, state: 'OCUPADO', category: 'standard' },
    {
      id: 'seat-a2',
      screeningId: 'session-1',
      row: 'A',
      number: 2,
      state: 'RESERVADO',
      category: 'pcd-wheelchair',
      temporaryHoldExpiresAt: new Date('2030-01-01T12:10:00.000Z'),
    },
    { id: 'seat-a1', screeningId: 'session-1', row: 'A', number: 1, state: 'DISPONIVEL' },
    {
      id: 'seat-b1',
      screeningId: 'session-1',
      row: 'B',
      number: 1,
      state: 'RESERVADO',
      category: 'pcd-plus',
      temporaryHoldExpiresAt: new Date('2030-01-01T12:00:00.000Z'),
    },
  ];

  const repository = new InMemoryCatalogRepository(
    [
      {
        id: 'session-1',
        roomId: 'room-1',
        startsAt: new Date('2030-01-01T14:00:00.000Z'),
        status: 'ATIVA' as const,
        ...screeningOverrides,
      },
    ],
    seatsOverride ?? defaultSeats,
  );
  return new DefaultCatalogService(repository, () => now);
}

describe('Mapa de Assentos (RF-02 / AC-4)', () => {
  it('retorna o mapa completo ordenado por fila e número com estados e categorias (default standard)', async () => {
    const result = await getSeatMap(createService(), 'session-1');

    assert.deepEqual(result, {
      status: 200,
      body: [
        { id: 'seat-a1', row: 'A', number: 1, state: 'DISPONIVEL', category: 'standard' },
        { id: 'seat-a2', row: 'A', number: 2, state: 'RESERVADO', category: 'pcd-wheelchair' },
        { id: 'seat-b1', row: 'B', number: 1, state: 'DISPONIVEL', category: 'pcd-plus' },
        { id: 'seat-b2', row: 'B', number: 2, state: 'OCUPADO', category: 'standard' },
      ],
    });
  });

  it('libera bloqueio temporário de 10 minutos após expiração mantendo bloqueios ativos', async () => {
    const seats: StoredSeat[] = [
      {
        id: 'seat-expired-exact',
        screeningId: 'session-1',
        row: 'A',
        number: 1,
        state: 'RESERVADO',
        category: 'standard',
        temporaryHoldExpiresAt: new Date('2030-01-01T12:00:00.000Z'),
      },
      {
        id: 'seat-expired-past',
        screeningId: 'session-1',
        row: 'A',
        number: 2,
        state: 'RESERVADO',
        category: 'pcd-plus',
        temporaryHoldExpiresAt: new Date('2030-01-01T11:59:59.000Z'),
      },
      {
        id: 'seat-active-hold',
        screeningId: 'session-1',
        row: 'A',
        number: 3,
        state: 'RESERVADO',
        category: 'pcd-wheelchair',
        temporaryHoldExpiresAt: new Date('2030-01-01T12:10:00.000Z'),
      },
    ];

    const result = await getSeatMap(createService({}, seats), 'session-1');
    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.body));
    assert.deepEqual(result.body, [
      { id: 'seat-expired-exact', row: 'A', number: 1, state: 'DISPONIVEL', category: 'standard' },
      { id: 'seat-expired-past', row: 'A', number: 2, state: 'DISPONIVEL', category: 'pcd-plus' },
      { id: 'seat-active-hold', row: 'A', number: 3, state: 'RESERVADO', category: 'pcd-wheelchair' },
    ]);
  });

  it('rejeita a consulta de sessão encerrada, inativa ou inexistente', async () => {
    const ended = await getSeatMap(createService({ startsAt: new Date('2030-01-01T11:59:59.000Z') }), 'session-1');
    const startedNow = await getSeatMap(createService({ startsAt: now }), 'session-1');
    const inactive = await getSeatMap(createService({ status: 'INATIVA' as const }), 'session-1');
    const missing = await getSeatMap(createService(), 'session-unknown');

    assert.deepEqual(ended, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
    assert.deepEqual(startedNow, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
    assert.deepEqual(inactive, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
    assert.deepEqual(missing, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
  });
});
