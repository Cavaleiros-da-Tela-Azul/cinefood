import { ForbiddenError } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import {
  DataSubjectProfileNotFoundError,
  DataSubjectProtocolNotFoundError,
  InvalidDataSubjectRequestError,
  type PrivacyService,
} from './service.ts';
import type {
  ConsentRecord,
  DataSubjectRequestRecord,
  PrivacyNotice,
  SubmitDataSubjectRequestInput,
} from './types.ts';

export type HttpResult<T> = { status: number; body: T };

/** Public notice endpoint, available before final registration data is collected. */
export async function getPrivacyNotice(service: PrivacyService): Promise<HttpResult<PrivacyNotice>> {
  return { status: 200, body: await service.getCurrentNotice() };
}

export async function setMarketingPreference(
  service: PrivacyService,
  userId: string,
  granted: boolean,
): Promise<HttpResult<ConsentRecord>> {
  return { status: 200, body: await service.recordMarketingPreference(userId, granted) };
}

export async function revokeMarketingPreference(
  service: PrivacyService,
  userId: string,
): Promise<HttpResult<ConsentRecord>> {
  return { status: 200, body: await service.revokeMarketingConsent(userId) };
}

/**
 * POST /privacy/requests — Abertura autenticada de solicitação de direitos do titular LGPD (RF-18).
 */
export async function postDataSubjectRequest(
  service: PrivacyService,
  session: AuthenticatedSession,
  input: SubmitDataSubjectRequestInput,
): Promise<HttpResult<DataSubjectRequestRecord | { error: string }>> {
  try {
    const created = await service.submitDataSubjectRequest(session, input);
    return { status: 201, body: created };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof DataSubjectProfileNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    if (error instanceof InvalidDataSubjectRequestError) {
      return { status: 422, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * GET /privacy/requests/:protocolNumber — Consulta autenticada de protocolo LGPD (RF-18).
 */
export async function getDataSubjectRequestByProtocol(
  service: PrivacyService,
  session: AuthenticatedSession,
  protocolNumber: string,
): Promise<HttpResult<DataSubjectRequestRecord | { error: string }>> {
  try {
    return {
      status: 200,
      body: await service.getDataSubjectRequestByProtocol(session, protocolNumber),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    if (error instanceof DataSubjectProtocolNotFoundError) {
      return { status: 404, body: { error: error.message } };
    }
    throw error;
  }
}

/**
 * GET /privacy/requests — Lista protocolos LGPD do próprio titular autenticado.
 */
export async function getDataSubjectRequests(
  service: PrivacyService,
  session: AuthenticatedSession,
  targetUserId?: string,
): Promise<HttpResult<DataSubjectRequestRecord[] | { error: string }>> {
  try {
    return {
      status: 200,
      body: await service.listDataSubjectRequests(session, targetUserId),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 403, body: { error: error.message } };
    }
    throw error;
  }
}
