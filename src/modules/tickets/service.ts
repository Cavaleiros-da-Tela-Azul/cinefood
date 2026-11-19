import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { authorize } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import type { TicketRepository } from './repository.ts';
import type {
  IssuedTicket,
  IssueTicketsInput,
  IssueTicketsResult,
  LinkedCanteenOrderRef,
  TicketValidatedEvent,
  ValidateQrInput,
  ValidateQrResult,
} from './types.ts';

export class PaymentNotConfirmedForTicketError extends Error {
  constructor(status: string) {
    super(`Emissão bloqueada: pagamento em estado ${status} não permite gerar QR Code.`);
    this.name = 'PaymentNotConfirmedForTicketError';
  }
}

export class EmptyTicketSeatsError extends Error {
  constructor() {
    super('Não é possível emitir ingressos sem poltronas vinculadas.');
    this.name = 'EmptyTicketSeatsError';
  }
}

export class TicketPurchaseNotFoundError extends Error {
  constructor(purchaseId: string) {
    super(`Nenhum ingresso emitido encontrado para a compra ${purchaseId}.`);
    this.name = 'TicketPurchaseNotFoundError';
  }
}

export class TicketNotFoundError extends Error {
  constructor() {
    super('QR Code de ingresso não encontrado.');
    this.name = 'TicketNotFoundError';
  }
}

export class TicketAlreadyUsedError extends Error {
  constructor(seatId: string) {
    super(`Ingresso já utilizado na portaria (poltrona ${seatId}).`);
    this.name = 'TicketAlreadyUsedError';
  }
}

export class TicketCancelledError extends Error {
  constructor() {
    super('Ingresso cancelado e inválido para acesso na portaria.');
    this.name = 'TicketCancelledError';
  }
}

export class TicketWrongScreeningError extends Error {
  constructor() {
    super('Ingresso pertence a outra sala ou sessão distinta desta portaria.');
    this.name = 'TicketWrongScreeningError';
  }
}

export class TicketSessionExpiredError extends Error {
  constructor() {
    super('Sessão já encerrada: leitura do ingresso bloqueada na portaria.');
    this.name = 'TicketSessionExpiredError';
  }
}

/**
 * Gera token opaco criptograficamente seguro (HMAC-SHA256 + 128 bits CSPRNG),
 * sem padrão sequencial ou enumerável (RF-05 / RNF-02).
 */
export function generateOpaqueQrToken(
  secret: string,
  context: { purchaseId: string; reservationId: string; seatId: string },
): string {
  const nonce = randomBytes(16).toString('hex');
  const digest = createHmac('sha256', secret)
    .update(`${context.purchaseId}:${context.reservationId}:${context.seatId}:${nonce}`)
    .digest('base64url');
  return `cf_qr_${digest.slice(0, 32)}`;
}

export type TicketValidatedListener = (
  event: TicketValidatedEvent,
) => Promise<LinkedCanteenOrderRef[]>;

export interface TicketsServiceOptions {
  tokenSecret?: string;
  now?: () => Date;
  onTicketValidated?: TicketValidatedListener;
}

export class TicketsService {
  private readonly repository: TicketRepository;
  private readonly tokenSecret: string;
  private readonly now: () => Date;
  private readonly onTicketValidated?: TicketValidatedListener;

  constructor(
    repository: TicketRepository,
    options: TicketsServiceOptions = {},
  ) {
    this.repository = repository;
    this.tokenSecret =
      options.tokenSecret ??
      process.env.CINEFOOD_QR_TOKEN_SECRET ??
      randomBytes(32).toString('hex');
    this.now = options.now ?? (() => new Date());
    this.onTicketValidated = options.onTicketValidated;
  }

  /**
   * Emite 1 ingresso individual com QR Code opaco por assento somente após
   * liquidação confirmada do pagamento (APROVADO). Bloqueia PENDENTE/CANCELADO.
   */
  async issueTicketsForPaidOrder(input: IssueTicketsInput): Promise<IssueTicketsResult> {
    if (input.paymentStatus !== 'APROVADO') {
      throw new PaymentNotConfirmedForTicketError(input.paymentStatus);
    }

    if (input.seats.length === 0) {
      throw new EmptyTicketSeatsError();
    }

    const existing = await this.repository.findByPurchaseId(input.purchaseId);
    if (existing.length > 0) {
      return {
        purchaseId: input.purchaseId,
        tickets: existing,
        canteenPreLinkAvailable: true,
      };
    }

    const issuedAt = this.now().toISOString();
    const toPersist: IssuedTicket[] = input.seats.map((seat) => ({
      ticketId: `tkt_${randomUUID()}`,
      purchaseId: input.purchaseId,
      reservationId: seat.reservationId,
      buyerUserId: input.buyerUserId,
      screeningId: input.screening.screeningId,
      movieTitle: input.screening.movieTitle,
      cinemaName: input.screening.cinemaName,
      roomName: input.screening.roomName,
      startsAt: input.screening.startsAt,
      endsAt: input.screening.endsAt,
      seatId: seat.seatId,
      row: seat.row,
      number: seat.number,
      category: seat.category,
      qrToken: generateOpaqueQrToken(this.tokenSecret, {
        purchaseId: input.purchaseId,
        reservationId: seat.reservationId,
        seatId: seat.seatId,
      }),
      status: 'EMITIDO',
      canteenPreLinkEligible: true,
      issuedAt,
    }));

    const persisted = await this.repository.saveBatch(toPersist);
    return {
      purchaseId: input.purchaseId,
      tickets: persisted,
      canteenPreLinkAvailable: true,
    };
  }

  /**
   * Consulta os bilhetes digitais emitidos para uma compra autenticada.
   * Nunca emite nem retorna QR Codes se a compra ainda estiver PENDENTE.
   */
  async getTicketPassByPurchase(
    session: AuthenticatedSession,
    purchaseId: string,
  ): Promise<IssuedTicket[]> {
    const tickets = await this.repository.findByPurchaseId(purchaseId);
    if (tickets.length === 0) {
      throw new TicketPurchaseNotFoundError(purchaseId);
    }

    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: tickets[0].buyerUserId,
    });

    return tickets;
  }

  /**
   * Validação e consumo atômico único na portaria (RF-06 / RNF-03 / RN-02).
   * Exige OPERADOR_PORTARIA ou ADMIN_CINEMA e dispara TicketValidatedEvent
   * somente na primeira leitura bem-sucedida.
   */
  async validateTicketAtGate(
    session: AuthenticatedSession,
    input: ValidateQrInput,
  ): Promise<ValidateQrResult> {
    authorize({ session, operation: 'TICKET_VALIDATION' });

    const usedAt = this.now().toISOString();
    const consumeResult = await this.repository.consumeTokenAtomically({
      qrToken: input.qrToken.trim(),
      operatorId: session.userId,
      usedAt,
      expectedScreeningId: input.expectedScreeningId,
      expectedRoomName: input.expectedRoomName,
    });

    switch (consumeResult.kind) {
      case 'NOT_FOUND':
        throw new TicketNotFoundError();
      case 'CANCELLED':
        throw new TicketCancelledError();
      case 'ALREADY_USED':
        throw new TicketAlreadyUsedError(consumeResult.ticket.seatId);
      case 'WRONG_SCREENING':
        throw new TicketWrongScreeningError();
      case 'EXPIRED_SESSION':
        throw new TicketSessionExpiredError();
      case 'CONSUMED': {
        const event: TicketValidatedEvent = {
          eventName: 'TicketValidatedEvent',
          ticketId: consumeResult.ticket.ticketId,
          purchaseId: consumeResult.ticket.purchaseId,
          screeningId: consumeResult.ticket.screeningId,
          seatId: consumeResult.ticket.seatId,
          operatorId: session.userId,
          validatedAt: usedAt,
        };
        const triggeredCanteenOrders = this.onTicketValidated
          ? await this.onTicketValidated(event)
          : [];
        return {
          outcome: 'LIBERADO',
          ticket: consumeResult.ticket,
          triggeredCanteenOrders,
          event,
        };
      }
    }
  }
}
