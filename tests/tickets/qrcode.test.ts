import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AuthenticatedSession } from '../../src/modules/identity/types.ts';
import {
  InMemoryCanteenKdsTrigger,
  InMemoryTicketRepository,
} from '../../src/modules/tickets/repository.ts';
import {
  generateOpaqueQrToken,
  TicketsService,
} from '../../src/modules/tickets/service.ts';
import {
  getTicketsForPurchase,
  postGateValidateTicket,
  postIssueTickets,
} from '../../src/modules/tickets/routes.ts';

function buyerSession(userId: string): AuthenticatedSession {
  return { userId, role: 'CLIENTE' };
}

function portariaSession(userId = 'op-portaria-1'): AuthenticatedSession {
  return { userId, role: 'OPERADOR_PORTARIA' };
}

describe('Emissão e Validação Atômica de QR Code (RF-05, RF-06 / MAR-03)', () => {
  it('AC-1: emite um ingresso e QR Code opaco distinto por assento apenas após confirmação de pagamento', async () => {
    const repo = new InMemoryTicketRepository();
    const service = new TicketsService(repo, {
      tokenSecret: 'test-qr-secret-key',
      now: () => new Date('2026-12-14T19:00:00.000Z'),
    });

    const screening = {
      screeningId: 'scr-imax-2140',
      movieTitle: 'CIDADE DE FERRO',
      cinemaName: 'CineFood Paulista IMAX',
      roomName: 'Sala 1 IMAX',
      startsAt: '2026-12-14T21:40:00.000Z',
      endsAt: '2026-12-14T23:55:00.000Z',
    };

    const seats = [
      { reservationId: 'res-g7', seatId: 'G7', row: 'G', number: 7, category: 'INTEIRA' as const },
      {
        reservationId: 'res-g8',
        seatId: 'G8',
        row: 'G',
        number: 8,
        category: 'MEIA' as const,
        meiaDoc: 'CIE-991020',
      },
    ];

    // Cenário 2: bloqueio estrito antes da confirmação de pagamento (PENDENTE e CANCELADO)
    const pendingRes = await postIssueTickets(service, {
      purchaseId: 'pur-pendente-1',
      buyerUserId: 'usr-joana',
      paymentStatus: 'PENDENTE',
      screening,
      seats,
    });
    assert.equal(pendingRes.status, 422);
    assert.equal((await repo.findByPurchaseId('pur-pendente-1')).length, 0);

    const cancelledRes = await postIssueTickets(service, {
      purchaseId: 'pur-cancel-1',
      buyerUserId: 'usr-joana',
      paymentStatus: 'CANCELADO',
      screening,
      seats,
    });
    assert.equal(cancelledRes.status, 422);
    assert.equal((await repo.findByPurchaseId('pur-cancel-1')).length, 0);

    // Consulta externa não encontra QR enquanto pendente
    const pendingLookup = await getTicketsForPurchase(service, buyerSession('usr-joana'), 'pur-pendente-1');
    assert.equal(pendingLookup.status, 404);

    // Cenário 1: compra aprovada com múltiplos assentos emite QR Code opaco distinto por poltrona
    const approvedRes = await postIssueTickets(service, {
      purchaseId: 'pur-aprovada-1',
      buyerUserId: 'usr-joana',
      paymentStatus: 'APROVADO',
      screening,
      seats,
    });
    assert.equal(approvedRes.status, 201);
    if ('error' in approvedRes.body) {
      throw new Error(`Esperava emissão 201, recebeu: ${approvedRes.body.error}`);
    }

    assert.equal(approvedRes.body.canteenPreLinkAvailable, true);
    assert.equal(approvedRes.body.tickets.length, 2);

    const [t1, t2] = approvedRes.body.tickets;
    assert.notEqual(t1.ticketId, t2.ticketId);
    assert.notEqual(t1.qrToken, t2.qrToken);
    assert.match(t1.qrToken, /^cf_qr_[A-Za-z0-9_-]{32}$/);
    assert.match(t2.qrToken, /^cf_qr_[A-Za-z0-9_-]{32}$/);

    // Token não expõe nem permite enumeração sequencial com seatId ou purchaseId
    assert.equal(t1.qrToken.includes('G7'), false);
    assert.equal(t1.qrToken.includes('pur-aprovada-1'), false);
    const sameContextToken = generateOpaqueQrToken('test-qr-secret-key', {
      purchaseId: 'pur-aprovada-1',
      reservationId: 'res-g7',
      seatId: 'G7',
    });
    assert.notEqual(sameContextToken, t1.qrToken);

    // Payload completo do bilhete individual
    assert.equal(t1.seatId, 'G7');
    assert.equal(t1.row, 'G');
    assert.equal(t1.number, 7);
    assert.equal(t1.category, 'INTEIRA');
    assert.equal(t1.status, 'EMITIDO');
    assert.equal(t1.movieTitle, 'CIDADE DE FERRO');
    assert.equal(t1.roomName, 'Sala 1 IMAX');
    assert.equal(t1.canteenPreLinkEligible, true);

    assert.equal(t2.seatId, 'G8');
    assert.equal(t2.category, 'MEIA');
    assert.equal(t2.status, 'EMITIDO');

    // Idempotência na repetição de liquidação não duplica nem rotaciona tokens já emitidos
    const replayRes = await postIssueTickets(service, {
      purchaseId: 'pur-aprovada-1',
      buyerUserId: 'usr-joana',
      paymentStatus: 'APROVADO',
      screening,
      seats,
    });
    assert.equal(replayRes.status, 201);
    if (!('error' in replayRes.body)) {
      assert.equal(replayRes.body.tickets[0].qrToken, t1.qrToken);
      assert.equal(replayRes.body.tickets[1].qrToken, t2.qrToken);
    }

    // Isolamento de leitura entre contas
    const otherUserLookup = await getTicketsForPurchase(service, buyerSession('usr-outro'), 'pur-aprovada-1');
    assert.equal(otherUserLookup.status, 403);
    const ownerLookup = await getTicketsForPurchase(service, buyerSession('usr-joana'), 'pur-aprovada-1');
    assert.equal(ownerLookup.status, 200);
  });

  it('AC-2: aprova apenas a primeira leitura válida na portaria e dispara preparo de pedido vinculado na cantina', async () => {
    let clock = new Date('2026-12-14T21:30:00.000Z');
    const repo = new InMemoryTicketRepository();
    const kds = new InMemoryCanteenKdsTrigger();
    const service = new TicketsService(repo, {
      tokenSecret: 'test-qr-secret-key',
      now: () => clock,
      onTicketValidated: (event) => kds.handleTicketValidated(event),
    });

    const issued = await service.issueTicketsForPaidOrder({
      purchaseId: 'pur-portaria-1',
      buyerUserId: 'usr-joana',
      paymentStatus: 'APROVADO',
      screening: {
        screeningId: 'scr-imax-2140',
        movieTitle: 'CIDADE DE FERRO',
        cinemaName: 'CineFood Paulista IMAX',
        roomName: 'Sala 1 IMAX',
        startsAt: '2026-12-14T21:40:00.000Z',
        endsAt: '2026-12-14T23:55:00.000Z',
      },
      seats: [
        { reservationId: 'res-g7', seatId: 'G7', row: 'G', number: 7, category: 'INTEIRA' },
        { reservationId: 'res-g8', seatId: 'G8', row: 'G', number: 8, category: 'INTEIRA' },
      ],
    });
    const [ticketG7, ticketG8] = issued.tickets;

    // Registra pedidos de cantina vinculados em AGUARDANDO_CHEGADA (ENTREGA_ASSENTO) e pedido balcão não relacionado
    kds.registerOrder({
      orderId: 'cnt-g7',
      ticketId: ticketG7.ticketId,
      purchaseId: 'pur-portaria-1',
      seatId: 'G7',
      deliveryChannel: 'ENTREGA_ASSENTO',
      status: 'AGUARDANDO_CHEGADA',
    });
    kds.registerOrder({
      orderId: 'cnt-g8',
      ticketId: ticketG8.ticketId,
      purchaseId: 'pur-portaria-1',
      seatId: 'G8',
      deliveryChannel: 'ENTREGA_ASSENTO',
      status: 'AGUARDANDO_CHEGADA',
    });

    // RBAC: apenas OPERADOR_PORTARIA / ADMIN_CINEMA podem validar na portaria
    const clientAttempt = await postGateValidateTicket(service, buyerSession('usr-joana'), {
      qrToken: ticketG7.qrToken,
    });
    assert.equal(clientAttempt.status, 403);

    const cantinaAttempt = await postGateValidateTicket(
      service,
      { userId: 'op-cantina', role: 'OPERADOR_CANTINA' },
      { qrToken: ticketG7.qrToken },
    );
    assert.equal(cantinaAttempt.status, 403);

    // Token desconhecido retorna 404
    const missingAttempt = await postGateValidateTicket(service, portariaSession(), {
      qrToken: 'cf_qr_inexistente',
    });
    assert.equal(missingAttempt.status, 404);

    // Cenário 2: bloqueia outra sessão ou sala sem consumir o ingresso
    const wrongScreening = await postGateValidateTicket(service, portariaSession(), {
      qrToken: ticketG7.qrToken,
      expectedScreeningId: 'scr-outra-sessao',
    });
    assert.equal(wrongScreening.status, 422);
    assert.equal((await repo.findById(ticketG7.ticketId))?.status, 'EMITIDO');

    const wrongRoom = await postGateValidateTicket(service, portariaSession(), {
      qrToken: ticketG7.qrToken,
      expectedScreeningId: 'scr-imax-2140',
      expectedRoomName: 'Sala 4 Atmos',
    });
    assert.equal(wrongRoom.status, 422);
    assert.equal((await repo.findById(ticketG7.ticketId))?.status, 'EMITIDO');

    // Cenário 1 + Cenário 3 (RN-02): primeira leitura válida consome ticketG7 atomicamente e dispara preparo apenas do cnt-g7
    const firstScan = await postGateValidateTicket(service, portariaSession('op-gate-a'), {
      qrToken: ticketG7.qrToken,
      expectedScreeningId: 'scr-imax-2140',
      expectedRoomName: 'Sala 1 IMAX',
    });
    assert.equal(firstScan.status, 200);
    if ('error' in firstScan.body) {
      throw new Error(`Esperava validação 200, recebeu: ${firstScan.body.error}`);
    }

    assert.equal(firstScan.body.outcome, 'LIBERADO');
    assert.equal(firstScan.body.ticket.status, 'UTILIZADO');
    assert.equal(firstScan.body.ticket.validatedByOperatorId, 'op-gate-a');
    assert.equal(firstScan.body.event.eventName, 'TicketValidatedEvent');
    assert.equal(firstScan.body.triggeredCanteenOrders.length, 1);
    assert.equal(firstScan.body.triggeredCanteenOrders[0].orderId, 'cnt-g7');
    assert.equal(firstScan.body.triggeredCanteenOrders[0].status, 'EM_PREPARO');
    assert.equal(kds.getOrder('cnt-g7')?.status, 'EM_PREPARO');
    assert.equal(kds.getOrder('cnt-g8')?.status, 'AGUARDANDO_CHEGADA');

    // Segunda leitura do mesmo token (replay) bloqueada com 409 Conflict e sem re-disparar evento KDS
    const secondScan = await postGateValidateTicket(service, portariaSession('op-gate-b'), {
      qrToken: ticketG7.qrToken,
      expectedScreeningId: 'scr-imax-2140',
    });
    assert.equal(secondScan.status, 409);
    assert.equal(kds.listEvents().length, 1);

    // Disputa concorrente simultânea na leitura de ticketG8: exatamente 1 aprovação (200) e 9 rejeições (409)
    const concurrentResults = await Promise.all(
      Array.from({ length: 10 }, (_, idx) =>
        postGateValidateTicket(service, portariaSession(`op-cam-${idx}`), {
          qrToken: ticketG8.qrToken,
          expectedScreeningId: 'scr-imax-2140',
        }),
      ),
    );
    const approvedCount = concurrentResults.filter((r) => r.status === 200).length;
    const conflictCount = concurrentResults.filter((r) => r.status === 409).length;
    assert.equal(approvedCount, 1);
    assert.equal(conflictCount, 9);
    assert.equal(kds.getOrder('cnt-g8')?.status, 'EM_PREPARO');
    assert.equal(kds.listEvents().length, 2);

    // Sessão encerrada e ingresso cancelado não passam na portaria
    const cancelledBatch = await service.issueTicketsForPaidOrder({
      purchaseId: 'pur-cancel-portaria',
      buyerUserId: 'usr-joana',
      paymentStatus: 'APROVADO',
      screening: {
        screeningId: 'scr-imax-2140',
        movieTitle: 'CIDADE DE FERRO',
        cinemaName: 'CineFood Paulista IMAX',
        roomName: 'Sala 1 IMAX',
        startsAt: '2026-12-14T21:40:00.000Z',
        endsAt: '2026-12-14T23:55:00.000Z',
      },
      seats: [{ reservationId: 'res-a1', seatId: 'A1', row: 'A', number: 1, category: 'INTEIRA' }],
    });
    await repo.markCancelledByPurchase('pur-cancel-portaria', '2026-12-14T20:00:00.000Z');
    const cancelledScan = await postGateValidateTicket(service, portariaSession(), {
      qrToken: cancelledBatch.tickets[0].qrToken,
    });
    assert.equal(cancelledScan.status, 422);

    const lateBatch = await service.issueTicketsForPaidOrder({
      purchaseId: 'pur-exp-portaria',
      buyerUserId: 'usr-joana',
      paymentStatus: 'APROVADO',
      screening: {
        screeningId: 'scr-imax-2140',
        movieTitle: 'CIDADE DE FERRO',
        cinemaName: 'CineFood Paulista IMAX',
        roomName: 'Sala 1 IMAX',
        startsAt: '2026-12-14T21:40:00.000Z',
        endsAt: '2026-12-14T23:55:00.000Z',
      },
      seats: [{ reservationId: 'res-a2', seatId: 'A2', row: 'A', number: 2, category: 'INTEIRA' }],
    });
    clock = new Date('2026-12-15T00:05:00.000Z');
    const expiredScan = await postGateValidateTicket(service, portariaSession(), {
      qrToken: lateBatch.tickets[0].qrToken,
    });
    assert.equal(expiredScan.status, 422);
  });
});
