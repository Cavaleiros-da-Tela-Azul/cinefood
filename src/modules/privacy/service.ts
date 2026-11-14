import type { PrivacyRepository } from './repository.ts';
import type { ConsentRecord, PrivacyNotice } from './types.ts';

export interface PrivacyService {
  getCurrentNotice(): Promise<PrivacyNotice>;
  recordMarketingPreference(userId: string, granted: boolean): Promise<ConsentRecord>;
  revokeMarketingConsent(userId: string): Promise<ConsentRecord>;
  isMarketingAllowed(userId: string): Promise<boolean>;
  canProceedWithPurchase(userId: string): Promise<boolean>;
}

export class DefaultPrivacyService implements PrivacyService {
  private readonly repository: PrivacyRepository;
  private readonly now: () => Date;

  constructor(
    repository: PrivacyRepository,
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository;
    this.now = now;
  }

  async getCurrentNotice(): Promise<PrivacyNotice> {
    return this.repository.getCurrentNotice();
  }

  async recordMarketingPreference(userId: string, granted: boolean): Promise<ConsentRecord> {
    const notice = await this.repository.getCurrentNotice();
    const record: ConsentRecord = {
      userId,
      purpose: 'MARKETING',
      granted,
      noticeVersion: notice.version,
      recordedAt: this.now(),
    };
    await this.repository.saveConsent(record);
    return record;
  }

  async revokeMarketingConsent(userId: string): Promise<ConsentRecord> {
    const notice = await this.repository.getCurrentNotice();
    const revokedAt = this.now();
    const record: ConsentRecord = {
      userId,
      purpose: 'MARKETING',
      granted: false,
      noticeVersion: notice.version,
      recordedAt: revokedAt,
      revokedAt,
    };
    await this.repository.saveConsent(record);
    return record;
  }

  async isMarketingAllowed(userId: string): Promise<boolean> {
    const latestConsent = await this.repository.findLatestConsent(userId, 'MARKETING');
    return latestConsent?.granted === true && latestConsent.revokedAt === undefined;
  }

  /** Marketing is optional and must never gate ticket or food purchase flows. */
  async canProceedWithPurchase(_userId: string): Promise<boolean> {
    return true;
  }
}
