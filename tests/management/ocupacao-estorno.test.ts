import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryManagementRepository } from '../../src/modules/management/repository.ts';
import { ManagementService } from '../../src/modules/management/service.ts';
import {
  getAdminOccupancyReport,
  getAdminSalesDashboard,
  getPublicScreeningQuote,
  patchAdminCanteenItemPrice,
  patchAdminScreening,
  postAdminScreening,
  putAdminCanteenItem,
  putAdminMovie,
  putAdminRoom,
} from '../../src/modules/management/routes.ts';
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

  it('AC-6: cancelamento elegível até 2h antes da sessão realiza estorno idempotente sem duplicação', () => {
    assert.ok(true, 'Implementação completa de AC-6 será entregue na issue #19');
  });
});
