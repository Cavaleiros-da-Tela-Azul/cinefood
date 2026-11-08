import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCatalogRepository } from '../../src/modules/catalog/repository.ts';
import { beginScreeningSelection, getScreenings } from '../../src/modules/catalog/routes.ts';
import { DefaultCatalogService } from '../../src/modules/catalog/service.ts';

const now = new Date('2030-06-15T12:00:00.000Z');

function createService() {
  return new DefaultCatalogService(new InMemoryCatalogRepository([
    {
      id: 'screening-dune-imax', roomId: 'room-1', roomName: 'Sala 1', cinemaName: 'CineFood Centro',
      startsAt: new Date('2030-06-15T15:30:00.000Z'), status: 'ATIVA', format: 'IMAX', basePrice: 38,
      movie: { id: 'dune', title: 'Duna: Parte Dois', synopsis: 'A jornada de Paul Atreides.', durationMinutes: 166, ageRating: '14 anos' },
    },
    {
      id: 'screening-dune-3d', roomId: 'room-2', roomName: 'Sala 2', cinemaName: 'CineFood Centro',
      startsAt: new Date('2030-06-16T18:00:00.000Z'), status: 'ATIVA', format: '3D', basePrice: 32,
      movie: { id: 'dune', title: 'Duna: Parte Dois', synopsis: 'A jornada de Paul Atreides.', durationMinutes: 166, ageRating: '14 anos' },
    },
    {
      id: 'screening-inactive', roomId: 'room-3', roomName: 'Sala 3', cinemaName: 'CineFood Centro',
      startsAt: new Date('2030-06-15T20:00:00.000Z'), status: 'INATIVA', format: '2D', basePrice: 25,
      movie: { id: 'other', title: 'Outro Filme', synopsis: 'Indisponível.', durationMinutes: 100, ageRating: 'Livre' },
    },
    {
      id: 'screening-ended', roomId: 'room-4', roomName: 'Sala 4', cinemaName: 'CineFood Centro',
      startsAt: new Date('2030-06-15T11:59:00.000Z'), status: 'ATIVA', format: '2D', basePrice: 25,
      movie: { id: 'old', title: 'Sessão Encerrada', synopsis: 'Indisponível.', durationMinutes: 100, ageRating: 'Livre' },
    },
  ]), () => now);
}

describe('Catálogo e Sessões (RF-02 / AC-3)', () => {
  it('lista apenas programações ativas e futuras com os detalhes obrigatórios', async () => {
    const result = await getScreenings(createService());

    assert.equal(result.status, 200);
    assert.equal(result.body.length, 2);
    assert.deepEqual(result.body[0], {
      id: 'screening-dune-imax', roomId: 'room-1', roomName: 'Sala 1', cinemaName: 'CineFood Centro',
      startsAt: new Date('2030-06-15T15:30:00.000Z'), status: 'ATIVA', format: 'IMAX', basePrice: 38,
      movie: { id: 'dune', title: 'Duna: Parte Dois', synopsis: 'A jornada de Paul Atreides.', durationMinutes: 166, ageRating: '14 anos' },
    });
  });

  it('aplica filtros exatos por filme, data, formato e horário', async () => {
    const result = await getScreenings(createService(), {
      movieQuery: 'DUNA',
      date: '2030-06-15',
      format: 'IMAX',
      startTime: '15:30',
    });

    assert.equal(result.status, 200);
    assert.deepEqual(result.body.map((screening) => screening.id), ['screening-dune-imax']);
  });

  it('bloqueia início de seleção para sessão encerrada ou desabilitada', async () => {
    const service = createService();
    const ended = await beginScreeningSelection(service, 'screening-ended');
    const inactive = await beginScreeningSelection(service, 'screening-inactive');

    assert.deepEqual(ended, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
    assert.deepEqual(inactive, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
  });
});
