import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AuthenticatedSession } from '../../src/modules/identity/types.ts';
import { InMemoryManagementRepository } from '../../src/modules/management/repository.ts';
import { ManagementService } from '../../src/modules/management/service.ts';
import {
  postAdminScreening,
  putAdminCanteenItem,
  putAdminMovie,
  putAdminRoom,
} from '../../src/modules/management/routes.ts';
import { InMemoryCatalogRepository } from '../../src/modules/catalog/repository.ts';
import { DefaultCatalogService } from '../../src/modules/catalog/service.ts';
import { InMemoryBookingRepository } from '../../src/modules/booking/repository.ts';
import { DefaultBookingService } from '../../src/modules/booking/service.ts';
import { postReservation } from '../../src/modules/booking/routes.ts';
import type { SeatReservation } from '../../src/modules/booking/types.ts';
import {
  SandboxPaymentGatewayAdapter,
  signWebhookPayload,
} from '../../src/modules/payments/gateway.ts';
import { InMemoryPaymentRepository } from '../../src/modules/payments/repository.ts';
import { DefaultPaymentService } from '../../src/modules/payments/service.ts';
import {
  postPaymentCheckout,
  postPaymentWebhook,
} from '../../src/modules/payments/routes.ts';
import type { CheckoutResult } from '../../src/modules/payments/types.ts';
import { InMemoryTicketRepository } from '../../src/modules/tickets/repository.ts';
import { TicketsService } from '../../src/modules/tickets/service.ts';
import {
  getTicketsForPurchase,
  postGateValidateTicket,
  postIssueTickets,
} from '../../src/modules/tickets/routes.ts';
import { InMemoryCanteenRepository } from '../../src/modules/canteen/repository.ts';
import { CanteenService } from '../../src/modules/canteen/service.ts';
import { InMemoryHistoryRepository } from '../../src/modules/history/repository.ts';
import { HistoryService } from '../../src/modules/history/service.ts';
import {
  getUserHistoryRoute,
  postReviewRoute,
} from '../../src/modules/history/routes.ts';
import { OperationsService } from '../../src/modules/operations/service.ts';
import {
  getOperationsHealthRoute,
  postShiftClosingReconciliationRoute,
} from '../../src/modules/operations/routes.ts';

const WEBHOOK_SECRET = 'cinefood-pilot-webhook-secret-2026';

function sessionFor(userId: string, role: AuthenticatedSession['role']): AuthenticatedSession {
  return {
    userId,
    email: `${userId}@cinefood.piloto`,
    role,
    iat: 1_794_000_000,
    exp: 1_894_000_000,
  };
}

describe('Transição, Smoke Test Ponta a Ponta e Trava de Sandbox (MAR-06)', () => {
  it('AC-1: jornada integrada ponta a ponta executa reserva, pagamento, QR Code, cantina e avaliação sem falhas', async () => {
    let clock = new Date('2026-12-14T19:00:00.000Z');
    const now = () => new Date(clock.getTime());

    const opsService = new OperationsService({ now });
    const seed = opsService.buildPilotDemoSeed(clock);

    // 0. Prontidão operacional em Sandbox na unidade piloto única
    const health = await getOperationsHealthRoute(opsService, {
      pilotUnitId: seed.unitId,
      apiArchitecture: 'MODULAR_MONOLITH',
      sandboxMode: true,
      commercialHomologationApproved: false,
      paymentWebhookSecretConfigured: true,
      databaseReachable: true,
    });
    assert.equal(health.status, 200);
    if ('error' in health.body) {
      throw new Error(`Saúde operacional bloqueada: ${health.body.error}`);
    }
    assert.equal(health.body.status, 'READY');
    assert.equal(health.body.sandboxLocked, true);

    // Atores da operação integrada
    const admin = sessionFor('adm-piloto', 'ADMIN_CINEMA');
    const buyer = sessionFor('usr-joana', 'CLIENTE');
    const gateOperator = sessionFor('op-portaria', 'OPERADOR_PORTARIA');
    const canteenOperator = sessionFor('op-cantina', 'OPERADOR_CANTINA');
    const runner = sessionFor('op-runner', 'RUNNER');

    // 1. Administração cria filme, sala, sessão e item de cantina
    const mgmtRepo = new InMemoryManagementRepository();
    const mgmtService = new ManagementService(mgmtRepo, { now });

    assert.equal((await putAdminMovie(mgmtService, admin, seed.movies[0])).status, 200);
    assert.equal((await putAdminRoom(mgmtService, admin, seed.rooms[0])).status, 200);
    const createdScreening = await postAdminScreening(mgmtService, admin, seed.screening);
    assert.equal(createdScreening.status, 201);
    assert.equal(
      (
        await putAdminCanteenItem(mgmtService, admin, {
          productId: seed.canteenProducts[0].productId,
          name: seed.canteenProducts[0].name,
          category: 'COMBO',
          unitPriceCents: seed.canteenProducts[0].unitPriceCents,
          availableStock: seed.canteenProducts[0].availableStock,
          active: true,
        })
      ).status,
      200,
    );

    // 2. Catálogo público lista sessão ativa e poltronas disponíveis
    const catalogRepo = new InMemoryCatalogRepository(
      [
        {
          id: seed.screening.screeningId,
          movie: {
            id: seed.movies[0].movieId,
            title: seed.movies[0].title,
            synopsis: seed.movies[0].synopsis,
            durationMinutes: seed.movies[0].durationMinutes,
            ageRating: seed.movies[0].ageRating,
            genre: 'Suspense Sci-Fi',
            director: 'Marina Andrade',
          },
          cinemaName: seed.rooms[0].cinemaName,
          roomId: seed.rooms[0].roomId,
          roomName: seed.rooms[0].name,
          startsAt: new Date(seed.screening.startsAt),
          format: seed.screening.format,
          basePrice: seed.screening.basePriceCents / 100,
          status: 'ATIVA',
        },
      ],
      [
        {
          id: 'G7',
          screeningId: seed.screening.screeningId,
          row: 'G',
          number: 7,
          state: 'DISPONIVEL',
          category: 'standard',
        },
        {
          id: 'A12',
          screeningId: seed.screening.screeningId,
          row: 'A',
          number: 12,
          state: 'DISPONIVEL',
          category: 'pcd-plus',
        },
      ],
    );
    const catalogService = new DefaultCatalogService(catalogRepo, now);
    const activeScreenings = await catalogService.listScreenings();
    assert.equal(activeScreenings.length, 1);
    const seatMap = await catalogService.getSeatMap(seed.screening.screeningId);
    assert.equal(seatMap.filter((s) => s.state === 'DISPONIVEL').length, 2);

    // 3. Reserva temporária (10 min) + Checkout Pix Sandbox + Webhook HMAC
    const bookingRepo = new InMemoryBookingRepository(
      [
        {
          id: seed.screening.screeningId,
          roomId: seed.rooms[0].roomId,
          startsAt: new Date(seed.screening.startsAt),
          status: 'ATIVA',
          basePriceCents: seed.screening.basePriceCents,
        },
      ],
      [
        {
          id: 'G7',
          screeningId: seed.screening.screeningId,
          row: 'G',
          number: 7,
          state: 'DISPONIVEL',
          category: 'standard',
        },
      ],
    );
    const bookingService = new DefaultBookingService(bookingRepo, now);
    const paymentRepo = new InMemoryPaymentRepository();
    const gateway = new SandboxPaymentGatewayAdapter();
    const paymentService = new DefaultPaymentService(
      paymentRepo,
      bookingRepo,
      bookingService,
      gateway,
      WEBHOOK_SECRET,
      now,
    );

    const purchaseId = 'pur-piloto-001';
    const holdRes = await postReservation(bookingService, buyer, {
      screeningId: seed.screening.screeningId,
      seatId: 'G7',
      purchaseId,
      channel: 'WEB',
    });
    assert.equal(holdRes.status, 200);
    const reservation = holdRes.body as SeatReservation;

    const checkoutRes = await postPaymentCheckout(
      paymentService,
      buyer,
      { 'Idempotency-Key': 'smoke-idem-ticket-001' },
      {
        reservationId: reservation.id,
        purchaseId,
        method: 'PIX',
      },
    );
    assert.equal(checkoutRes.status, 201);
    const checkout = checkoutRes.body as CheckoutResult;
    assert.equal(checkout.payment.sandboxMode, true);
    assert.equal(checkout.payment.status, 'PENDENTE');

    const webhookBody = JSON.stringify({
      eventId: 'evt-smoke-001',
      eventType: 'PAYMENT_APPROVED',
      gatewayChargeId: checkout.payment.gatewayChargeId,
      reservationId: reservation.id,
    });
    const webhookRes = await postPaymentWebhook(
      paymentService,
      webhookBody,
      { 'x-webhook-signature': signWebhookPayload(webhookBody, WEBHOOK_SECRET) },
    );
    assert.equal(webhookRes.status, 200);

    // 4. Emissão do ingresso com QR Code opaco após liquidação
    const ticketRepo = new InMemoryTicketRepository();
    const historyRepo = new InMemoryHistoryRepository();
    const historyService = new HistoryService(historyRepo, { now });
    const canteenRepo = new InMemoryCanteenRepository(
      seed.canteenProducts,
      seed.canteenAddons,
    );
    const canteenService = new CanteenService(canteenRepo, {
      now,
      ticketRepository: ticketRepo,
      historyService,
    });
    const ticketsService = new TicketsService(ticketRepo, {
      now,
      onTicketValidated: async (event) => canteenService.handleTicketValidated(event),
    });

    const issuedRes = await postIssueTickets(ticketsService, {
      purchaseId,
      buyerUserId: buyer.userId,
      paymentStatus: 'APROVADO',
      screening: {
        screeningId: seed.screening.screeningId,
        movieTitle: seed.movies[0].title,
        cinemaName: seed.rooms[0].cinemaName,
        roomName: seed.rooms[0].name,
        startsAt: seed.screening.startsAt,
        endsAt: seed.screening.endsAt,
      },
      seats: [
        {
          reservationId: reservation.id,
          seatId: 'G7',
          row: 'G',
          number: 7,
          category: 'standard',
        },
      ],
    });
    assert.equal(issuedRes.status, 201);

    const passRes = await getTicketsForPurchase(ticketsService, buyer, purchaseId);
    assert.equal(passRes.status, 200);
    if ('error' in passRes.body) {
      throw new Error(passRes.body.error);
    }
    const ticket = passRes.body[0];
    assert.equal(ticket.status, 'EMITIDO');
    assert.ok(ticket.qrToken.startsWith('cf_qr_'));

    // 5. Pedido na cantina pré-vinculado ao ingresso fica AGUARDANDO_CHEGADA antes da portaria
    const canteenOrder = await canteenService.checkoutOrder(buyer, {
      deliveryChannel: 'ENTREGA_ASSENTO',
      linkedTicketId: ticket.ticketId,
      items: [
        {
          productId: seed.canteenProducts[0].productId,
          quantity: 1,
          addonIds: ['add-cheddar'],
        },
      ],
    });
    const paidOrder = await canteenService.confirmOrderPayment(canteenOrder.orderId);
    assert.equal(paidOrder.status, 'AGUARDANDO_CHEGADA');
    assert.equal(paidOrder.totalCents, 5400);

    const updatedProduct = await canteenRepo.findProductById(seed.canteenProducts[0].productId);
    assert.equal(updatedProduct?.availableStock, 24);

    // 6. Validação atômica na portaria dispara RN-02 e avança KDS + Runner até ENTREGUE
    const gateRes = await postGateValidateTicket(ticketsService, gateOperator, {
      qrToken: ticket.qrToken,
      expectedScreeningId: seed.screening.screeningId,
      expectedRoomName: seed.rooms[0].name,
    });
    assert.equal(gateRes.status, 200);
    if ('error' in gateRes.body) {
      throw new Error(gateRes.body.error);
    }
    assert.equal(gateRes.body.outcome, 'LIBERADO');
    assert.equal(gateRes.body.triggeredCanteenOrders.length, 1);
    assert.equal(gateRes.body.triggeredCanteenOrders[0].status, 'EM_PREPARO');

    // Releitura do mesmo QR Code bloqueada atomicamente (HTTP 409)
    const duplicateGate = await postGateValidateTicket(ticketsService, gateOperator, {
      qrToken: ticket.qrToken,
      expectedScreeningId: seed.screening.screeningId,
    });
    assert.equal(duplicateGate.status, 409);

    const readyOrder = await canteenService.markOrderReady(canteenOperator, paidOrder.orderId);
    assert.equal(readyOrder.status, 'PRONTO');
    const dispatchedOrder = await canteenService.dispatchForSeatDelivery(runner, paidOrder.orderId);
    assert.equal(dispatchedOrder.status, 'SAIU_PARA_ENTREGA');
    const deliveredOrder = await canteenService.completeDelivery(runner, paidOrder.orderId);
    assert.equal(deliveredOrder.status, 'ENTREGUE');

    // 7. Sessão encerra -> cliente avalia com 5 estrelas -> histórico e conciliação de turno fecham zerados
    clock = new Date(new Date(seed.screening.endsAt).getTime() + 10 * 60 * 1000);

    historyRepo.seedTicket({
      ticketId: ticket.ticketId,
      purchaseId,
      ownerUserId: buyer.userId,
      screeningId: ticket.screeningId,
      movieTitle: ticket.movieTitle,
      cinemaName: ticket.cinemaName,
      roomName: ticket.roomName,
      seatId: ticket.seatId,
      startsAt: ticket.startsAt,
      endsAt: ticket.endsAt,
      status: 'UTILIZADO',
      usedAt: gateRes.body.ticket.usedAt,
    });
    historyRepo.seedCanteenOrder({
      orderId: deliveredOrder.orderId,
      purchaseId,
      ownerUserId: buyer.userId,
      summary: '1x Combo IMAX Manteiga Trufada + Cheddar cremoso extra',
      deliveryChannel: deliveredOrder.deliveryChannel,
      status: deliveredOrder.status,
      totalCents: deliveredOrder.totalCents,
      createdAt: deliveredOrder.createdAt,
    });

    const reviewRes = await postReviewRoute(historyService, buyer, {
      ticketId: ticket.ticketId,
      rating: 5,
      comment: 'Estreia piloto impecável: QR na portaria e combo entregue na poltrona G7!',
    });
    assert.equal(reviewRes.status, 201);

    const historyRes = await getUserHistoryRoute(historyService, buyer);
    assert.equal(historyRes.status, 200);
    if ('error' in historyRes.body) {
      throw new Error(historyRes.body.error);
    }
    assert.equal(historyRes.body.tickets[0].status, 'UTILIZADO');
    assert.equal(historyRes.body.canteenOrders[0].status, 'ENTREGUE');
    assert.equal(historyRes.body.reviews.length, 1);
    assert.equal(historyRes.body.reviews[0].rating, 5);

    const closingRes = await postShiftClosingReconciliationRoute(opsService, admin, {
      shiftId: 'turno-piloto-noite-01',
      unitId: seed.unitId,
      operatorUserId: admin.userId,
      openedAt: '2026-12-14T18:00:00.000Z',
      closedAt: clock.toISOString(),
      issuedTicketsCount: 2,
      validActiveTicketsCount: 1,
      cancelledTicketsCount: 1,
      canteenOrdersDeliveredCount: 1,
      payments: [
        {
          purchaseId,
          kind: 'TICKET',
          grossAmountCents: seed.screening.basePriceCents,
          status: 'APROVADO',
        },
        {
          purchaseId: deliveredOrder.orderId,
          kind: 'CANTEEN',
          grossAmountCents: deliveredOrder.totalCents,
          status: 'APROVADO',
        },
        {
          purchaseId: 'pur-cdc-refund-01',
          kind: 'TICKET',
          grossAmountCents: 4400,
          status: 'ESTORNADO',
          refundAmountCents: 4400,
          refundReason: 'CDC_ARREPENDIMENTO',
        },
        {
          purchaseId: 'pur-pix-tardio-01',
          kind: 'TICKET',
          grossAmountCents: 4400,
          status: 'ESTORNADO',
          refundAmountCents: 4400,
          refundReason: 'PIX_TARDIO',
        },
      ],
      expectedNetCashCents: seed.screening.basePriceCents + deliveredOrder.totalCents,
    });
    assert.equal(closingRes.status, 200);
    if ('error' in closingRes.body) {
      throw new Error(closingRes.body.error);
    }
    assert.equal(closingRes.body.grossSalesCents, 18600);
    assert.equal(closingRes.body.cdcRefundsCents, 4400);
    assert.equal(closingRes.body.latePixRefundsCents, 4400);
    assert.equal(closingRes.body.totalRefundsCents, 8800);
    assert.equal(closingRes.body.settledNetCents, 9800);
    assert.equal(closingRes.body.discrepancyCents, 0);
    assert.equal(closingRes.body.balanced, true);
  });

  it('AC-2: ambiente não homologado mantém bloqueio de cobrança real operando estritamente em sandbox (RST-03)', async () => {
    const opsService = new OperationsService({
      now: () => new Date('2026-12-14T19:00:00.000Z'),
    });

    // Tentativa de desligar sandbox sem homologação aprovada -> bloqueio HTTP 403 (RST-03)
    const unsafeNoSandbox = await getOperationsHealthRoute(opsService, {
      pilotUnitId: 'cinefood-piloto-paulista',
      apiArchitecture: 'MODULAR_MONOLITH',
      sandboxMode: false,
      commercialHomologationApproved: false,
      paymentWebhookSecretConfigured: true,
      databaseReachable: true,
    });
    assert.equal(unsafeNoSandbox.status, 403);

    // Tentativa de habilitar flag comercial em unidade piloto sem aprovação formal -> bloqueio HTTP 403
    const unsafeProductionFlag = await getOperationsHealthRoute(opsService, {
      pilotUnitId: 'cinefood-piloto-paulista',
      apiArchitecture: 'MODULAR_MONOLITH',
      sandboxMode: true,
      commercialHomologationApproved: true,
      paymentWebhookSecretConfigured: true,
      databaseReachable: true,
    });
    assert.equal(unsafeProductionFlag.status, 403);

    // Adaptador SandboxPaymentGatewayAdapter recusa execução se marcado como productionApproved
    const blockedAdapter = new SandboxPaymentGatewayAdapter({ productionApproved: true });
    await assert.rejects(
      () =>
        blockedAdapter.createSandboxCharge({
          idempotencyKey: 'rst03-prod-block',
          purchaseId: 'pur-block',
          reservationId: 'res-block',
          amountCents: 4400,
          method: 'PIX',
        }),
      /sandbox não deve processar ambiente produtivo/i,
    );

    // Operador sem papel ADMIN_CINEMA não pode fechar turno/conciliação financeira (HTTP 403)
    const unauthorizedClose = await postShiftClosingReconciliationRoute(
      opsService,
      sessionFor('op-portaria', 'OPERADOR_PORTARIA'),
      {
        shiftId: 'turno-01',
        unitId: 'cinefood-piloto-paulista',
        operatorUserId: 'op-portaria',
        openedAt: '2026-12-14T18:00:00.000Z',
        closedAt: '2026-12-14T23:00:00.000Z',
        issuedTicketsCount: 0,
        validActiveTicketsCount: 0,
        cancelledTicketsCount: 0,
        canteenOrdersDeliveredCount: 0,
        payments: [],
        expectedNetCashCents: 0,
      },
    );
    assert.equal(unauthorizedClose.status, 403);
  });
});
