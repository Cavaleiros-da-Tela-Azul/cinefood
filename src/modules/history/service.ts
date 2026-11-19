import { randomUUID } from 'node:crypto';
import { authenticatedUserId, authorize } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import type { HistoryRepository } from './repository.ts';
import type {
  CreateReviewInput,
  HistoryNoticeRecord,
  PrivateUserHistory,
  PublicCommunityReview,
  SessionReview,
  UpdateReviewInput,
} from './types.ts';

export class NoticeNotFoundError extends Error {
  constructor(noticeId: string) {
    super(`Aviso interno ${noticeId} não encontrado.`);
    this.name = 'NoticeNotFoundError';
  }
}

export class TicketForReviewNotFoundError extends Error {
  constructor(ticketId: string) {
    super(`Ingresso ${ticketId} não encontrado para avaliação.`);
    this.name = 'TicketForReviewNotFoundError';
  }
}

export class ReviewNotFoundError extends Error {
  constructor(reviewId: string) {
    super(`Avaliação ${reviewId} não encontrada.`);
    this.name = 'ReviewNotFoundError';
  }
}

export class InvalidReviewRatingError extends Error {
  constructor() {
    super('A nota da avaliação deve ser um número inteiro entre 1 e 5 estrelas.');
    this.name = 'InvalidReviewRatingError';
  }
}

export class ReviewEligibilityError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'ReviewEligibilityError';
  }
}

export class DuplicateTicketReviewError extends Error {
  constructor(ticketId: string) {
    super(`Já existe uma avaliação registrada para o ingresso ${ticketId}.`);
    this.name = 'DuplicateTicketReviewError';
  }
}

export interface HistoryServiceOptions {
  now?: () => Date;
}

export interface NoticeDispatchOutcome {
  dispatched: boolean;
  notice?: HistoryNoticeRecord;
  error?: string;
}

export class HistoryService {
  private readonly repository: HistoryRepository;
  private readonly now: () => Date;

  constructor(repository: HistoryRepository, options: HistoryServiceOptions = {}) {
    this.repository = repository;
    this.now = options.now ?? (() => new Date());
  }

  /**
   * Consulta o histórico consolidado exclusivamente para o titular autenticado
   * (ou ADMIN_CINEMA), bloqueando leitura de terceiros com ForbiddenError (HTTP 403).
   */
  async getUserHistory(
    session: AuthenticatedSession,
    requestedOwnerUserId?: string,
  ): Promise<PrivateUserHistory> {
    const targetOwnerUserId = requestedOwnerUserId ?? authenticatedUserId(session);
    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: targetOwnerUserId,
    });

    const [tickets, canteenOrders, refunds, notices, reviews] = await Promise.all([
      this.repository.listTicketsByOwner(targetOwnerUserId),
      this.repository.listCanteenOrdersByOwner(targetOwnerUserId),
      this.repository.listRefundsByOwner(targetOwnerUserId),
      this.repository.listNoticesByOwner(targetOwnerUserId),
      this.repository.listReviewsByOwner(targetOwnerUserId),
    ]);

    return {
      ownerUserId: targetOwnerUserId,
      tickets,
      canteenOrders,
      refunds,
      notices,
      reviews,
    };
  }

  /**
   * Registra aviso interno em modo best-effort: falhas de notificação são
   * capturadas e jamais corrompem ou revertem pagamento/reserva já confirmados.
   */
  async recordInternalNoticeBestEffort(input: {
    ownerUserId: string;
    orderId?: string;
    type: 'INFO' | 'WARNING' | 'REFUND';
    title: string;
    message: string;
  }): Promise<NoticeDispatchOutcome> {
    const notice: HistoryNoticeRecord = {
      noticeId: `not_${randomUUID()}`,
      ownerUserId: input.ownerUserId,
      orderId: input.orderId,
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
      createdAt: this.now().toISOString(),
    };

    try {
      const saved = await this.repository.saveNotice(notice);
      return { dispatched: true, notice: saved };
    } catch (error) {
      return {
        dispatched: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao salvar aviso',
      };
    }
  }

  private assertValidRating(rating: number): 1 | 2 | 3 | 4 | 5 {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new InvalidReviewRatingError();
    }
    return rating as 1 | 2 | 3 | 4 | 5;
  }

  /**
   * Cria avaliação privada pós-sessão (RF-13):
   * 1) titular autenticado é dono do ingresso;
   * 2) ingresso validado na portaria (status === 'UTILIZADO');
   * 3) relógio posterior ao término da sessão (now > screeningEndTime);
   * 4) nota inteira entre 1 e 5.
   */
  async createReview(
    session: AuthenticatedSession,
    input: CreateReviewInput,
  ): Promise<SessionReview> {
    const rating = this.assertValidRating(input.rating);
    const ticket = await this.repository.findTicketById(input.ticketId);
    if (!ticket) {
      throw new TicketForReviewNotFoundError(input.ticketId);
    }

    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: ticket.ownerUserId,
    });

    if (ticket.status !== 'UTILIZADO') {
      throw new ReviewEligibilityError(
        'Avaliação permitida apenas após validação e uso do ingresso na portaria (RF-13).',
      );
    }

    const nowDate = this.now();
    if (nowDate.getTime() <= Date.parse(ticket.endsAt)) {
      throw new ReviewEligibilityError(
        'Avaliação permitida apenas após o término oficial da sessão (RF-13).',
      );
    }

    const existing = await this.repository.findReviewByUserAndScreening(
      ticket.ownerUserId,
      ticket.screeningId,
    );
    if (existing) {
      throw new DuplicateTicketReviewError(ticket.ticketId);
    }

    const timestamp = nowDate.toISOString();
    const trimmedComment = input.comment?.trim();
    return this.repository.createReview({
      reviewId: `rev_${randomUUID()}`,
      ownerUserId: ticket.ownerUserId,
      ticketId: ticket.ticketId,
      screeningId: ticket.screeningId,
      movieTitle: ticket.movieTitle,
      rating,
      comment: trimmedComment && trimmedComment.length > 0 ? trimmedComment : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async updateReview(
    session: AuthenticatedSession,
    reviewId: string,
    input: UpdateReviewInput,
  ): Promise<SessionReview> {
    const rating = this.assertValidRating(input.rating);
    const existing = await this.repository.findReviewById(reviewId);
    if (!existing) {
      throw new ReviewNotFoundError(reviewId);
    }

    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: existing.ownerUserId,
    });

    const trimmedComment = input.comment?.trim();
    return this.repository.updateReview({
      ...existing,
      rating,
      comment: trimmedComment && trimmedComment.length > 0 ? trimmedComment : undefined,
      updatedAt: this.now().toISOString(),
    });
  }

  async deleteReview(
    session: AuthenticatedSession,
    reviewId: string,
  ): Promise<void> {
    const existing = await this.repository.findReviewById(reviewId);
    if (!existing) {
      throw new ReviewNotFoundError(reviewId);
    }

    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: existing.ownerUserId,
    });

    await this.repository.deleteReview(reviewId);
  }

  async markNoticeAsRead(
    session: AuthenticatedSession,
    noticeId: string,
  ): Promise<HistoryNoticeRecord> {
    const existing = await this.repository.findNoticeById(noticeId);
    if (!existing) {
      throw new NoticeNotFoundError(noticeId);
    }
    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: existing.ownerUserId,
    });
    const updated = await this.repository.markNoticeAsRead(noticeId);
    if (!updated) {
      throw new NoticeNotFoundError(noticeId);
    }
    return updated;
  }

  /**
   * Lista avaliações verificadas para a vitrine Comentários da Rede (RF-13 atualizado),
   * sem expor userId/e-mail e preservando o selo de entrada validada na portaria.
   */
  async listPublicCommunityReviews(movieTitleFilter?: string): Promise<PublicCommunityReview[]> {
    const all = await this.repository.listAllReviews();
    const normalizedFilter = movieTitleFilter?.trim().toLowerCase();
    return all
      .filter((r) =>
        normalizedFilter ? r.movieTitle.trim().toLowerCase() === normalizedFilter : true,
      )
      .map((r) => ({
        reviewId: r.reviewId,
        movieTitle: r.movieTitle,
        screeningId: r.screeningId,
        authorDisplayName: `Espectador ${r.ownerUserId.slice(-4).toUpperCase()}`,
        rating: r.rating,
        comment: r.comment,
        verifiedEntry: true as const,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
  }
}
