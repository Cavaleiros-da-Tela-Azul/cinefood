import type { Consent, PrivacyTerm } from './types.js';

export interface PrivacyRepository {
  findCurrentTerm(): Promise<PrivacyTerm | null>;
  saveConsent(consent: Consent): Promise<void>;
}
