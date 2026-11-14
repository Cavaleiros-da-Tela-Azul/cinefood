import type {
  ConsentPurpose,
  ConsentRecord,
  DataSubjectRequestRecord,
  MandatoryFiscalRecord,
  PrivacyNotice,
  UserPrivacyProfile,
} from './types.ts';

export interface PrivacyRepository {
  getCurrentNotice(): Promise<PrivacyNotice>;
  saveConsent(consent: ConsentRecord): Promise<void>;
  findLatestConsent(userId: string, purpose: ConsentPurpose): Promise<ConsentRecord | null>;
  upsertUserProfile(profile: UserPrivacyProfile): Promise<UserPrivacyProfile>;
  findUserProfile(userId: string): Promise<UserPrivacyProfile | null>;
  saveMandatoryFiscalRecord(record: MandatoryFiscalRecord): Promise<void>;
  listMandatoryFiscalRecords(userId: string): Promise<MandatoryFiscalRecord[]>;
  saveDataSubjectRequest(request: DataSubjectRequestRecord): Promise<DataSubjectRequestRecord>;
  findDataSubjectRequestByProtocol(
    protocolNumber: string,
  ): Promise<DataSubjectRequestRecord | null>;
  listDataSubjectRequestsByUser(userId: string): Promise<DataSubjectRequestRecord[]>;
}

/** Deterministic repository adapter; a relational adapter can preserve the same audit contract. */
export class InMemoryPrivacyRepository implements PrivacyRepository {
  private readonly records: ConsentRecord[] = [];
  private readonly notice: PrivacyNotice;
  private readonly profiles = new Map<string, UserPrivacyProfile>();
  private readonly fiscalRecords = new Map<string, MandatoryFiscalRecord[]>();
  private readonly requestsByProtocol = new Map<string, DataSubjectRequestRecord>();

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
    const record = [...this.records]
      .reverse()
      .find((item) => item.userId === userId && item.purpose === purpose);
    return record ? cloneConsent(record) : null;
  }

  /** Audit helper for adapters/tests; every manifestation remains available. */
  async listConsentHistory(userId: string): Promise<ConsentRecord[]> {
    return this.records.filter((item) => item.userId === userId).map(cloneConsent);
  }

  async upsertUserProfile(profile: UserPrivacyProfile): Promise<UserPrivacyProfile> {
    const copy = cloneProfile(profile);
    this.profiles.set(copy.userId, copy);
    return cloneProfile(copy);
  }

  async findUserProfile(userId: string): Promise<UserPrivacyProfile | null> {
    const profile = this.profiles.get(userId);
    return profile ? cloneProfile(profile) : null;
  }

  async saveMandatoryFiscalRecord(record: MandatoryFiscalRecord): Promise<void> {
    const list = this.fiscalRecords.get(record.userId) ?? [];
    list.push({ ...record });
    this.fiscalRecords.set(record.userId, list);
  }

  async listMandatoryFiscalRecords(userId: string): Promise<MandatoryFiscalRecord[]> {
    return (this.fiscalRecords.get(userId) ?? []).map((record) => ({ ...record }));
  }

  async saveDataSubjectRequest(
    request: DataSubjectRequestRecord,
  ): Promise<DataSubjectRequestRecord> {
    const copy = cloneRequest(request);
    this.requestsByProtocol.set(copy.protocolNumber, copy);
    return cloneRequest(copy);
  }

  async findDataSubjectRequestByProtocol(
    protocolNumber: string,
  ): Promise<DataSubjectRequestRecord | null> {
    const found = this.requestsByProtocol.get(protocolNumber);
    return found ? cloneRequest(found) : null;
  }

  async listDataSubjectRequestsByUser(userId: string): Promise<DataSubjectRequestRecord[]> {
    return Array.from(this.requestsByProtocol.values())
      .filter((req) => req.userId === userId)
      .map(cloneRequest);
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

function cloneProfile(profile: UserPrivacyProfile): UserPrivacyProfile {
  return {
    ...profile,
    optionalPreferences: {
      ...profile.optionalPreferences,
      favoriteGenres: [...profile.optionalPreferences.favoriteGenres],
    },
    cookieConsents: [...profile.cookieConsents],
    browsingHistory: [...profile.browsingHistory],
  };
}

function cloneRequest(request: DataSubjectRequestRecord): DataSubjectRequestRecord {
  return {
    ...request,
    ...(request.confirmationSummary
      ? {
          confirmationSummary: {
            processingExists: request.confirmationSummary.processingExists,
            activePurposes: [...request.confirmationSummary.activePurposes],
            categories: [...request.confirmationSummary.categories],
          },
        }
      : {}),
    ...(request.accessExport
      ? {
          accessExport: {
            profile: cloneProfile(request.accessExport.profile),
            mandatoryFiscalRecords: request.accessExport.mandatoryFiscalRecords.map((r) => ({
              ...r,
            })),
          },
        }
      : {}),
    ...(request.eliminatedCategories
      ? { eliminatedCategories: [...request.eliminatedCategories] }
      : {}),
    ...(request.legalRetention
      ? {
          legalRetention: {
            ...request.legalRetention,
            retainedRecordIds: [...request.legalRetention.retainedRecordIds],
          },
        }
      : {}),
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
  if (
    [notice.purposes, notice.legalBases, notice.sharing].some(
      (items) => items.length === 0 || items.some((item) => !item.trim()),
    )
  ) {
    throw new Error(
      'O aviso de privacidade exige finalidades, bases legais e informações de compartilhamento.',
    );
  }
}
