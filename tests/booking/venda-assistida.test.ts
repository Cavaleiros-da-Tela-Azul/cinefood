import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryBookingRepository } from '../../src/modules/booking/repository.ts';
import {
  postAssistedReservation,
  postReservation,
  postTicketPricingQuote,
} from '../../src/modules/booking/routes.ts';
import { DefaultBookingService } from '../../src/modules/booking/service.ts';
import type { SeatReservation } from '../../src/modules/booking/types.ts';
import type { AuthenticatedSession, UserRole } from '../../src/modules/identity/types.ts';

function createSession(userId: string, role: UserRole): AuthenticatedSession {
  return {
    userId,
    email: `${userId}@cinefood.example`,
    role,
    iat: 1_893_456_000,
    exp: 1_893_460_000,
  };
}

function createFixture() {
  const now = new Date('2030-06-15T14:00:00.000Z');
  const repository = new InMemoryBookingRepository(
    [
      {
        id: 'session-mar02',
        roomId: 'room-1',
        startsAt: new Date('2030-06-15T20:00:00.000Z'),
        status: 'ATIVA',
        basePriceCents: 4000,
      },
    ],
    [
      { id: 'seat-d1', screeningId: 'session-mar02', row: 'D', number: 1, state: 'DISPONIVEL' },
      { id: 'seat-d2', screeningId: 'session-mar02', row: 'D', number: 2, state: 'DISPONIVEL' },
      { id: 'seat-d3', screeningId: 'session-mar02', row: 'D', number: 3, state: 'DISPONIVEL' },
      { id: 'seat-d4', screeningId: 'session-mar02', row: 'D', number: 4, state: 'DISPONIVEL' },
    ],
  );

  const service = new DefaultBookingService(repository, () => new Date(now.getTime()));
  return { repository, service };
}

describe('Venda Assistida e Categorias de Meia-Entrada (RF-14, RF-16 / MAR-02)', () => {
  it('AC-5: venda assistida registra operador e comprador e compartilha trava única de assentos', async () => {
    const { repository, service } = createFixture();
    const operator = createSession('op-bilheteria-1', 'OPERADOR_BILHETERIA');
    const webBuyer = createSession('client-web-1', 'CLIENTE');

    // Cliente comum não pode usar rota operacional de venda assistida
    const forbiddenAttempt = await postAssistedReservation(service, webBuyer, {
      screeningId: 'session-mar02',
      seatId: 'seat-d1',
      purchaseId: 'purchase-forbidden',
      buyerUserId: 'client-presencial-1',
      ticketCategory: 'INTEIRA',
    });
    assert.equal(forbiddenAttempt.status, 403);

    // Disputa simultânea entre guichê (bilheteria) e canal digital (web) pela mesma poltrona
    const [assistedResult, webResult] = await Promise.all([
      postAssistedReservation(service, operator, {
        screeningId: 'session-mar02',
        seatId: 'seat-d1',
        purchaseId: 'purchase-box-1',
        buyerUserId: 'client-presencial-1',
        buyerDocument: '12345678900',
        ticketCategory: 'INTEIRA',
      }),
      postReservation(service, webBuyer, {
        screeningId: 'session-mar02',
        seatId: 'seat-d1',
        purchaseId: 'purchase-web-1',
        channel: 'WEB',
      }),
    ]);

    const statuses = [assistedResult.status, webResult.status].sort((a, b) => a - b);
    assert.deepEqual(statuses, [200, 409]);

    if (assistedResult.status === 200) {
      const reservation = assistedResult.body as SeatReservation;
      assert.equal(reservation.channel, 'BILHETERIA');
      assert.equal(reservation.operatorUserId, 'op-bilheteria-1');
      assert.equal(reservation.buyerUserId, 'client-presencial-1');
      assert.equal(reservation.buyerDocument, '12345678900');
      assert.equal(reservation.status, 'ATIVA');
      assert.equal(reservation.ticketEmitted, false);

      const stored = await repository.findReservationById(reservation.id);
      assert.equal(stored?.ticketEmitted, false);
    }

    // Sem comprador identificado a venda assistida deve ser rejeitada com HTTP 422
    const missingBuyer = await postAssistedReservation(service, operator, {
      screeningId: 'session-mar02',
      seatId: 'seat-d2',
      purchaseId: 'purchase-box-2',
      buyerUserId: '   ',
      ticketCategory: 'INTEIRA',
    });
    assert.equal(missingBuyer.status, 422);
  });

  it('AC-6: calcula inteira a R$ 40 e meia-entrada elegível a R$ 20 no servidor rejeitando preço adulterado', async () => {
    const { service } = createFixture();
    const operator = createSession('op-bilheteria-2', 'OPERADOR_BILHETERIA');
    const digitalBuyer = createSession('client-web-2', 'CLIENTE');

    // Cotação server-side ignora valor adulterado pelo cliente e aplica R$ 40,00 / R$ 20,00
    const fullQuote = await postTicketPricingQuote(service, 'session-mar02', {
      category: 'INTEIRA',
      clientUnitPriceCents: 100,
    });
    assert.equal(fullQuote.status, 200);
    assert.deepEqual(fullQuote.body, {
      category: 'INTEIRA',
      fullPriceCents: 4000,
      unitPriceCents: 4000,
      discountPercent: 0,
    });

    const halfQuote = await postTicketPricingQuote(service, 'session-mar02', {
      category: 'MEIA_ENTRADA',
      halfPriceDocumentType: 'ESTUDANTE',
      halfPriceDocumentCode: 'CIE-2026-9988',
      clientUnitPriceCents: 1,
    });
    assert.equal(halfQuote.status, 200);
    assert.deepEqual(halfQuote.body, {
      category: 'MEIA_ENTRADA',
      fullPriceCents: 4000,
      unitPriceCents: 2000,
      discountPercent: 50,
      halfPriceDocumentType: 'ESTUDANTE',
      halfPriceDocumentCode: 'CIE-2026-9988',
    });

    // Meia-entrada sem categoria documental ou código comprobatório é rejeitada
    const missingDoc = await postAssistedReservation(service, operator, {
      screeningId: 'session-mar02',
      seatId: 'seat-d2',
      purchaseId: 'purchase-missing-doc',
      buyerUserId: 'client-half-1',
      ticketCategory: 'MEIA_ENTRADA',
      halfPriceDocumentType: 'ESTUDANTE',
      halfPriceDocumentCode: '   ',
    });
    assert.equal(missingDoc.status, 422);

    // Payload com preço adulterado na reserva é rejeitado explicitamente no servidor
    const tamperedAttempt = await postReservation(service, digitalBuyer, {
      screeningId: 'session-mar02',
      seatId: 'seat-d2',
      purchaseId: 'purchase-tampered',
      channel: 'WEB',
      ticketCategory: 'MEIA_ENTRADA',
      halfPriceDocumentType: 'IDOSO',
      halfPriceDocumentCode: 'RG-778899',
      clientUnitPriceCents: 500,
    });
    assert.equal(tamperedAttempt.status, 422);

    // Reserva legítima de meia-entrada (PCD) grava exatos 2000 centavos e não emite ingresso pré-pagamento
    const validHalfAssisted = await postAssistedReservation(service, operator, {
      screeningId: 'session-mar02',
      seatId: 'seat-d3',
      purchaseId: 'purchase-half-ok',
      buyerUserId: 'client-pcd-1',
      ticketCategory: 'MEIA_ENTRADA',
      halfPriceDocumentType: 'PCD',
      halfPriceDocumentCode: 'LAUDO-PCD-042',
    });
    assert.equal(validHalfAssisted.status, 200);
    const body = validHalfAssisted.body as SeatReservation;
    assert.equal(body.unitPriceCents, 2000);
    assert.equal(body.ticketCategory, 'MEIA_ENTRADA');
    assert.equal(body.halfPriceDocumentType, 'PCD');
    assert.equal(body.ticketEmitted, false);

    // Reserva inteira grava 4000 centavos
    const validFullDigital = await postReservation(service, digitalBuyer, {
      screeningId: 'session-mar02',
      seatId: 'seat-d4',
      purchaseId: 'purchase-full-ok',
      channel: 'ANDROID',
      ticketCategory: 'INTEIRA',
    });
    assert.equal(validFullDigital.status, 200);
    assert.equal((validFullDigital.body as SeatReservation).unitPriceCents, 4000);
  });
});
