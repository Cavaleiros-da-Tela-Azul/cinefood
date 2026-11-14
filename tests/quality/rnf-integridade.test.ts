import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { InMemoryBookingRepository } from '../../src/modules/booking/repository.ts';
import { postReservation } from '../../src/modules/booking/routes.ts';
import { DefaultBookingService } from '../../src/modules/booking/service.ts';
import { InMemoryCanteenRepository } from '../../src/modules/canteen/repository.ts';
import { postCanteenCheckout, postCanteenQuote } from '../../src/modules/canteen/routes.ts';
import { CanteenService } from '../../src/modules/canteen/service.ts';
import { InMemoryHistoryRepository } from '../../src/modules/history/repository.ts';
import { getUserHistoryRoute } from '../../src/modules/history/routes.ts';
import { HistoryService } from '../../src/modules/history/service.ts';
import type { AuthenticatedSession } from '../../src/modules/identity/types.ts';
import { InMemoryManagementRepository } from '../../src/modules/management/repository.ts';
import { postAdminScreening } from '../../src/modules/management/routes.ts';
import { ManagementService } from '../../src/modules/management/service.ts';
import { SandboxPaymentGatewayAdapter } from '../../src/modules/payments/gateway.ts';
import { InMemoryPaymentRepository } from '../../src/modules/payments/repository.ts';
import { DefaultPaymentService, SensitiveCardDataRejectedError } from '../../src/modules/payments/service.ts';
import { InMemoryPrivacyRepository } from '../../src/modules/privacy/repository.ts';
import { postDataSubjectRequest } from '../../src/modules/privacy/routes.ts';
import { DefaultPrivacyService } from '../../src/modules/privacy/service.ts';
import { InMemoryTicketRepository } from '../../src/modules/tickets/repository.ts';
import { getTicketsForPurchase, postGateValidateTicket } from '../../src/modules/tickets/routes.ts';
import { TicketsService } from '../../src/modules/tickets/service.ts';

function sessionFor(userId: string, role: AuthenticatedSession['role'] = 'CLIENTE'): AuthenticatedSession {
  return {
    userId,
    email: `${userId}@cinefood.test`,
    role,
    iat: 1_700_000_000,
    exp: 1_800_000_000,
  };
}

function percentile95(samplesMs: number[]): number {
  const sorted = [...samplesMs].sort((a, b) => a - b);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

async function runWithConcurrency<T>(
  totalTasks: number,
  concurrencyLimit: number,
  worker: (index: number) => Promise<T>,
): Promise<T[]> {
  const results = new Array<T>(totalTasks);
  let cursor = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const idx = cursor;
      cursor += 1;
      if (idx >= totalTasks) return;
      results[idx] = await worker(idx);
    }
  }

  await Promise.all(Array.from({ length: concurrencyLimit }, () => runWorker()));
  return results;
}

describe('Verificação Integrada de RNFs (RNF-01 a RNF-06 / MAR-05)', () => {
  it('AC-1: operações internas e validação de QR Code respondem com p95 <= 2 segundos', async () => {
    const fixedNow = () => new Date('2026-11-25T18:30:00.000Z');

    const canteenRepo = new InMemoryCanteenRepository(
      [
        {
          productId: 'prod_pipoca',
          name: 'Pipoca Média',
          description: 'Manteiga tradicional',
          category: 'PIPOCA',
          unitPriceCents: 2600,
          availableStock: 500,
          active: true,
          isCombo: false,
          allowedAddonIds: [],
        },
      ],
      [],
    );
    const canteenService = new CanteenService(canteenRepo, { now: fixedNow });

    const historyRepo = new InMemoryHistoryRepository();
    const historyService = new HistoryService(historyRepo, { now: fixedNow });

    const ticketRepo = new InMemoryTicketRepository();
    const ticketsService = new TicketsService(ticketRepo, { now: fixedNow });

    const portaria = sessionFor('op_portaria', 'OPERADOR_PORTARIA');
    const cliente = sessionFor('usr_carga', 'CLIENTE');

    // Pré-emite 100 ingressos distintos para o ensaio de 100 validações na portaria
    const seats = Array.from({ length: 100 }, (_, i) => ({
      reservationId: `res_${i}`,
      seatId: `F-${i + 1}`,
      row: 'F',
      number: i + 1,
      category: 'INTEIRA' as const,
    }));

    const issued = await ticketsService.issueTicketsForPaidOrder({
      purchaseId: 'pur_carga_100',
      buyerUserId: 'usr_carga',
      paymentStatus: 'APROVADO',
      screening: {
        screeningId: 'scr_carga',
        movieTitle: 'Interestelar',
        cinemaName: 'CineFood Paulista',
        roomName: 'Sala 1',
        startsAt: '2026-11-25T19:00:00.000Z',
        endsAt: '2026-11-25T22:00:00.000Z',
      },
      seats,
    });
    assert.equal(issued.tickets.length, 100);

    // 100 operações internas sob 20 trabalhadores concorrentes
    const internalLatencies = await runWithConcurrency(100, 20, async (i) => {
      const start = performance.now();
      if (i % 2 === 0) {
        const res = await postCanteenQuote(canteenService, [
          { productId: 'prod_pipoca', quantity: 1, clientUnitPriceCents: 1 },
        ]);
        assert.equal(res.status, 200);
      } else {
        const res = await getUserHistoryRoute(historyService, cliente);
        assert.equal(res.status, 200);
      }
      return performance.now() - start;
    });

    // 100 validações de QR Code sob 20 trabalhadores concorrentes
    const qrLatencies = await runWithConcurrency(100, 20, async (i) => {
      const start = performance.now();
      const res = await postGateValidateTicket(ticketsService, portaria, {
        qrToken: issued.tickets[i].qrToken,
        expectedScreeningId: 'scr_carga',
      });
      assert.equal(res.status, 200);
      return performance.now() - start;
    });

    const p95Internal = percentile95(internalLatencies);
    const p95Qr = percentile95(qrLatencies);

    assert.equal(internalLatencies.length, 100);
    assert.equal(qrLatencies.length, 100);
    assert.ok(p95Internal <= 2000, `p95 interno excedeu 2000ms: ${p95Internal}`);
    assert.ok(p95Qr <= 2000, `p95 de QR excedeu 2000ms: ${p95Qr}`);
  });

  it('AC-2: bateria de concorrência e segurança preserva zero venda duplicada, zero reuso de QR e zero estoque negativo', async () => {
    const fixedDate = new Date('2026-11-25T18:00:00.000Z');
    const now = () => fixedDate;

    // 1. Disputa simultânea de 20 clientes pela mesma poltrona -> zero overbooking
    const bookingRepo = new InMemoryBookingRepository(
      [
        {
          id: 'scr_race',
          roomId: 'room_1',
          startsAt: new Date('2026-11-25T20:00:00.000Z'),
          status: 'ATIVA',
          basePriceCents: 4000,
        },
      ],
      [{ id: 'A-1', screeningId: 'scr_race', row: 'A', number: 1, state: 'DISPONIVEL' }],
      () => fixedDate,
    );
    const bookingService = new DefaultBookingService(bookingRepo, now);

    const seatRace = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        postReservation(bookingService, sessionFor(`usr_seat_${i}`), {
          screeningId: 'scr_race',
          seatId: 'A-1',
          purchaseId: `pur_seat_${i}`,
          channel: i % 2 === 0 ? 'WEB' : 'MOBILE',
        }),
      ),
    );
    assert.equal(seatRace.filter((r) => r.status === 200).length, 1);
    assert.equal(seatRace.filter((r) => r.status === 409).length, 19);

    // 2. Disputa simultânea pela última unidade de estoque da cantina -> zero estoque negativo
    const canteenRepo = new InMemoryCanteenRepository(
      [
        {
          productId: 'prod_last',
          name: 'Balde Especial',
          description: 'Última unidade',
          category: 'COMBO',
          unitPriceCents: 5000,
          availableStock: 1,
          active: true,
          isCombo: true,
          allowedAddonIds: [],
        },
      ],
      [],
    );
    const canteenService = new CanteenService(canteenRepo, { now });

    const stockRace = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        postCanteenCheckout(canteenService, sessionFor(`usr_cnt_${i}`), {
          deliveryChannel: 'RETIRADA_BALCAO',
          items: [{ productId: 'prod_last', quantity: 1 }],
        }),
      ),
    );
    assert.equal(stockRace.filter((r) => r.status === 201).length, 1);
    assert.equal(stockRace.filter((r) => r.status === 409).length, 19);
    assert.equal((await canteenRepo.findProductById('prod_last'))?.availableStock, 0);

    // 3. Idempotência de pagamento sob 10 chamadas concorrentes + bloqueio de PAN/CVV
    const seatWinner = seatRace.find((r) => r.status === 200)!.body as {
      id: string;
      buyerUserId: string;
      purchaseId: string;
    };
    const paymentRepo = new InMemoryPaymentRepository();
    const gateway = new SandboxPaymentGatewayAdapter();
    const paymentService = new DefaultPaymentService(
      paymentRepo,
      bookingRepo,
      bookingService,
      gateway,
      'whsec_rnf_test',
      now,
    );

    const buyer = seatWinner.buyerUserId;
    const paymentRace = await Promise.all(
      Array.from({ length: 10 }, () =>
        paymentService.initiateCheckout(buyer, 'idem-race-key-01', {
          reservationId: seatWinner.id,
          purchaseId: seatWinner.purchaseId,
          method: 'PIX',
        }),
      ),
    );
    assert.equal(gateway.chargeCreateCalls, 1);
    const firstChargeId = paymentRace[0].payment.gatewayChargeId;
    assert.ok(paymentRace.every((r) => r.payment.gatewayChargeId === firstChargeId));

    await assert.rejects(
      () =>
        paymentService.initiateCheckout(buyer, 'idem-card-pan', {
          reservationId: seatWinner.id,
          purchaseId: seatWinner.purchaseId,
          method: 'CARTAO_CREDITO',
          cardNumber: '4111111111111111',
          cvv: '123',
        } as unknown as Parameters<typeof paymentService.initiateCheckout>[2]),
      SensitiveCardDataRejectedError,
    );

    const serializedPayments = JSON.stringify(paymentRace);
    assert.equal(serializedPayments.includes('4111111111111111'), false);
    assert.equal(serializedPayments.includes('"cvv"'), false);

    // 4. Disputa simultânea de 20 leituras pelo mesmo QR Code na portaria -> apenas 1 LIBERADO
    const ticketRepo = new InMemoryTicketRepository();
    const ticketsService = new TicketsService(ticketRepo, { now });
    const issuedSingle = await ticketsService.issueTicketsForPaidOrder({
      purchaseId: 'pur_single_qr',
      buyerUserId: 'usr_alice',
      paymentStatus: 'APROVADO',
      screening: {
        screeningId: 'scr_qr_race',
        movieTitle: 'Matrix',
        cinemaName: 'CineFood Paulista',
        roomName: 'Sala 2',
        startsAt: '2026-11-25T19:00:00.000Z',
        endsAt: '2026-11-25T21:30:00.000Z',
      },
      seats: [{ reservationId: 'res_q1', seatId: 'B-5', row: 'B', number: 5, category: 'INTEIRA' }],
    });
    const qrToken = issuedSingle.tickets[0].qrToken;
    const portaria = sessionFor('op_gate', 'OPERADOR_PORTARIA');

    const qrRace = await Promise.all(
      Array.from({ length: 20 }, () =>
        postGateValidateTicket(ticketsService, portaria, { qrToken }),
      ),
    );
    assert.equal(qrRace.filter((r) => r.status === 200).length, 1);
    assert.equal(qrRace.filter((r) => r.status === 409).length, 19);

    // 5. Bloqueio de acesso cruzado (IDOR) e escalonamento de privilégio (RBAC)
    const bob = sessionFor('usr_bob', 'CLIENTE');
    const historyService = new HistoryService(new InMemoryHistoryRepository(), { now });
    assert.equal((await getTicketsForPurchase(ticketsService, bob, 'pur_single_qr')).status, 403);
    assert.equal((await getUserHistoryRoute(historyService, bob, 'usr_alice')).status, 403);

    const mgmtService = new ManagementService(new InMemoryManagementRepository(), { now });
    assert.equal(
      (
        await postAdminScreening(mgmtService, bob, {
          screeningId: 'scr_x',
          movieId: 'mov_x',
          roomId: 'room_x',
          startsAt: '2026-11-25T20:00:00.000Z',
          endsAt: '2026-11-25T22:00:00.000Z',
          format: '2D',
          basePriceCents: 4000,
        })
      ).status,
      403,
    );

    const privacyService = new DefaultPrivacyService(
      new InMemoryPrivacyRepository({
        version: '2026-01',
        effectiveAt: new Date('2026-01-01T00:00:00.000Z'),
        purposes: ['Conta'],
        legalBases: ['Contrato'],
        sharing: ['Interno'],
        retention: '5 anos',
        dataSubjectChannel: 'dpo@cinefood.test',
      }),
      now,
    );
    assert.equal(
      (
        await postDataSubjectRequest(privacyService, bob, {
          type: 'ELIMINACAO',
          targetUserId: 'usr_alice',
        })
      ).status,
      403,
    );
  });
});
