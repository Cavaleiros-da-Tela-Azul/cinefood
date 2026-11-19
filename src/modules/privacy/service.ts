import { randomBytes } from 'node:crypto';
import { authenticatedUserId, authorize } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import type { PrivacyRepository } from './repository.ts';
import type {
  ConsentRecord,
  DataSubjectRequestRecord,
  PrivacyNotice,
  SubmitDataSubjectRequestInput,
  UserPrivacyProfile,
} from './types.ts';

export class InvalidDataSubjectRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDataSubjectRequestError';
  }
}

export class DataSubjectProfileNotFoundError extends Error {
  constructor(userId: string) {
    super(`Perfil de titular ${userId} não encontrado.`);
    this.name = 'DataSubjectProfileNotFoundError';
  }
}

export class DataSubjectProtocolNotFoundError extends Error {
  constructor(protocolNumber: string) {
    super(`Protocolo LGPD ${protocolNumber} não encontrado.`);
    this.name = 'DataSubjectProtocolNotFoundError';
  }
}

export interface PrivacyService {
  getCurrentNotice(): Promise<PrivacyNotice>;
  recordMarketingPreference(userId: string, granted: boolean): Promise<ConsentRecord>;
  revokeMarketingConsent(userId: string): Promise<ConsentRecord>;
  isMarketingAllowed(userId: string): Promise<boolean>;
  canProceedWithPurchase(userId: string): Promise<boolean>;
  submitDataSubjectRequest(
    session: AuthenticatedSession,
    input: SubmitDataSubjectRequestInput,
  ): Promise<DataSubjectRequestRecord>;
  getDataSubjectRequestByProtocol(
    session: AuthenticatedSession,
    protocolNumber: string,
  ): Promise<DataSubjectRequestRecord>;
  listDataSubjectRequests(
    session: AuthenticatedSession,
    targetUserId?: string,
  ): Promise<DataSubjectRequestRecord[]>;
}

const LEGAL_RETENTION_BASIS =
  'Conservação obrigatória para cumprimento de obrigação legal e regulatória (art. 16, I da LGPD c/c guarda fiscal e contábil de 5 anos — CTN/RFB).';

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

  private generateProtocolNumber(nowDate: Date): string {
    const year = nowDate.getUTCFullYear();
    const suffix = randomBytes(4).toString('hex').toUpperCase();
    return `LGPD-${year}-${suffix}`;
  }

  /**
   * Atende aos Direitos do Titular previstos no art. 18 da LGPD (RF-18 / AC-7):
   * - Exige titular autenticado (rejeita targetUserId de terceiro com HTTP 403);
   * - Gera protocolo alfanumérico único;
   * - Executa confirmação, acesso, retificação ou eliminação seletiva com retenção legal/fiscal.
   */
  async submitDataSubjectRequest(
    session: AuthenticatedSession,
    input: SubmitDataSubjectRequestInput,
  ): Promise<DataSubjectRequestRecord> {
    const effectiveUserId = input.targetUserId ?? authenticatedUserId(session);
    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: effectiveUserId,
    });

    const profile = await this.repository.findUserProfile(effectiveUserId);
    if (!profile) {
      throw new DataSubjectProfileNotFoundError(effectiveUserId);
    }

    const nowDate = this.now();
    const timestamp = nowDate.toISOString();
    const protocolNumber = this.generateProtocolNumber(nowDate);
    const fiscalRecords = await this.repository.listMandatoryFiscalRecords(effectiveUserId);

    if (input.type === 'CONFIRMACAO') {
      const notice = await this.repository.getCurrentNotice();
      const record: DataSubjectRequestRecord = {
        protocolNumber,
        userId: effectiveUserId,
        type: 'CONFIRMACAO',
        status: 'CONCLUIDA',
        createdAt: timestamp,
        completedAt: timestamp,
        confirmationSummary: {
          processingExists: true,
          activePurposes: [...notice.purposes],
          categories: [
            'Dados cadastrais',
            'Preferências opcionais e cookies',
            ...(fiscalRecords.length > 0 ? ['Registros financeiros e fiscais'] : []),
          ],
        },
      };
      return this.repository.saveDataSubjectRequest(record);
    }

    if (input.type === 'ACESSO') {
      const record: DataSubjectRequestRecord = {
        protocolNumber,
        userId: effectiveUserId,
        type: 'ACESSO',
        status: 'CONCLUIDA',
        createdAt: timestamp,
        completedAt: timestamp,
        accessExport: {
          profile,
          mandatoryFiscalRecords: fiscalRecords,
        },
      };
      return this.repository.saveDataSubjectRequest(record);
    }

    if (input.type === 'RETIFICACAO') {
      const patch = input.rectification;
      if (
        !patch ||
        (patch.fullName === undefined &&
          patch.email === undefined &&
          patch.phone === undefined &&
          patch.nickname === undefined &&
          patch.favoriteGenres === undefined)
      ) {
        throw new InvalidDataSubjectRequestError(
          'Solicitação de retificação exige ao menos um campo cadastral válido.',
        );
      }

      if (patch.fullName !== undefined && !patch.fullName.trim()) {
        throw new InvalidDataSubjectRequestError('Nome completo retificado não pode ser vazio.');
      }
      if (patch.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email.trim())) {
        throw new InvalidDataSubjectRequestError('E-mail retificado inválido.');
      }

      const updatedProfile: UserPrivacyProfile = {
        ...profile,
        ...(patch.fullName !== undefined ? { fullName: patch.fullName.trim() } : {}),
        ...(patch.email !== undefined ? { email: patch.email.trim().toLowerCase() } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone.trim() || undefined } : {}),
        ...(patch.nickname !== undefined ? { nickname: patch.nickname.trim() || undefined } : {}),
        optionalPreferences: {
          ...profile.optionalPreferences,
          ...(patch.favoriteGenres !== undefined
            ? { favoriteGenres: [...patch.favoriteGenres] }
            : {}),
        },
      };

      const savedProfile = await this.repository.upsertUserProfile(updatedProfile);
      const record: DataSubjectRequestRecord = {
        protocolNumber,
        userId: effectiveUserId,
        type: 'RETIFICACAO',
        status: 'CONCLUIDA',
        createdAt: timestamp,
        completedAt: timestamp,
        accessExport: {
          profile: savedProfile,
          mandatoryFiscalRecords: fiscalRecords,
        },
      };
      return this.repository.saveDataSubjectRequest(record);
    }

    // ELIMINACAO: elimina/anonimiza dados dispensáveis e conserva registros obrigatórios com base legal.
    await this.revokeMarketingConsent(effectiveUserId);
    const sanitizedProfile: UserPrivacyProfile = {
      ...profile,
      fullName: 'Titular Anonimizado',
      email: `anon-${effectiveUserId}@redacted.invalid`,
      phone: undefined,
      nickname: undefined,
      optionalPreferences: {
        favoriteGenres: [],
        marketingOptIn: false,
        newsletterSubscribed: false,
      },
      cookieConsents: [],
      browsingHistory: [],
      anonymizedAt: timestamp,
    };
    await this.repository.upsertUserProfile(sanitizedProfile);

    const hasMandatoryRetention = fiscalRecords.length > 0;
    const record: DataSubjectRequestRecord = {
      protocolNumber,
      userId: effectiveUserId,
      type: 'ELIMINACAO',
      status: hasMandatoryRetention ? 'CONCLUIDA_COM_RETENCAO_LEGAL' : 'CONCLUIDA',
      createdAt: timestamp,
      completedAt: timestamp,
      eliminatedCategories: [
        'Nome e e-mail identificáveis do perfil público',
        'Preferências opcionais e gêneros favoritos',
        'Consentimentos de cookies opcionais',
        'Histórico de navegação',
        'Telefone e apelido opcionais',
        'Consentimento promocional de marketing',
      ],
      ...(hasMandatoryRetention
        ? {
            legalRetention: {
              retainedRecordIds: fiscalRecords.map((item) => item.recordId),
              legalBasis: LEGAL_RETENTION_BASIS,
              lgpdArticle: 'Art. 16, I da Lei nº 13.709/2018 (LGPD)',
            },
          }
        : {}),
    };

    return this.repository.saveDataSubjectRequest(record);
  }

  async getDataSubjectRequestByProtocol(
    session: AuthenticatedSession,
    protocolNumber: string,
  ): Promise<DataSubjectRequestRecord> {
    const request = await this.repository.findDataSubjectRequestByProtocol(protocolNumber);
    if (!request) {
      throw new DataSubjectProtocolNotFoundError(protocolNumber);
    }

    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: request.userId,
    });

    return request;
  }

  async listDataSubjectRequests(
    session: AuthenticatedSession,
    targetUserId?: string,
  ): Promise<DataSubjectRequestRecord[]> {
    const effectiveUserId = targetUserId ?? authenticatedUserId(session);
    authorize({
      session,
      operation: 'CLIENT_ACCOUNT',
      resourceOwnerUserId: effectiveUserId,
    });

    return this.repository.listDataSubjectRequestsByUser(effectiveUserId);
  }
}
