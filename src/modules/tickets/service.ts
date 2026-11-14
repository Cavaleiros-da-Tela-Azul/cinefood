import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { authorize } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import type { TicketRepository } from './repository.ts';
import type {
  IssuedTicket,
  IssueTicketsInput,
  IssueTicketsResult,
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

const DEFAULT_TOKEN_SECRET = 'cinefood-qr-opaque-hmac-secret-v1';

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

export interface TicketsServiceOptions {
  tokenSecret?: string;
  now?: () => Date;
}

export class TicketsService {
  private readonly repository: TicketRepository;
  private readonly tokenSecret: string;
  private readonly now: () => Date;

  constructor(
    repository: TicketRepository,
    options: TicketsServiceOptions = {},
  ) {
    this.repository = repository;
    this.tokenSecret = options.tokenSecret ?? DEFAULT_TOKEN_SECRET;
    this.now = options.now ?? (() => new Date());
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
}
