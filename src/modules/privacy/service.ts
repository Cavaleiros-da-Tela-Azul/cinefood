import type { Consent, PrivacyTerm } from './types.js';

export interface PrivacyService {
  getCurrentTerm(): Promise<PrivacyTerm>;
  recordConsent(consent: Consent): Promise<void>;
}
