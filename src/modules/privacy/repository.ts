import type { ConsentPurpose, ConsentRecord, PrivacyNotice } from './types.ts';

export interface PrivacyRepository {
  getCurrentNotice(): Promise<PrivacyNotice>;
  saveConsent(consent: ConsentRecord): Promise<void>;
  findLatestConsent(userId: string, purpose: ConsentPurpose): Promise<ConsentRecord | null>;
}

/** Deterministic repository adapter; a relational adapter can preserve the same audit contract. */
export class InMemoryPrivacyRepository implements PrivacyRepository {
  private readonly records: ConsentRecord[] = [];
  private readonly notice: PrivacyNotice;

  constructor(notice: PrivacyNotice) {
    validateNotice(notice);
    this.notice = cloneNotice(notice);
  }

  async getCurrentNotice(): Promise<PrivacyNotice> {
    return cloneNotice(this.notice);
  }

  async saveConsent(consent: ConsentRecord): Promise<void> {
    this.records.push(cloneConsent(consent));
  }

  async findLatestConsent(userId: string, purpose: ConsentPurpose): Promise<ConsentRecord | null> {
    const record = [...this.records].reverse().find((item) => item.userId === userId && item.purpose === purpose);
    return record ? cloneConsent(record) : null;
  }

  /** Audit helper for adapters/tests; every manifestation remains available. */
  async listConsentHistory(userId: string): Promise<ConsentRecord[]> {
    return this.records.filter((item) => item.userId === userId).map(cloneConsent);
  }
}

function cloneNotice(notice: PrivacyNotice): PrivacyNotice {
  return {
    ...notice,
    effectiveAt: new Date(notice.effectiveAt.getTime()),
    purposes: [...notice.purposes],
    legalBases: [...notice.legalBases],
    sharing: [...notice.sharing],
  };
}

function cloneConsent(consent: ConsentRecord): ConsentRecord {
  return {
    ...consent,
    recordedAt: new Date(consent.recordedAt.getTime()),
    ...(consent.revokedAt ? { revokedAt: new Date(consent.revokedAt.getTime()) } : {}),
  };
}

function validateNotice(notice: PrivacyNotice): void {
  const requiredText = [notice.version, notice.retention, notice.dataSubjectChannel];
  if (requiredText.some((value) => !value.trim())) {
    throw new Error('O aviso de privacidade exige versão, retenção e canal do titular.');
  }
  if (!Number.isFinite(notice.effectiveAt.getTime())) {
    throw new Error('O aviso de privacidade exige uma data de vigência válida.');
  }
  if ([notice.purposes, notice.legalBases, notice.sharing].some(
    (items) => items.length === 0 || items.some((item) => !item.trim()),
  )) {
    throw new Error('O aviso de privacidade exige finalidades, bases legais e informações de compartilhamento.');
  }
}
