import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryBookingRepository } from '../../src/modules/booking/repository.ts';
import {
  cancelSeatReservation,
  confirmSeatReservation,
  postReservation,
} from '../../src/modules/booking/routes.ts';
import { DefaultBookingService } from '../../src/modules/booking/service.ts';
import type { SeatReservation } from '../../src/modules/booking/types.ts';
import type { AuthenticatedSession, UserRole } from '../../src/modules/identity/types.ts';

function createSession(userId: string, role: UserRole = 'CLIENTE'): AuthenticatedSession {
  return {
    userId,
    email: `${userId}@cinefood.example`,
    role,
    iat: 1_893_456_000,
    exp: 1_893_460_000,
  };
}

function createFixture(holdDurationMs?: number) {
  let currentTime = new Date('2030-05-10T12:00:00.000Z');
  const repository = new InMemoryBookingRepository(
    [
      {
        id: 'session-1',
        roomId: 'room-imax',
        startsAt: new Date('2030-05-10T15:00:00.000Z'),
        status: 'ATIVA',
      },
      {
        id: 'session-ended',
        roomId: 'room-imax',
        startsAt: new Date('2030-05-10T11:30:00.000Z'),
        status: 'ATIVA',
      },
      {
        id: 'session-inactive',
        roomId: 'room-imax',
        startsAt: new Date('2030-05-10T18:00:00.000Z'),
        status: 'INATIVA',
      },
    ],
    [
      { id: 'seat-f8', screeningId: 'session-1', row: 'F', number: 8, state: 'DISPONIVEL' },
      { id: 'seat-f9', screeningId: 'session-1', row: 'F', number: 9, state: 'OCUPADO', occupiedByUserId: 'existing-buyer' },
    ],
  );

  const service = new DefaultBookingService(
    repository,
    () => new Date(currentTime.getTime()),
    holdDurationMs,
  );

  return {
    repository,
    service,
    setCurrentTime(iso: string) {
      currentTime = new Date(iso);
    },
  };
}

describe('Reserva Concorrente de Assentos (RF-03 / MAR-02)', () => {
  it('AC-1: na disputa entre canais pelo mesmo assento, aprova apenas uma reserva com expiração de 10 min e libera após vencer', async () => {
    const { repository, service, setCurrentTime } = createFixture();
    const webBuyer = createSession('buyer-web', 'CLIENTE');
    const mobileBuyer = createSession('buyer-android', 'CLIENTE');
    const boxOfficeOperator = createSession('operator-box-office', 'ADMIN_CINEMA');

    const [firstAttempt, secondAttempt, thirdAttempt] = await Promise.all([
      postReservation(service, webBuyer, {
        screeningId: 'session-1',
        seatId: 'seat-f8',
        purchaseId: 'purchase-web-1',
        channel: 'WEB',
      }),
      postReservation(service, mobileBuyer, {
        screeningId: 'session-1',
        seatId: 'seat-f8',
        purchaseId: 'purchase-android-1',
        channel: 'ANDROID',
      }),
      postReservation(service, boxOfficeOperator, {
        screeningId: 'session-1',
        seatId: 'seat-f8',
        purchaseId: 'purchase-box-1',
        channel: 'BILHETERIA',
      }),
    ]);

    const results = [firstAttempt, secondAttempt, thirdAttempt];
    const approved = results.filter((item) => item.status === 200);
    const rejected = results.filter((item) => item.status === 409);

    assert.equal(approved.length, 1);
    assert.equal(rejected.length, 2);
    for (const conflict of rejected) {
      assert.deepEqual(conflict.body, {
        error: 'Assento já reservado ou ocupado para esta sessão.',
      });
    }

    const activeReservation = approved[0].body as SeatReservation;
    assert.equal(activeReservation.status, 'ATIVA');
    assert.equal(activeReservation.createdAt.toISOString(), '2030-05-10T12:00:00.000Z');
    assert.equal(activeReservation.expiresAt.toISOString(), '2030-05-10T12:10:00.000Z');

    // Antes de completar 10 minutos (9m59s), a poltrona permanece bloqueada
    setCurrentTime('2030-05-10T12:09:59.000Z');
    const beforeExpiry = await postReservation(service, mobileBuyer, {
      screeningId: 'session-1',
      seatId: 'seat-f8',
      purchaseId: 'purchase-android-retry',
      channel: 'ANDROID',
    });
    assert.equal(beforeExpiry.status, 409);

    // Exatamente após 10 minutos sem confirmação, o bloqueio expira e libera o assento
    setCurrentTime('2030-05-10T12:10:00.000Z');
    const afterExpiry = await postReservation(service, mobileBuyer, {
      screeningId: 'session-1',
      seatId: 'seat-f8',
      purchaseId: 'purchase-android-2',
      channel: 'ANDROID',
    });

    assert.equal(afterExpiry.status, 200);
    const newReservation = afterExpiry.body as SeatReservation;
    assert.equal(newReservation.buyerUserId, 'buyer-android');
    assert.equal(newReservation.status, 'ATIVA');
    assert.equal(newReservation.expiresAt.toISOString(), '2030-05-10T12:20:00.000Z');

    const previousReservation = await repository.findReservationById(activeReservation.id);
    assert.equal(previousReservation?.status, 'EXPIRADA');
    assert.equal(previousReservation?.releasedAt?.toISOString(), '2030-05-10T12:10:00.000Z');
  });

  it('AC-2: confirmação tardia após expiração não sobrescreve nova reserva ou ocupação de outro titular', async () => {
    const { repository, service, setCurrentTime } = createFixture();
    const firstBuyer = createSession('buyer-1', 'CLIENTE');
    const secondBuyer = createSession('buyer-2', 'CLIENTE');

    const initialHold = await postReservation(service, firstBuyer, {
      screeningId: 'session-1',
      seatId: 'seat-f8',
      purchaseId: 'purchase-1',
      channel: 'WEB',
    });
    assert.equal(initialHold.status, 200);
    const firstReservation = initialHold.body as SeatReservation;

    // Reserva de buyer-1 expira após 10 minutos e buyer-2 assume legitimamente a poltrona
    setCurrentTime('2030-05-10T12:10:05.000Z');
    const secondHold = await postReservation(service, secondBuyer, {
      screeningId: 'session-1',
      seatId: 'seat-f8',
      purchaseId: 'purchase-2',
      channel: 'ANDROID',
    });
    assert.equal(secondHold.status, 200);
    const secondReservation = secondHold.body as SeatReservation;

    // Confirmação de pagamento tardio (ex.: Pix Tardio) de buyer-1 chega em 12:11:00Z
    setCurrentTime('2030-05-10T12:11:00.000Z');
    const lateConfirmation = await confirmSeatReservation(service, firstReservation.id);

    assert.equal(lateConfirmation.status, 409);
    assert.ok('status' in lateConfirmation.body);
    if ('status' in lateConfirmation.body) {
      assert.equal(lateConfirmation.body.status, 'CONFLITO_EXPIRACAO');
      assert.equal(lateConfirmation.body.requiresRefund, true);
      assert.equal(lateConfirmation.body.currentSeat.state, 'RESERVADO');
      assert.equal(lateConfirmation.body.currentSeat.reservedByUserId, 'buyer-2');
      assert.equal(lateConfirmation.body.currentSeat.reservationId, secondReservation.id);
    }

    // A reserva de buyer-2 permanece intacta e pode ser confirmada normalmente
    const validConfirmation = await confirmSeatReservation(service, secondReservation.id);
    assert.equal(validConfirmation.status, 200);
    if ('status' in validConfirmation.body) {
      assert.equal(validConfirmation.body.status, 'CONFIRMADA');
      assert.equal(validConfirmation.body.requiresRefund, false);
      assert.equal(validConfirmation.body.seat.state, 'OCUPADO');
      assert.equal(validConfirmation.body.seat.occupiedByUserId, 'buyer-2');
    }

    const seatAfterBoth = await repository.findSeat('session-1', 'seat-f8');
    assert.equal(seatAfterBoth?.state, 'OCUPADO');
    assert.equal(seatAfterBoth?.occupiedByUserId, 'buyer-2');
  });

  it('usa sempre o userId da sessão autenticada, suporta prazo configurável e valida disponibilidade da sessão', async () => {
    const customHoldMs = 15 * 60 * 1000;
    const { service } = createFixture(customHoldMs);
    const buyer = createSession('authenticated-buyer', 'CLIENTE');

    const created = await postReservation(service, buyer, {
      screeningId: 'session-1',
      seatId: 'seat-f8',
      purchaseId: 'purchase-custom',
      channel: 'WEB',
      userId: 'spoofed-other-user',
    });

    assert.equal(created.status, 200);
    const reservation = created.body as SeatReservation;
    assert.equal(reservation.buyerUserId, 'authenticated-buyer');
    assert.equal(reservation.expiresAt.toISOString(), '2030-05-10T12:15:00.000Z');

    // Cancelamento explícito pelo titular libera o assento imediatamente
    const cancelled = await cancelSeatReservation(service, buyer, reservation.id);
    assert.equal(cancelled.status, 200);
    const seatState = await service.getSeatState('session-1', 'seat-f8');
    assert.equal(seatState.state, 'DISPONIVEL');

    // Sessões encerradas ou inativas e poltronas já ocupadas retornam 409; assento inexistente retorna 404
    const endedScreening = await postReservation(service, buyer, {
      screeningId: 'session-ended',
      seatId: 'seat-f8',
      purchaseId: 'p-ended',
      channel: 'WEB',
    });
    const inactiveScreening = await postReservation(service, buyer, {
      screeningId: 'session-inactive',
      seatId: 'seat-f8',
      purchaseId: 'p-inactive',
      channel: 'WEB',
    });
    const occupiedSeat = await postReservation(service, buyer, {
      screeningId: 'session-1',
      seatId: 'seat-f9',
      purchaseId: 'p-occupied',
      channel: 'WEB',
    });
    const missingSeat = await postReservation(service, buyer, {
      screeningId: 'session-1',
      seatId: 'seat-inexistente',
      purchaseId: 'p-missing',
      channel: 'WEB',
    });

    assert.equal(endedScreening.status, 409);
    assert.equal(inactiveScreening.status, 409);
    assert.equal(occupiedSeat.status, 409);
    assert.equal(missingSeat.status, 404);
  });
});
