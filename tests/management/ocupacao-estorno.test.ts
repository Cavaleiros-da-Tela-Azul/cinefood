import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryManagementRepository } from '../../src/modules/management/repository.ts';
import { ManagementService } from '../../src/modules/management/service.ts';
import { CdcCancellationService } from '../../src/modules/management/cdc-cancellation.ts';
import {
  getAdminOccupancyReport,
  getAdminOperators,
  getAdminSalesDashboard,
  getPublicScreeningQuote,
  patchAdminCanteenItemPrice,
  patchAdminScreening,
  postAdminScreening,
  postCancelTicketCdc,
  putAdminCanteenItem,
  putAdminMovie,
  putAdminOperator,
  putAdminRoom,
  putAdminRoomSeatMap,
} from '../../src/modules/management/routes.ts';
import { InMemoryCanteenRepository } from '../../src/modules/canteen/repository.ts';
import { InMemoryTicketRepository } from '../../src/modules/tickets/repository.ts';
import { SandboxPaymentGatewayAdapter } from '../../src/modules/payments/gateway.ts';
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

describe('Administração, Ocupação e Cancelamento CDC (RF-10, RF-12, RF-15 / MAR-04)', () => {
  it('AC-5: mudança de preço preserva compras passadas e 10 assentos com 3 ativos e 1 cancelado exibe 30% de ocupação', async () => {
    const now = () => new Date('2026-11-20T14:00:00.000Z');
    const repo = new InMemoryManagementRepository();
    const service = new ManagementService(repo, { now });

    const admin = sessionFor('adm_1', 'ADMIN_CINEMA');
    const cliente = sessionFor('usr_alice', 'CLIENTE');
    const bilheteria = sessionFor('op_bil', 'OPERADOR_BILHETERIA');

    // RBAC: apenas ADMIN_CINEMA pode cadastrar/alterar catálogo ou consultar ocupação
    assert.equal(
      (
        await putAdminMovie(service, cliente, {
          movieId: 'mov_1',
          title: 'Duna Parte II',
          synopsis: 'Épico sci-fi',
          durationMinutes: 166,
          ageRating: '14',
          active: true,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await putAdminMovie(service, bilheteria, {
          movieId: 'mov_1',
          title: 'Duna Parte II',
          synopsis: 'Épico sci-fi',
          durationMinutes: 166,
          ageRating: '14',
          active: true,
        })
      ).status,
      403,
    );

    await putAdminMovie(service, admin, {
      movieId: 'mov_1',
      title: 'Duna Parte II',
      synopsis: 'Épico sci-fi',
      durationMinutes: 166,
      ageRating: '14',
      active: true,
    });
    await putAdminRoom(service, admin, {
      roomId: 'room_10',
      cinemaName: 'CineFood Paulista',
      name: 'Sala VIP 10',
      sellableSeats: 10,
      active: true,
    });

    const createdScreening = await postAdminScreening(service, admin, {
      screeningId: 'scr_10',
      movieId: 'mov_1',
      roomId: 'room_10',
      startsAt: '2026-11-20T20:00:00.000Z',
      endsAt: '2026-11-20T22:50:00.000Z',
      format: 'IMAX',
      basePriceCents: 4000,
    });
    assert.equal(createdScreening.status, 201);

    await putAdminCanteenItem(service, admin, {
      productId: 'prod_pipoca',
      name: 'Pipoca Média',
      category: 'PIPOCA',
      unitPriceCents: 2500,
      availableStock: 30,
      active: true,
    });

    // Registra 3 ingressos ativos (2 EMITIDO + 1 UTILIZADO), 1 CANCELADO/ESTORNADO e 1 reserva EXPIRADA
    await repo.saveTicketPurchase({
      ticketId: 'tkt_1',
      purchaseId: 'pur_1',
      ownerUserId: 'usr_1',
      screeningId: 'scr_10',
      seatId: 'A-1',
      paidUnitPriceCents: 4000,
      paymentStatus: 'APROVADO',
      ticketStatus: 'EMITIDO',
      purchasedAt: '2026-11-18T10:00:00.000Z',
      linkedCanteenOrder: { orderId: 'cnt_1', status: 'EM_PREPARO', totalCents: 2500 },
    });
    await repo.saveTicketPurchase({
      ticketId: 'tkt_2',
      purchaseId: 'pur_2',
      ownerUserId: 'usr_2',
      screeningId: 'scr_10',
      seatId: 'A-2',
      paidUnitPriceCents: 4000,
      paymentStatus: 'APROVADO',
      ticketStatus: 'EMITIDO',
      purchasedAt: '2026-11-18T11:00:00.000Z',
    });
    await repo.saveTicketPurchase({
      ticketId: 'tkt_3',
      purchaseId: 'pur_3',
      ownerUserId: 'usr_3',
      screeningId: 'scr_10',
      seatId: 'A-3',
      paidUnitPriceCents: 4000,
      paymentStatus: 'APROVADO',
      ticketStatus: 'UTILIZADO',
      purchasedAt: '2026-11-18T12:00:00.000Z',
    });
    await repo.saveTicketPurchase({
      ticketId: 'tkt_4',
      purchaseId: 'pur_4',
      ownerUserId: 'usr_4',
      screeningId: 'scr_10',
      seatId: 'A-4',
      paidUnitPriceCents: 4000,
      paymentStatus: 'ESTORNADO',
      ticketStatus: 'CANCELADO',
      purchasedAt: '2026-11-18T12:30:00.000Z',
      cancelledAt: '2026-11-19T09:00:00.000Z',
    });
    await repo.saveHold({
      holdId: 'hold_exp',
      screeningId: 'scr_10',
      seatId: 'A-5',
      expiresAt: '2026-11-20T13:50:00.000Z',
      status: 'EXPIRADA',
    });

    // Administrador altera preços da sessão e da cantina após compras confirmadas
    const pricePatch = await patchAdminScreening(service, admin, 'scr_10', {
      basePriceCents: 5500,
    });
    assert.equal(pricePatch.status, 200);
    await patchAdminCanteenItemPrice(service, admin, 'prod_pipoca', 3400);

    // Nova cotação passa a refletir R$ 55,00 (5500 centavos)
    const futureQuote = await getPublicScreeningQuote(service, 'scr_10');
    assert.equal(futureQuote.status, 200);
    assert.ok('fullPriceCents' in futureQuote.body);
    assert.equal(futureQuote.body.fullPriceCents, 5500);
    assert.equal(futureQuote.body.halfPriceCents, 2750);

    // Compras passadas permanecem intactas com o valor histórico pago (4000 / 2500)
    const pastTicket = await repo.findTicketPurchaseById('tkt_1');
    assert.equal(pastTicket?.paidUnitPriceCents, 4000);
    assert.equal(pastTicket?.ticketStatus, 'EMITIDO');
    assert.equal(pastTicket?.linkedCanteenOrder?.totalCents, 2500);

    // RBAC no relatório e cálculo determinístico de ocupação: 3 ativos / 10 assentos = 30%
    assert.equal((await getAdminOccupancyReport(service, cliente, 'scr_10')).status, 403);
    const reportRes = await getAdminOccupancyReport(service, admin, 'scr_10');
    assert.equal(reportRes.status, 200);
    assert.ok('occupancyPercent' in reportRes.body);
    assert.equal(reportRes.body.sellableSeats, 10);
    assert.equal(reportRes.body.activeTicketsCount, 3);
    assert.equal(reportRes.body.cancelledTicketsCount, 1);
    assert.equal(reportRes.body.expiredHoldsCount, 1);
    assert.equal(reportRes.body.occupancyPercent, 30);
    assert.equal(reportRes.body.grossRevenueCents, 12000);

    const dashboardRes = await getAdminSalesDashboard(service, admin);
    assert.equal(dashboardRes.status, 200);
    assert.ok('totalRevenueCents' in dashboardRes.body);
    assert.equal(dashboardRes.body.totalRevenueCents, 12000);
  });

  it('AC-6: cancelamento elegível até 2h antes da sessão realiza estorno idempotente sem duplicação', async () => {
    let clockMs = Date.parse('2026-11-20T18:00:00.000Z');
    const now = () => new Date(clockMs);

    const repo = new InMemoryManagementRepository();
    const adminService = new ManagementService(repo, { now });
    const gateway = new SandboxPaymentGatewayAdapter();
    const releasedSeats: Array<{ screeningId: string; seatId: string }> = [];

    const cdcService = new CdcCancellationService(repo, {
      now,
      gateway,
      onSeatReleased: async (screeningId, seatId) => {
        releasedSeats.push({ screeningId, seatId });
      },
    });

    const admin = sessionFor('adm_1', 'ADMIN_CINEMA');
    const alice = sessionFor('usr_alice', 'CLIENTE');
    const bob = sessionFor('usr_bob', 'CLIENTE');

    await putAdminMovie(adminService, admin, {
      movieId: 'mov_cdc',
      title: 'Interestelar',
      synopsis: 'Ficção científica',
      durationMinutes: 169,
      ageRating: '10',
      active: true,
    });
    await putAdminRoom(adminService, admin, {
      roomId: 'room_cdc',
      cinemaName: 'CineFood Paulista',
      name: 'Sala 1',
      sellableSeats: 10,
      active: true,
    });
    // Sessão inicia exatamente às 20:00 -> corte de 2h às 18:00
    await postAdminScreening(adminService, admin, {
      screeningId: 'scr_cdc',
      movieId: 'mov_cdc',
      roomId: 'room_cdc',
      startsAt: '2026-11-20T20:00:00.000Z',
      endsAt: '2026-11-20T22:50:00.000Z',
      format: '2D',
      basePriceCents: 4000,
    });

    // Compra 1 (Alice): elegível no limite exato das 2h antes (18:00) com cantina em AGUARDANDO_CHEGADA
    await repo.saveHold({
      holdId: 'hold_c1',
      screeningId: 'scr_cdc',
      seatId: 'C-1',
      expiresAt: '2026-11-18T12:10:00.000Z',
      status: 'CONFIRMADA',
    });
    await repo.saveTicketPurchase({
      ticketId: 'tkt_eligivel',
      purchaseId: 'pur_eligivel',
      ownerUserId: 'usr_alice',
      screeningId: 'scr_cdc',
      seatId: 'C-1',
      paidUnitPriceCents: 4000,
      paymentStatus: 'APROVADO',
      ticketStatus: 'EMITIDO',
      purchasedAt: '2026-11-18T12:00:00.000Z',
      gatewayChargeId: 'sbx_chg_eligivel',
      linkedCanteenOrder: {
        orderId: 'cnt_eligivel',
        status: 'AGUARDANDO_CHEGADA',
        totalCents: 2800,
      },
    });

    // Terceiro (Bob) não pode cancelar ingresso de Alice -> HTTP 403
    assert.equal((await postCancelTicketCdc(cdcService, bob, 'tkt_eligivel')).status, 403);

    // Alice cancela no limite exato (2h antes da sessão) -> sucesso + estorno total (4000 + 2800 = 6800) + assento liberado
    const cancelOk = await postCancelTicketCdc(cdcService, alice, 'tkt_eligivel');
    assert.equal(cancelOk.status, 200);
    assert.ok('refundId' in cancelOk.body);
    assert.equal(cancelOk.body.idempotentReplay, false);
    assert.equal(cancelOk.body.seatReleased, true);
    assert.equal(cancelOk.body.refundAmountCents, 6800);
    assert.equal(cancelOk.body.cancelledCanteenOrderId, 'cnt_eligivel');
    assert.equal(cancelOk.body.ticket.ticketStatus, 'CANCELADO');
    assert.equal(cancelOk.body.ticket.paymentStatus, 'ESTORNADO');
    assert.equal(cancelOk.body.ticket.linkedCanteenOrder?.status, 'CANCELADO');
    assert.equal(gateway.refundCalls, 1);
    assert.deepEqual(releasedSeats, [{ screeningId: 'scr_cdc', seatId: 'C-1' }]);

    const holdsAfterCancel = await repo.listHoldsByScreening('scr_cdc');
    assert.equal(holdsAfterCancel[0].status, 'CANCELADA');

    // Chamada repetida (idempotência): mesmo refundId e nenhum segundo estorno no gateway
    const replay = await postCancelTicketCdc(cdcService, alice, 'tkt_eligivel');
    assert.equal(replay.status, 200);
    assert.ok('refundId' in replay.body);
    assert.equal(replay.body.idempotentReplay, true);
    assert.equal(replay.body.refundId, cancelOk.body.refundId);
    assert.equal(gateway.refundCalls, 1);

    // Ingresso com cantina já em EM_PREPARO é bloqueado com HTTP 422
    await repo.saveTicketPurchase({
      ticketId: 'tkt_em_preparo',
      purchaseId: 'pur_prep',
      ownerUserId: 'usr_alice',
      screeningId: 'scr_cdc',
      seatId: 'C-2',
      paidUnitPriceCents: 4000,
      paymentStatus: 'APROVADO',
      ticketStatus: 'EMITIDO',
      purchasedAt: '2026-11-18T12:00:00.000Z',
      linkedCanteenOrder: {
        orderId: 'cnt_prep',
        status: 'EM_PREPARO',
        totalCents: 2500,
      },
    });
    assert.equal((await postCancelTicketCdc(cdcService, alice, 'tkt_em_preparo')).status, 422);

    // Ingresso já utilizado na portaria (UTILIZADO) -> rejeitado com HTTP 422
    await repo.saveTicketPurchase({
      ticketId: 'tkt_usado',
      purchaseId: 'pur_usado',
      ownerUserId: 'usr_alice',
      screeningId: 'scr_cdc',
      seatId: 'C-3',
      paidUnitPriceCents: 4000,
      paymentStatus: 'APROVADO',
      ticketStatus: 'UTILIZADO',
      purchasedAt: '2026-11-18T12:00:00.000Z',
    });
    assert.equal((await postCancelTicketCdc(cdcService, alice, 'tkt_usado')).status, 422);

    // Ingresso fora da janela de 2h antes da sessão (18:01 para sessão das 20:00) -> HTTP 422
    await repo.saveTicketPurchase({
      ticketId: 'tkt_tardio_2h',
      purchaseId: 'pur_tardio',
      ownerUserId: 'usr_alice',
      screeningId: 'scr_cdc',
      seatId: 'C-4',
      paidUnitPriceCents: 4000,
      paymentStatus: 'APROVADO',
      ticketStatus: 'EMITIDO',
      purchasedAt: '2026-11-19T12:00:00.000Z',
    });
    clockMs = Date.parse('2026-11-20T18:00:01.000Z');
    assert.equal((await postCancelTicketCdc(cdcService, alice, 'tkt_tardio_2h')).status, 422);

    // Ingresso comprado há mais de 7 dias corridos em sessão futura distante -> HTTP 422
    await postAdminScreening(adminService, admin, {
      screeningId: 'scr_futura',
      movieId: 'mov_cdc',
      roomId: 'room_cdc',
      startsAt: '2026-11-29T20:00:00.000Z',
      endsAt: '2026-11-29T22:50:00.000Z',
      format: '2D',
      basePriceCents: 4000,
    });
    await repo.saveTicketPurchase({
      ticketId: 'tkt_acima_7d',
      purchaseId: 'pur_7d',
      ownerUserId: 'usr_alice',
      screeningId: 'scr_futura',
      seatId: 'C-5',
      paidUnitPriceCents: 4000,
      paymentStatus: 'APROVADO',
      ticketStatus: 'EMITIDO',
      purchasedAt: '2026-11-10T12:00:00.000Z',
    });
    assert.equal((await postCancelTicketCdc(cdcService, alice, 'tkt_acima_7d')).status, 422);
    assert.equal(gateway.refundCalls, 1);
  });

  it('RF-10, RF-12 e RF-15: retorna "não aplicável" para 0 assentos, gerencia mapa/operadores e restitui estoque/QR no cancelamento', async () => {
    const now = () => new Date('2026-11-20T14:00:00.000Z');
    const repo = new InMemoryManagementRepository();
    const adminService = new ManagementService(repo, { now });
    const admin = sessionFor('adm_1', 'ADMIN_CINEMA');
    const alice = sessionFor('usr_alice', 'CLIENTE');

    await putAdminMovie(adminService, admin, {
      movieId: 'mov_zero',
      title: 'Sessão Manutenção',
      synopsis: 'Teste borda',
      durationMinutes: 90,
      ageRating: 'L',
      active: true,
    });
    await putAdminRoom(adminService, admin, {
      roomId: 'room_zero',
      cinemaName: 'CineFood Operações Piloto Ltda.',
      name: 'Sala 04 · 2D',
      sellableSeats: 0,
      active: true,
    });
    await postAdminScreening(adminService, admin, {
      screeningId: 'scr_zero',
      movieId: 'mov_zero',
      roomId: 'room_zero',
      startsAt: '2026-11-20T20:00:00.000Z',
      endsAt: '2026-11-20T21:30:00.000Z',
      format: '2D',
      basePriceCents: 3000,
    });

    const zeroReport = await getAdminOccupancyReport(adminService, admin, 'scr_zero');
    assert.equal(zeroReport.status, 200);
    if ('error' in zeroReport.body) {
      throw new Error(zeroReport.body.error);
    }
    assert.equal(zeroReport.body.occupancyPercent, 'não aplicável');

    // Mapa de assentos e operadores (RF-10)
    const mapRes = await putAdminRoomSeatMap(adminService, admin, 'room_zero', {
      rows: ['A', 'B'],
      seatsPerRow: 10,
      pcdSeats: ['A1'],
      pcdPlusSeats: ['A10'],
      blockedSeats: ['B10'],
    });
    assert.equal(mapRes.status, 200);
    if (!('error' in mapRes.body)) {
      assert.equal(mapRes.body.sellableSeats, 19);
    }

    const opRes = await putAdminOperator(adminService, admin, {
      operatorId: 'op_bil_1',
      fullName: 'Marcos Bilheteria',
      email: 'marcos@cinefood.piloto',
      role: 'OPERADOR_BILHETERIA',
      active: true,
    });
    assert.equal(opRes.status, 200);
    const opsList = await getAdminOperators(adminService, admin);
    assert.equal(opsList.status, 200);
    if (!('error' in opsList.body)) {
      assert.equal(opsList.body.length, 1);
      assert.equal(opsList.body[0].role, 'OPERADOR_BILHETERIA');
    }

    // Cancelamento CDC integrado devolve estoque na cantina e invalida QR Code (RF-12 / RF-08)
    const canteenRepo = new InMemoryCanteenRepository(
      [
        {
          productId: 'prod_pipoca',
          name: 'Pipoca G',
          description: 'Pipoca amanteigada',
          category: 'PIPOCA',
          unitPriceCents: 2800,
          availableStock: 9,
          active: true,
          isCombo: false,
          allowedAddonIds: [],
        },
      ],
      [],
    );
    await canteenRepo.saveOrder({
      orderId: 'cnt_restore_1',
      ownerUserId: 'usr_alice',
      deliveryChannel: 'ENTREGA_ASSENTO',
      linkedTicketId: 'tkt_restore_1',
      items: [
        {
          productId: 'prod_pipoca',
          productName: 'Pipoca G',
          quantity: 2,
          unitPriceCents: 2800,
          addons: [],
          lineTotalCents: 5600,
        },
      ],
      totalCents: 5600,
      status: 'AGUARDANDO_CHEGADA',
      paymentStatus: 'APROVADO',
      stockStatus: 'BAIXADO',
      createdAt: '2026-11-18T12:00:00.000Z',
      updatedAt: '2026-11-18T12:00:00.000Z',
    });

    const ticketRepo = new InMemoryTicketRepository();
    await ticketRepo.saveBatch([
      {
        ticketId: 'tkt_restore_1',
        purchaseId: 'pur_restore_1',
        reservationId: 'res_restore_1',
        buyerUserId: 'usr_alice',
        screeningId: 'scr_zero',
        movieTitle: 'Sessão Manutenção',
        cinemaName: 'CineFood Operações Piloto Ltda.',
        roomName: 'Sala 04 · 2D',
        startsAt: '2026-11-20T20:00:00.000Z',
        endsAt: '2026-11-20T21:30:00.000Z',
        seatId: 'A2',
        row: 'A',
        number: 2,
        category: 'INTEIRA',
        qrToken: 'cf_qr_restore_token_1',
        status: 'EMITIDO',
        issuedAt: '2026-11-18T12:00:00.000Z',
      },
    ]);

    await repo.saveTicketPurchase({
      ticketId: 'tkt_restore_1',
      purchaseId: 'pur_restore_1',
      ownerUserId: 'usr_alice',
      screeningId: 'scr_zero',
      seatId: 'A2',
      paidUnitPriceCents: 3000,
      paymentStatus: 'APROVADO',
      ticketStatus: 'EMITIDO',
      purchasedAt: '2026-11-18T12:00:00.000Z',
      linkedCanteenOrder: {
        orderId: 'cnt_restore_1',
        status: 'AGUARDANDO_CHEGADA',
        totalCents: 5600,
      },
    });

    const gateway = new SandboxPaymentGatewayAdapter();
    const cdcService = new CdcCancellationService(repo, {
      now,
      gateway,
      canteenRepository: canteenRepo,
      ticketRepository: ticketRepo,
    });
    const res = await postCancelTicketCdc(cdcService, alice, 'tkt_restore_1');
    assert.equal(res.status, 200);
    if ('error' in res.body) {
      throw new Error(res.body.error);
    }
    assert.equal(res.body.canteenStockRestored, true);
    assert.equal(res.body.ticketQrInvalidated, true);
    assert.equal((await canteenRepo.findProductById('prod_pipoca'))?.availableStock, 11);
    assert.equal((await canteenRepo.findOrderById('cnt_restore_1'))?.status, 'CANCELADO');
    assert.equal((await ticketRepo.findById('tkt_restore_1'))?.status, 'CANCELADO');
  });
});
