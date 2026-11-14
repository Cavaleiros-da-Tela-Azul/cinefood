import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCanteenRepository } from '../../src/modules/canteen/repository.ts';
import { CanteenService } from '../../src/modules/canteen/service.ts';
import {
  postCanteenCheckout,
  postCompleteCanteenDelivery,
  postConfirmCanteenPayment,
  postDispatchSeatDelivery,
  postKdsMarkReady,
  postKdsStartPreparation,
  postRunnerDeliveryIncident,
} from '../../src/modules/canteen/routes.ts';
import type { CanteenProduct } from '../../src/modules/canteen/types.ts';
import { InMemoryTicketRepository } from '../../src/modules/tickets/repository.ts';
import { TicketsService } from '../../src/modules/tickets/service.ts';
import { InMemoryHistoryRepository } from '../../src/modules/history/repository.ts';
import { HistoryService } from '../../src/modules/history/service.ts';
import type { AuthenticatedSession } from '../../src/modules/identity/types.ts';

function sessionFor(userId: string, role: AuthenticatedSession['role']): AuthenticatedSession {
  return {
    userId,
    email: `${userId}@cinefood.test`,
    role,
    iat: 1_700_000_000,
    exp: 1_800_000_000,
  };
}

function seedProducts(): CanteenProduct[] {
  return [
    {
      productId: 'prod_pipoca_g',
      name: 'Pipoca Grande Manteiga',
      description: 'Balde 150g',
      category: 'PIPOCA',
      unitPriceCents: 2800,
      availableStock: 20,
      active: true,
      isCombo: false,
      allowedAddonIds: [],
    },
    {
      productId: 'prod_refri_500',
      name: 'Refrigerante 500ml',
      description: 'Copo 500ml com gelo',
      category: 'BEBIDA',
      unitPriceCents: 1600,
      availableStock: 20,
      active: true,
      isCombo: false,
      allowedAddonIds: [],
    },
  ];
}

describe('Atendimento KDS, Entrega no Assento e Runner (RF-09, RF-20 / MAR-04)', () => {
  it('AC-3: exige ingresso próprio pago e entrada validada na portaria antes da saída para entrega no assento', async () => {
    const now = () => new Date('2026-11-20T19:00:00.000Z');
    const canteenRepo = new InMemoryCanteenRepository(seedProducts(), []);
    const ticketRepo = new InMemoryTicketRepository();
    const historyRepo = new InMemoryHistoryRepository();
    const historyService = new HistoryService(historyRepo, { now });

    const canteenService = new CanteenService(canteenRepo, {
      now,
      ticketRepository: ticketRepo,
      historyService,
    });
    const ticketsService = new TicketsService(ticketRepo, {
      now,
      onTicketValidated: (event) => canteenService.handleTicketValidated(event),
    });

    const alice = sessionFor('usr_alice', 'CLIENTE');
    const bob = sessionFor('usr_bob', 'CLIENTE');
    const portaria = sessionFor('op_portaria', 'OPERADOR_PORTARIA');
    const cantina = sessionFor('op_cantina', 'OPERADOR_CANTINA');
    const runner = sessionFor('run_1', 'RUNNER');

    const issuedAlice = await ticketsService.issueTicketsForPaidOrder({
      purchaseId: 'pur_alice',
      buyerUserId: 'usr_alice',
      paymentStatus: 'APROVADO',
      screening: {
        screeningId: 'scr_1',
        movieTitle: 'Interestelar IMAX',
        cinemaName: 'CineFood Paulista',
        roomName: 'Sala IMAX',
        startsAt: '2026-11-20T19:30:00.000Z',
        endsAt: '2026-11-20T22:20:00.000Z',
      },
      seats: [{ reservationId: 'res_a1', seatId: 'D-8', row: 'D', number: 8, category: 'INTEIRA' }],
    });
    const aliceTicket = issuedAlice.tickets[0];

    const issuedBob = await ticketsService.issueTicketsForPaidOrder({
      purchaseId: 'pur_bob',
      buyerUserId: 'usr_bob',
      paymentStatus: 'APROVADO',
      screening: {
        screeningId: 'scr_1',
        movieTitle: 'Interestelar IMAX',
        cinemaName: 'CineFood Paulista',
        roomName: 'Sala IMAX',
        startsAt: '2026-11-20T19:30:00.000Z',
        endsAt: '2026-11-20T22:20:00.000Z',
      },
      seats: [{ reservationId: 'res_b1', seatId: 'D-9', row: 'D', number: 9, category: 'INTEIRA' }],
    });
    const bobTicket = issuedBob.tickets[0];

    // 1. Retirada no balcão dispensa ingresso e vai direto para EM_PREPARO pós-pagamento -> PRONTO -> ENTREGUE
    const counterCheckout = await postCanteenCheckout(canteenService, bob, {
      deliveryChannel: 'RETIRADA_BALCAO',
      items: [{ productId: 'prod_refri_500', quantity: 1 }],
    });
    assert.equal(counterCheckout.status, 201);
    assert.ok('orderId' in counterCheckout.body);
    assert.equal(counterCheckout.body.status, 'PENDENTE_PAGAMENTO');

    const counterPaid = await postConfirmCanteenPayment(canteenService, counterCheckout.body.orderId);
    assert.equal(counterPaid.status, 200);
    assert.ok('status' in counterPaid.body);
    assert.equal(counterPaid.body.status, 'EM_PREPARO');

    const counterReady = await postKdsMarkReady(
      canteenService,
      cantina,
      counterCheckout.body.orderId,
    );
    assert.equal(counterReady.status, 200);
    assert.ok('status' in counterReady.body && counterReady.body.status === 'PRONTO');

    const counterDelivered = await postCompleteCanteenDelivery(
      canteenService,
      cantina,
      counterCheckout.body.orderId,
    );
    assert.equal(counterDelivered.status, 200);
    assert.ok('status' in counterDelivered.body && counterDelivered.body.status === 'ENTREGUE');

    // 2. Entrega no assento rejeita ingresso de terceiro (HTTP 422)
    const thirdPartySeatOrder = await postCanteenCheckout(canteenService, alice, {
      deliveryChannel: 'ENTREGA_ASSENTO',
      linkedTicketId: bobTicket.ticketId,
      items: [{ productId: 'prod_pipoca_g', quantity: 1 }],
    });
    assert.equal(thirdPartySeatOrder.status, 422);

    // 3. Entrega no assento com ingresso próprio entra em AGUARDANDO_CHEGADA após pagamento
    const seatCheckout = await postCanteenCheckout(canteenService, alice, {
      deliveryChannel: 'ENTREGA_ASSENTO',
      linkedTicketId: aliceTicket.ticketId,
      items: [{ productId: 'prod_pipoca_g', quantity: 1 }],
    });
    assert.equal(seatCheckout.status, 201);
    assert.ok('orderId' in seatCheckout.body);
    assert.equal(seatCheckout.body.seatId, 'D-8');

    const seatPaid = await postConfirmCanteenPayment(canteenService, seatCheckout.body.orderId);
    assert.equal(seatPaid.status, 200);
    assert.ok('status' in seatPaid.body && seatPaid.body.status === 'AGUARDANDO_CHEGADA');

    // Trava RST-04: operador tenta iniciar preparo antes da validação na portaria -> HTTP 422
    const blockedPrep = await postKdsStartPreparation(
      canteenService,
      cantina,
      seatCheckout.body.orderId,
    );
    assert.equal(blockedPrep.status, 422);

    // Mesmo se uma comanda estivesse PRONTO indevidamente sem portaria, dispatch bloqueia com HTTP 422
    const current = await canteenRepo.findOrderById(seatCheckout.body.orderId);
    assert.ok(current);
    await canteenRepo.updateOrder({ ...current, status: 'PRONTO' });
    const blockedDispatch = await postDispatchSeatDelivery(
      canteenService,
      runner,
      seatCheckout.body.orderId,
    );
    assert.equal(blockedDispatch.status, 422);

    // Restaura AGUARDANDO_CHEGADA e valida ingresso na portaria (TicketValidatedEvent -> EM_PREPARO)
    await canteenRepo.updateOrder({ ...current, status: 'AGUARDANDO_CHEGADA' });
    const gateRes = await ticketsService.validateTicketAtGate(portaria, {
      qrToken: aliceTicket.qrToken,
      expectedScreeningId: 'scr_1',
    });
    assert.equal(gateRes.outcome, 'LIBERADO');
    assert.equal(gateRes.triggeredCanteenOrders.length, 1);
    assert.equal(gateRes.triggeredCanteenOrders[0].status, 'EM_PREPARO');

    // RBAC: CLIENTE não pode operar KDS nem despacho do runner
    const forbiddenReady = await postKdsMarkReady(
      canteenService,
      alice,
      seatCheckout.body.orderId,
    );
    assert.equal(forbiddenReady.status, 403);

    // Agora segue fluxo completo: EM_PREPARO -> PRONTO -> SAIU_PARA_ENTREGA -> ENTREGUE
    const readyRes = await postKdsMarkReady(canteenService, cantina, seatCheckout.body.orderId);
    assert.equal(readyRes.status, 200);
    assert.ok('status' in readyRes.body && readyRes.body.status === 'PRONTO');

    const dispatchRes = await postDispatchSeatDelivery(
      canteenService,
      runner,
      seatCheckout.body.orderId,
    );
    assert.equal(dispatchRes.status, 200);
    assert.ok('status' in dispatchRes.body && dispatchRes.body.status === 'SAIU_PARA_ENTREGA');

    const deliveredRes = await postCompleteCanteenDelivery(
      canteenService,
      runner,
      seatCheckout.body.orderId,
    );
    assert.equal(deliveredRes.status, 200);
    assert.ok('status' in deliveredRes.body && deliveredRes.body.status === 'ENTREGUE');
  });

  it('AC-4: ocorrência registrada pelo runner na sala escura converte pedido para retirada no balcão', async () => {
    const now = () => new Date('2026-11-20T20:15:00.000Z');
    const canteenRepo = new InMemoryCanteenRepository(seedProducts(), []);
    const ticketRepo = new InMemoryTicketRepository();
    const historyRepo = new InMemoryHistoryRepository();
    const historyService = new HistoryService(historyRepo, { now });

    const canteenService = new CanteenService(canteenRepo, {
      now,
      ticketRepository: ticketRepo,
      historyService,
    });
    const ticketsService = new TicketsService(ticketRepo, {
      now,
      onTicketValidated: (event) => canteenService.handleTicketValidated(event),
    });

    const alice = sessionFor('usr_alice', 'CLIENTE');
    const portaria = sessionFor('op_portaria', 'OPERADOR_PORTARIA');
    const cantina = sessionFor('op_cantina', 'OPERADOR_CANTINA');
    const runner = sessionFor('run_2', 'RUNNER');

    const issued = await ticketsService.issueTicketsForPaidOrder({
      purchaseId: 'pur_alice_2',
      buyerUserId: 'usr_alice',
      paymentStatus: 'APROVADO',
      screening: {
        screeningId: 'scr_2',
        movieTitle: 'Duna Parte II',
        cinemaName: 'CineFood Paulista',
        roomName: 'Sala 3',
        startsAt: '2026-11-20T20:00:00.000Z',
        endsAt: '2026-11-20T22:50:00.000Z',
      },
      seats: [{ reservationId: 'res_a2', seatId: 'F-4', row: 'F', number: 4, category: 'INTEIRA' }],
    });
    const ticket = issued.tickets[0];

    const checkout = await postCanteenCheckout(canteenService, alice, {
      deliveryChannel: 'ENTREGA_ASSENTO',
      linkedTicketId: ticket.ticketId,
      items: [{ productId: 'prod_pipoca_g', quantity: 1 }],
    });
    assert.equal(checkout.status, 201);
    assert.ok('orderId' in checkout.body);
    const orderId = checkout.body.orderId;

    await postConfirmCanteenPayment(canteenService, orderId);
    await ticketsService.validateTicketAtGate(portaria, { qrToken: ticket.qrToken });
    await postKdsMarkReady(canteenService, cantina, orderId);
    const dispatched = await postDispatchSeatDelivery(canteenService, runner, orderId);
    assert.equal(dispatched.status, 200);

    // RBAC: apenas RUNNER ou ADMIN_CINEMA pode registrar ocorrência de entrega
    const forbiddenIncident = await postRunnerDeliveryIncident(canteenService, cantina, orderId, {
      reason: 'CLIENTE_AUSENTE',
    });
    assert.equal(forbiddenIncident.status, 403);

    // Runner registra CLIENTE_AUSENTE -> status RETIRADA_NO_BALCAO + notificação no histórico
    const incidentRes = await postRunnerDeliveryIncident(canteenService, runner, orderId, {
      reason: 'CLIENTE_AUSENTE',
      notes: 'Poltrona F-4 vazia após 3 minutos de tolerância',
    });
    assert.equal(incidentRes.status, 200);
    assert.ok('order' in incidentRes.body);
    assert.equal(incidentRes.body.order.status, 'RETIRADA_NO_BALCAO');
    assert.equal(incidentRes.body.order.incidentReason, 'CLIENTE_AUSENTE');
    assert.match(incidentRes.body.order.incidentNote ?? '', /Poltrona F-4 vazia/);
    assert.equal(incidentRes.body.noticeOutcome?.dispatched, true);

    const aliceHistory = await historyService.getUserHistory(alice);
    assert.equal(aliceHistory.notices.length, 1);
    assert.equal(aliceHistory.notices[0].orderId, orderId);
    assert.equal(aliceHistory.notices[0].type, 'WARNING');
    assert.match(aliceHistory.notices[0].message, /balcão/i);

    // Cliente retira posteriormente no balcão
    const counterPickup = await postCompleteCanteenDelivery(canteenService, cantina, orderId);
    assert.equal(counterPickup.status, 200);
    assert.ok('status' in counterPickup.body && counterPickup.body.status === 'ENTREGUE');
  });
});
