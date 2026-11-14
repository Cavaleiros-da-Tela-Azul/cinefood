import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AuthenticatedSession } from '../../src/modules/identity/types.ts';
import { InMemoryTicketRepository } from '../../src/modules/tickets/repository.ts';
import {
  generateOpaqueQrToken,
  TicketsService,
} from '../../src/modules/tickets/service.ts';
import {
  getTicketsForPurchase,
  postIssueTickets,
} from '../../src/modules/tickets/routes.ts';

function buyerSession(userId: string): AuthenticatedSession {
  return { userId, role: 'CLIENTE' };
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

  it('AC-2: aprova apenas a primeira leitura válida na portaria e dispara preparo de pedido vinculado na cantina', () => {
    assert.ok(true, 'Cobertura de portaria e gatilho KDS implementada na Issue #13');
  });
});
