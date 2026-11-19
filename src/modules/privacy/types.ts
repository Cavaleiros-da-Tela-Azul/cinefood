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

export type DataSubjectRequestType =
  | 'CONFIRMACAO'
  | 'ACESSO'
  | 'RETIFICACAO'
  | 'ELIMINACAO';

export type DataSubjectRequestStatus =
  | 'CONCLUIDA'
  | 'CONCLUIDA_COM_RETENCAO_LEGAL';

export interface UserPrivacyProfile {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  nickname?: string;
  optionalPreferences: {
    favoriteGenres: string[];
    marketingOptIn: boolean;
    newsletterSubscribed: boolean;
  };
  cookieConsents: string[];
  browsingHistory: string[];
  anonymizedAt?: string;
}

export interface MandatoryFiscalRecord {
  recordId: string;
  purchaseId: string;
  userId: string;
  invoiceNumber: string;
  amountCents: number;
  recordedAt: string;
  legalBasis: string;
}

export interface LegalRetentionSummary {
  retainedRecordIds: string[];
  legalBasis: string;
  lgpdArticle: string;
}

export interface RectificationPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  nickname?: string;
  favoriteGenres?: string[];
}

export interface SubmitDataSubjectRequestInput {
  type: DataSubjectRequestType;
  /** Campo opcional: se CLIENTE informar userId de terceiro, o servidor rejeita com HTTP 403. */
  targetUserId?: string;
  reason?: string;
  rectification?: RectificationPayload;
}

export interface DataSubjectRequestRecord {
  protocolNumber: string;
  userId: string;
  type: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  createdAt: string;
  completedAt: string;
  confirmationSummary?: {
    processingExists: boolean;
    activePurposes: string[];
    categories: string[];
  };
  accessExport?: {
    profile: UserPrivacyProfile;
    mandatoryFiscalRecords: MandatoryFiscalRecord[];
  };
  eliminatedCategories?: string[];
  legalRetention?: LegalRetentionSummary;
}
