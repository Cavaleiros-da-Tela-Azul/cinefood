import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCatalogRepository } from '../../src/modules/catalog/repository.ts';
import { beginScreeningSelection, getScreenings } from '../../src/modules/catalog/routes.ts';
import { DefaultCatalogService } from '../../src/modules/catalog/service.ts';

const now = new Date(2030, 5, 15, 12, 0, 0);

function createService() {
  return new DefaultCatalogService(
    new InMemoryCatalogRepository([
      {
        id: 'screening-dune-imax',
        roomId: 'room-1',
        roomName: 'Sala 1',
        cinemaName: 'CineFood Centro',
        startsAt: new Date(2030, 5, 15, 15, 30, 0),
        status: 'ATIVA',
        format: 'IMAX',
        basePrice: 38,
        movie: {
          id: 'dune',
          title: 'Duna: Parte Dois',
          synopsis: 'A jornada de Paul Atreides.',
          durationMinutes: 166,
          ageRating: '14 anos',
          genre: 'Ficção Científica',
          director: 'Denis Villeneuve',
        },
      },
      {
        id: 'screening-dune-night',
        roomId: 'room-2',
        roomName: 'Sala 2',
        cinemaName: 'CineFood Paulista',
        startsAt: new Date(2030, 5, 15, 22, 30, 0),
        status: 'ATIVA',
        format: 'Dolby Atmos',
        basePrice: 44,
        movie: {
          id: 'dune',
          title: 'Duna: Parte Dois',
          synopsis: 'A jornada de Paul Atreides.',
          durationMinutes: 166,
          ageRating: '14 anos',
          genre: 'Ficção Científica',
          director: 'Denis Villeneuve',
        },
      },
      {
        id: 'screening-next-day-early',
        roomId: 'room-5',
        roomName: 'Sala 5',
        cinemaName: 'CineFood Centro',
        startsAt: new Date(2030, 5, 16, 1, 30, 0),
        status: 'ATIVA',
        format: '2D',
        basePrice: 28,
        movie: {
          id: 'auto-compadecida',
          title: 'O Auto da Compadecida 2',
          synopsis: 'O reencontro de João Grilo e Chicó.',
          durationMinutes: 114,
          ageRating: '12 anos',
        },
      },
      {
        id: 'screening-inactive',
        roomId: 'room-3',
        roomName: 'Sala 3',
        cinemaName: 'CineFood Centro',
        startsAt: new Date(2030, 5, 15, 20, 0, 0),
        status: 'INATIVA',
        format: '2D',
        basePrice: 25,
        movie: {
          id: 'other',
          title: 'Outro Filme',
          synopsis: 'Indisponível.',
          durationMinutes: 100,
          ageRating: 'Livre',
          genre: 'Drama',
          director: 'Diretor Teste',
        },
      },
      {
        id: 'screening-ended',
        roomId: 'room-4',
        roomName: 'Sala 4',
        cinemaName: 'CineFood Centro',
        startsAt: new Date(2030, 5, 15, 11, 59, 0),
        status: 'ATIVA',
        format: '2D',
        basePrice: 25,
        movie: {
          id: 'old',
          title: 'Sessão Encerrada',
          synopsis: 'Indisponível.',
          durationMinutes: 100,
          ageRating: 'Livre',
          genre: 'Ação',
          director: 'Outro Diretor',
        },
      },
    ]),
    () => now,
  );
}

describe('Catálogo e Sessões (RF-02 / AC-3)', () => {
  it('lista apenas programações ativas e futuras em ordem cronológica com defaults seguros', async () => {
    const result = await getScreenings(createService());

    assert.equal(result.status, 200);
    assert.deepEqual(
      result.body.map((screening) => screening.id),
      ['screening-dune-imax', 'screening-dune-night', 'screening-next-day-early'],
    );
    assert.deepEqual(result.body[0], {
      id: 'screening-dune-imax',
      roomId: 'room-1',
      roomName: 'Sala 1',
      cinemaName: 'CineFood Centro',
      startsAt: new Date(2030, 5, 15, 15, 30, 0),
      status: 'ATIVA',
      format: 'IMAX',
      basePrice: 38,
      movie: {
        id: 'dune',
        title: 'Duna: Parte Dois',
        synopsis: 'A jornada de Paul Atreides.',
        durationMinutes: 166,
        ageRating: '14 anos',
        genre: 'Ficção Científica',
        director: 'Denis Villeneuve',
      },
    });
    assert.equal(result.body[2].movie.genre, '');
    assert.equal(result.body[2].movie.director, '');
  });

  it('filtra por movieQuery em título, gênero e diretor e pelos filtros dedicados genre, director e complex/cinemaName', async () => {
    const service = createService();

    const byTitle = await getScreenings(service, { movieQuery: 'duna' });
    assert.deepEqual(
      byTitle.body.map((s) => s.id),
      ['screening-dune-imax', 'screening-dune-night'],
    );

    const byQueryGenre = await getScreenings(service, { movieQuery: 'ficção' });
    assert.deepEqual(
      byQueryGenre.body.map((s) => s.id),
      ['screening-dune-imax', 'screening-dune-night'],
    );

    const byQueryDirector = await getScreenings(service, { movieQuery: 'villeneuve' });
    assert.deepEqual(
      byQueryDirector.body.map((s) => s.id),
      ['screening-dune-imax', 'screening-dune-night'],
    );

    const byExplicitFilters = await getScreenings(service, {
      genre: 'Ficção Científica',
      director: 'Denis Villeneuve',
      complex: 'Paulista',
    });
    assert.deepEqual(
      byExplicitFilters.body.map((s) => s.id),
      ['screening-dune-night'],
    );

    const byCinemaName = await getScreenings(service, {
      cinemaName: 'CineFood Centro',
      movieId: 'auto-compadecida',
    });
    assert.deepEqual(
      byCinemaName.body.map((s) => s.id),
      ['screening-next-day-early'],
    );
  });

  it('compara data e horário em fuso local evitando deslocamento UTC em sessões noturnas', async () => {
    const service = createService();

    const nightSession = await getScreenings(service, {
      date: '2030-06-15',
      startTime: '22:30',
    });
    assert.equal(nightSession.status, 200);
    assert.deepEqual(
      nightSession.body.map((s) => s.id),
      ['screening-dune-night'],
    );

    const sameDaySessions = await getScreenings(service, { date: '2030-06-15' });
    assert.deepEqual(
      sameDaySessions.body.map((s) => s.id),
      ['screening-dune-imax', 'screening-dune-night'],
    );

    const nextDaySessions = await getScreenings(service, { date: '2030-06-16' });
    assert.deepEqual(
      nextDaySessions.body.map((s) => s.id),
      ['screening-next-day-early'],
    );
  });

  it('bloqueia início de seleção para sessão encerrada, inativa ou inexistente', async () => {
    const service = createService();

    const active = await beginScreeningSelection(service, 'screening-dune-imax');
    const ended = await beginScreeningSelection(service, 'screening-ended');
    const inactive = await beginScreeningSelection(service, 'screening-inactive');
    const missing = await beginScreeningSelection(service, 'screening-missing');

    assert.deepEqual(active, { status: 200, body: { screeningId: 'screening-dune-imax' } });
    assert.deepEqual(ended, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
    assert.deepEqual(inactive, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
    assert.deepEqual(missing, { status: 409, body: { error: 'Sessão encerrada, inativa ou inexistente.' } });
  });
});
