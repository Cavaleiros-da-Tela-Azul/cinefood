import { ForbiddenError } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import {
  DuplicateTicketReviewError,
  InvalidReviewRatingError,
  ReviewEligibilityError,
  ReviewNotFoundError,
  TicketForReviewNotFoundError,
  type HistoryService,
} from './service.ts';
import type {
  CreateReviewInput,
  PrivateUserHistory,
  SessionReview,
  UpdateReviewInput,
} from './types.ts';

export type HttpResult<T> = { status: number; body: T };

/**
 * GET /user/history — retorna exclusivamente histórico e avisos do titular autenticado.
 */
export async function getUserHistoryRoute(
  service: HistoryService,
  session: AuthenticatedSession,
  requestedOwnerUserId?: string,
): Promise<HttpResult<PrivateUserHistory | { error: string }>> {
  try {
    const history = await service.getUserHistory(session, requestedOwnerUserId);
    return { status: 200, body: history };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * POST /reviews — registra avaliação pós-sessão (1..5 estrelas) após uso + fim da sessão.
 */
export async function postReviewRoute(
  service: HistoryService,
  session: AuthenticatedSession,
  input: CreateReviewInput,
): Promise<HttpResult<SessionReview | { error: string }>> {
  try {
    const review = await service.createReview(session, input);
    return { status: 201, body: review };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof TicketForReviewNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    if (error instanceof DuplicateTicketReviewError) {
      return { status: 409, body: { error: error.message } };
    }
    if (
      error instanceof InvalidReviewRatingError ||
      error instanceof ReviewEligibilityError
    ) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * PUT /reviews/:reviewId — atualiza nota/comentário do próprio titular.
 */
export async function putReviewRoute(
  service: HistoryService,
  session: AuthenticatedSession,
  reviewId: string,
  input: UpdateReviewInput,
): Promise<HttpResult<SessionReview | { error: string }>> {
  try {
    const review = await service.updateReview(session, reviewId, input);
    return { status: 200, body: review };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof ReviewNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    if (error instanceof InvalidReviewRatingError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * DELETE /reviews/:reviewId — exclui avaliação privada do próprio titular.
 */
export async function deleteReviewRoute(
  service: HistoryService,
  session: AuthenticatedSession,
  reviewId: string,
): Promise<HttpResult<null | { error: string }>> {
  try {
    await service.deleteReview(session, reviewId);
    return { status: 204, body: null };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof ReviewNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    throw error;
  }
}
