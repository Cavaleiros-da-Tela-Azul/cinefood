export type ConsentPurpose = 'MARKETING';

export interface PrivacyNotice {
  version: string;
  effectiveAt: Date;
  purposes: string[];
  legalBases: string[];
  sharing: string[];
  retention: string;
  dataSubjectChannel: string;
}

/** A recorded, versioned manifestation for an optional processing purpose. */
export interface ConsentRecord {
  userId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  noticeVersion: string;
  recordedAt: Date;
  revokedAt?: Date;
}
