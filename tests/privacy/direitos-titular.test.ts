import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryPrivacyRepository } from '../../src/modules/privacy/repository.ts';
import { DefaultPrivacyService } from '../../src/modules/privacy/service.ts';
import {
  getDataSubjectRequestByProtocol,
  getDataSubjectRequests,
  postDataSubjectRequest,
} from '../../src/modules/privacy/routes.ts';
import type { PrivacyNotice } from '../../src/modules/privacy/types.ts';
import type { AuthenticatedSession } from '../../src/modules/identity/types.ts';

const notice: PrivacyNotice = {
  version: '2026-01',
  effectiveAt: new Date('2026-01-01T00:00:00.000Z'),
  purposes: ['Gerenciamento de conta', 'Processamento fiscal de compras'],
  legalBases: ['Execução de contrato', 'Obrigação legal fiscal (art. 16 LGPD)'],
  sharing: ['Emissão de notas fiscais e operação do cinema'],
  retention: 'Registros fiscais retidos pelo prazo legal tributário (5 anos).',
  dataSubjectChannel: 'dpo@cinefood.test',
};

function sessionFor(userId: string, role: AuthenticatedSession['role'] = 'CLIENTE'): AuthenticatedSession {
  return {
    userId,
    email: `${userId}@cinefood.test`,
    role,
    iat: 1_700_000_000,
    exp: 1_800_000_000,
  };
}

describe('Direitos do Titular LGPD (RF-18 / MAR-04)', () => {
  it('AC-7: rejeita solicitação de outra conta, elimina dados dispensáveis e conserva registros obrigatórios com protocolo', async () => {
    const repo = new InMemoryPrivacyRepository(notice);
    const service = new DefaultPrivacyService(
      repo,
      () => new Date('2026-11-20T15:30:00.000Z'),
    );

    const alice = sessionFor('usr_alice', 'CLIENTE');
    const bob = sessionFor('usr_bob', 'CLIENTE');

    await repo.upsertUserProfile({
      userId: 'usr_alice',
      fullName: 'Alice Silva',
      email: 'alice@cinefood.test',
      phone: '+55 11 99999-0001',
      nickname: 'Ali',
      optionalPreferences: {
        favoriteGenres: ['Ficção Científica', 'Animação'],
        marketingOptIn: true,
        newsletterSubscribed: true,
      },
      cookieConsents: ['analytics_v1', 'marketing_retargeting'],
      browsingHistory: ['Duna Parte II', 'Interestelar'],
    });
    await service.recordMarketingPreference('usr_alice', true);
    await repo.saveMandatoryFiscalRecord({
      recordId: 'fisc_1',
      purchaseId: 'pur_alice_100',
      userId: 'usr_alice',
      invoiceNumber: 'NF-2026-000100',
      amountCents: 6800,
      recordedAt: '2026-11-10T20:00:00.000Z',
      legalBasis: 'Obrigação fiscal e contábil (5 anos)',
    });

    await repo.upsertUserProfile({
      userId: 'usr_bob',
      fullName: 'Bob Souza',
      email: 'bob@cinefood.test',
      optionalPreferences: {
        favoriteGenres: ['Ação'],
        marketingOptIn: false,
        newsletterSubscribed: false,
      },
      cookieConsents: [],
      browsingHistory: [],
    });

    // 1. Segurança / RBAC: Bob NÃO pode abrir solicitação LGPD nem consultar protocolo de Alice
    const crossAccountCreate = await postDataSubjectRequest(service, bob, {
      type: 'ACESSO',
      targetUserId: 'usr_alice',
    });
    assert.equal(crossAccountCreate.status, 403);

    const crossAccountList = await getDataSubjectRequests(service, bob, 'usr_alice');
    assert.equal(crossAccountList.status, 403);

    // 2. Confirmação e Acesso pelo próprio titular geram protocolos alfanuméricos únicos
    const confirmRes = await postDataSubjectRequest(service, alice, { type: 'CONFIRMACAO' });
    assert.equal(confirmRes.status, 201);
    assert.ok('protocolNumber' in confirmRes.body);
    assert.match(confirmRes.body.protocolNumber, /^LGPD-2026-[A-F0-9]{8}$/);
    assert.equal(confirmRes.body.confirmationSummary?.processingExists, true);

    const accessRes = await postDataSubjectRequest(service, alice, { type: 'ACESSO' });
    assert.equal(accessRes.status, 201);
    assert.ok('protocolNumber' in accessRes.body);
    assert.notEqual(accessRes.body.protocolNumber, confirmRes.body.protocolNumber);
    assert.equal(accessRes.body.accessExport?.profile.fullName, 'Alice Silva');
    assert.equal(accessRes.body.accessExport?.mandatoryFiscalRecords.length, 1);

    // Consulta de protocolo por terceiro é bloqueada (HTTP 403)
    const crossProtocolLookup = await getDataSubjectRequestByProtocol(
      service,
      bob,
      accessRes.body.protocolNumber,
    );
    assert.equal(crossProtocolLookup.status, 403);

    // 3. Retificação cadastral atualiza dados mutáveis
    const rectRes = await postDataSubjectRequest(service, alice, {
      type: 'RETIFICACAO',
      rectification: { fullName: 'Alice M. Silva' },
    });
    assert.equal(rectRes.status, 201);
    assert.ok('accessExport' in rectRes.body);
    assert.equal(rectRes.body.accessExport?.profile.fullName, 'Alice M. Silva');

    // 4. Eliminação seletiva com conservação legal obrigatória (Art. 16 LGPD)
    const eraseRes = await postDataSubjectRequest(service, alice, {
      type: 'ELIMINACAO',
      reason: 'Não desejo mais receber comunicações ou manter dados de navegação.',
    });
    assert.equal(eraseRes.status, 201);
    assert.ok('protocolNumber' in eraseRes.body);
    assert.match(eraseRes.body.protocolNumber, /^LGPD-2026-[A-F0-9]{8}$/);
    assert.equal(eraseRes.body.status, 'CONCLUIDA_COM_RETENCAO_LEGAL');
    assert.ok(eraseRes.body.eliminatedCategories && eraseRes.body.eliminatedCategories.length >= 4);
    assert.deepEqual(eraseRes.body.legalRetention?.retainedRecordIds, ['fisc_1']);
    assert.match(eraseRes.body.legalRetention?.legalBasis ?? '', /art\. 16/i);

    // Verifica persistência: dados opcionais eliminados + marketing revogado + registro fiscal intacto
    const profileAfterErasure = await repo.findUserProfile('usr_alice');
    assert.ok(profileAfterErasure);
    assert.equal(profileAfterErasure.fullName, 'Titular Anonimizado');
    assert.equal(profileAfterErasure.email, 'anon-usr_alice@redacted.invalid');
    assert.equal(profileAfterErasure.phone, undefined);
    assert.equal(profileAfterErasure.nickname, undefined);
    assert.deepEqual(profileAfterErasure.optionalPreferences.favoriteGenres, []);
    assert.equal(profileAfterErasure.optionalPreferences.marketingOptIn, false);
    assert.deepEqual(profileAfterErasure.cookieConsents, []);
    assert.deepEqual(profileAfterErasure.browsingHistory, []);
    assert.ok(profileAfterErasure.anonymizedAt);
    assert.equal(await service.isMarketingAllowed('usr_alice'), false);

    const fiscalAfterErasure = await repo.listMandatoryFiscalRecords('usr_alice');
    assert.equal(fiscalAfterErasure.length, 1);
    assert.equal(fiscalAfterErasure[0].invoiceNumber, 'NF-2026-000100');
    assert.equal(fiscalAfterErasure[0].amountCents, 6800);

    // Próprio titular consulta protocolo de eliminação com sucesso
    const protocolLookup = await getDataSubjectRequestByProtocol(
      service,
      alice,
      eraseRes.body.protocolNumber,
    );
    assert.equal(protocolLookup.status, 200);
    assert.ok('protocolNumber' in protocolLookup.body);
    assert.equal(protocolLookup.body.protocolNumber, eraseRes.body.protocolNumber);
  });
});
