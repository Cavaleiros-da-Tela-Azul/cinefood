import type { PrivacyService } from './service.ts';
import type { ConsentRecord, PrivacyNotice } from './types.ts';

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
