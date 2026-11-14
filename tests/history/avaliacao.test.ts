import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AuthenticatedSession } from '../../src/modules/identity/types.ts';
import { InMemoryHistoryRepository } from '../../src/modules/history/repository.ts';
import { HistoryService } from '../../src/modules/history/service.ts';
import {
  deleteReviewRoute,
  getUserHistoryRoute,
  postReviewRoute,
  putReviewRoute,
} from '../../src/modules/history/routes.ts';

function client(userId: string): AuthenticatedSession {
  return { userId, role: 'CLIENTE' };
}

describe('Histórico Privado e Avaliação Pós-Sessão (RF-11, RF-13 / MAR-03)', () => {
  it('AC-3: exibe somente registros do próprio titular com estados persistidos', async () => {
    const repo = new InMemoryHistoryRepository();
    const service = new HistoryService(repo, {
      now: () => new Date('2026-12-14T20:00:00.000Z'),
    });

    repo.seedTicket({
      ticketId: 'tkt-joana-1',
      purchaseId: 'pur-joana-1',
      ownerUserId: 'usr-joana',
      screeningId: 'scr-1',
      movieTitle: 'CIDADE DE FERRO',
      cinemaName: 'CineFood Paulista IMAX',
      roomName: 'Sala 1 IMAX',
      seatId: 'G7',
      startsAt: '2026-12-14T21:40:00.000Z',
      endsAt: '2026-12-14T23:55:00.000Z',
      status: 'UTILIZADO',
      usedAt: '2026-12-14T21:35:00.000Z',
    });
    repo.seedCanteenOrder({
      orderId: 'cnt-joana-1',
      purchaseId: 'pur-joana-1',
      ownerUserId: 'usr-joana',
      summary: '1× Combo IMAX Manteiga Trufada',
      deliveryChannel: 'ENTREGA_ASSENTO',
      status: 'EM_PREPARO',
      totalCents: 4800,
      createdAt: '2026-12-14T19:40:00.000Z',
    });
    repo.seedRefund({
      refundId: 'ref-joana-1',
      purchaseId: 'pur-joana-old',
      ownerUserId: 'usr-joana',
      reason: 'PIX_TARDIO',
      amountCents: 4000,
      status: 'ESTORNADO',
      createdAt: '2026-12-13T18:00:00.000Z',
    });

    // Dados pertencentes a outro usuário
    repo.seedTicket({
      ticketId: 'tkt-carlos-1',
      purchaseId: 'pur-carlos-1',
      ownerUserId: 'usr-carlos',
      screeningId: 'scr-1',
      movieTitle: 'CIDADE DE FERRO',
      cinemaName: 'CineFood Paulista IMAX',
      roomName: 'Sala 1 IMAX',
      seatId: 'H1',
      startsAt: '2026-12-14T21:40:00.000Z',
      endsAt: '2026-12-14T23:55:00.000Z',
      status: 'EMITIDO',
    });

    const okNotice = await service.recordInternalNoticeBestEffort({
      ownerUserId: 'usr-joana',
      orderId: 'cnt-joana-1',
      type: 'INFO',
      title: 'Preparo iniciado na cantina',
      message: 'Sua entrada foi validada na portaria e o combo entrou em preparo.',
    });
    assert.equal(okNotice.dispatched, true);

    // Falha no canal de aviso interno não derruba operação nem corrompe registros já persistidos
    repo.failNoticeWrite = true;
    const degradedNotice = await service.recordInternalNoticeBestEffort({
      ownerUserId: 'usr-joana',
      orderId: 'cnt-joana-1',
      type: 'WARNING',
      title: 'Aviso secundário',
      message: 'Falha transitória de notificação',
    });
    assert.equal(degradedNotice.dispatched, false);
    repo.failNoticeWrite = false;

    const joanaHistory = await getUserHistoryRoute(service, client('usr-joana'));
    assert.equal(joanaHistory.status, 200);
    if ('error' in joanaHistory.body) {
      throw new Error(`Esperava 200, recebeu: ${joanaHistory.body.error}`);
    }

    assert.equal(joanaHistory.body.ownerUserId, 'usr-joana');
    assert.equal(joanaHistory.body.tickets.length, 1);
    assert.equal(joanaHistory.body.tickets[0].status, 'UTILIZADO');
    assert.equal(joanaHistory.body.canteenOrders.length, 1);
    assert.equal(joanaHistory.body.canteenOrders[0].status, 'EM_PREPARO');
    assert.equal(joanaHistory.body.refunds.length, 1);
    assert.equal(joanaHistory.body.notices.length, 1);

    // Isolamento: tentativa de CLIENTE consultar histórico de terceiro retorna 403
    const crossAccess = await getUserHistoryRoute(
      service,
      client('usr-carlos'),
      'usr-joana',
    );
    assert.equal(crossAccess.status, 403);
  });

  it('AC-4: aceita avaliação de 1 a 5 estrelas apenas após término da sessão para ingresso validado na portaria', async () => {
    let clock = new Date('2026-12-14T22:15:00.000Z'); // sessão ainda em andamento (fim às 23:55)
    const repo = new InMemoryHistoryRepository();
    const service = new HistoryService(repo, { now: () => clock });

    repo.seedTicket({
      ticketId: 'tkt-utilizado',
      purchaseId: 'pur-1',
      ownerUserId: 'usr-joana',
      screeningId: 'scr-1',
      movieTitle: 'ÓRBITA ESCARLATE',
      cinemaName: 'CineFood Paulista IMAX',
      roomName: 'Sala 1 IMAX',
      seatId: 'C4',
      startsAt: '2026-12-14T21:40:00.000Z',
      endsAt: '2026-12-14T23:55:00.000Z',
      status: 'UTILIZADO',
      usedAt: '2026-12-14T21:30:00.000Z',
    });

    repo.seedTicket({
      ticketId: 'tkt-nao-usado',
      purchaseId: 'pur-2',
      ownerUserId: 'usr-joana',
      screeningId: 'scr-1',
      movieTitle: 'ÓRBITA ESCARLATE',
      cinemaName: 'CineFood Paulista IMAX',
      roomName: 'Sala 1 IMAX',
      seatId: 'C5',
      startsAt: '2026-12-14T21:40:00.000Z',
      endsAt: '2026-12-14T23:55:00.000Z',
      status: 'EMITIDO',
    });

    repo.seedTicket({
      ticketId: 'tkt-cancelado',
      purchaseId: 'pur-3',
      ownerUserId: 'usr-joana',
      screeningId: 'scr-1',
      movieTitle: 'ÓRBITA ESCARLATE',
      cinemaName: 'CineFood Paulista IMAX',
      roomName: 'Sala 1 IMAX',
      seatId: 'C6',
      startsAt: '2026-12-14T21:40:00.000Z',
      endsAt: '2026-12-14T23:55:00.000Z',
      status: 'CANCELADO',
    });

    // Antes do encerramento da sessão -> HTTP 422
    const beforeEndRes = await postReviewRoute(service, client('usr-joana'), {
      ticketId: 'tkt-utilizado',
      rating: 5,
      comment: 'Excelente som',
    });
    assert.equal(beforeEndRes.status, 422);

    // Avança o relógio para após o término da sessão
    clock = new Date('2026-12-15T00:10:00.000Z');

    // Ingresso não validado na portaria (EMITIDO) ou CANCELADO -> HTTP 422
    const notCheckedInRes = await postReviewRoute(service, client('usr-joana'), {
      ticketId: 'tkt-nao-usado',
      rating: 4,
    });
    assert.equal(notCheckedInRes.status, 422);

    const cancelledRes = await postReviewRoute(service, client('usr-joana'), {
      ticketId: 'tkt-cancelado',
      rating: 2,
    });
    assert.equal(cancelledRes.status, 422);

    // Notas fora do intervalo inteiro 1..5 -> HTTP 422
    const ratingZeroRes = await postReviewRoute(service, client('usr-joana'), {
      ticketId: 'tkt-utilizado',
      rating: 0,
    });
    assert.equal(ratingZeroRes.status, 422);

    const ratingSixRes = await postReviewRoute(service, client('usr-joana'), {
      ticketId: 'tkt-utilizado',
      rating: 6,
    });
    assert.equal(ratingSixRes.status, 422);

    // Outro usuário não pode avaliar ingresso alheio -> HTTP 403
    const foreignReviewRes = await postReviewRoute(service, client('usr-carlos'), {
      ticketId: 'tkt-utilizado',
      rating: 5,
    });
    assert.equal(foreignReviewRes.status, 403);

    // Criação válida pós-sessão -> HTTP 201
    const createdRes = await postReviewRoute(service, client('usr-joana'), {
      ticketId: 'tkt-utilizado',
      rating: 5,
      comment: 'Projeção IMAX impecável.',
    });
    assert.equal(createdRes.status, 201);
    if ('error' in createdRes.body) {
      throw new Error(`Esperava 201, recebeu: ${createdRes.body.error}`);
    }
    const reviewId = createdRes.body.reviewId;
    assert.equal(createdRes.body.rating, 5);

    // Edição pelo próprio titular -> HTTP 200; por terceiro -> HTTP 403
    const foreignUpdate = await putReviewRoute(service, client('usr-carlos'), reviewId, {
      rating: 1,
    });
    assert.equal(foreignUpdate.status, 403);

    const ownerUpdate = await putReviewRoute(service, client('usr-joana'), reviewId, {
      rating: 4,
      comment: 'Comentário atualizado.',
    });
    assert.equal(ownerUpdate.status, 200);
    if (!('error' in ownerUpdate.body)) {
      assert.equal(ownerUpdate.body.rating, 4);
      assert.equal(ownerUpdate.body.comment, 'Comentário atualizado.');
    }

    // Exclusão por terceiro -> HTTP 403; pelo titular -> HTTP 204
    const foreignDelete = await deleteReviewRoute(service, client('usr-carlos'), reviewId);
    assert.equal(foreignDelete.status, 403);

    const ownerDelete = await deleteReviewRoute(service, client('usr-joana'), reviewId);
    assert.equal(ownerDelete.status, 204);
    assert.equal(await repo.findReviewById(reviewId), undefined);
  });
});
