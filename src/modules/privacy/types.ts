export interface PrivacyTerm { id: string; version: string; title: string; content: string; effectiveFrom: string; }
export interface Consent { userId: string; termId: string; purpose: string; granted: boolean; recordedAt: string; }
