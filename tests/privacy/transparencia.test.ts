import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPrivacyNotice, revokeMarketingPreference, setMarketingPreference } from '../../src/modules/privacy/routes.ts';
import { InMemoryPrivacyRepository } from '../../src/modules/privacy/repository.ts';
import { DefaultPrivacyService } from '../../src/modules/privacy/service.ts';
import type { PrivacyNotice } from '../../src/modules/privacy/types.ts';

const notice: PrivacyNotice = {
  version: '2026-01',
  effectiveAt: new Date('2026-01-01T00:00:00.000Z'),
  purposes: ['Criar e gerenciar a conta', 'Processar compras de ingressos e alimentos'],
  legalBases: ['Execução de contrato', 'Consentimento para comunicações promocionais'],
  sharing: ['Dados de compra são compartilhados com os cinemas para prestar o serviço'],
  retention: 'Dados são mantidos pelo prazo necessário às finalidades e obrigações legais.',
  dataSubjectChannel: 'encarregado@cinefood.example',
};

function createService() {
  const repository = new InMemoryPrivacyRepository(notice);
  let currentTime = new Date('2026-02-01T12:00:00.000Z');
  const service = new DefaultPrivacyService(repository, () => new Date(currentTime.getTime()));
  return {
    repository,
    service,
    setCurrentTime(value: string) {
      currentTime = new Date(value);
    },
  };
}

describe('Privacidade e LGPD (RF-17 / AC-5, AC-6)', () => {
  it('AC-5: disponibiliza aviso versionado com finalidades, bases legais, compartilhamentos, retenção e canal do titular', async () => {
    const { service } = createService();
    const result = await getPrivacyNotice(service);

    assert.equal(result.status, 200);
    assert.equal(result.body.version, '2026-01');
    assert.equal(result.body.effectiveAt.toISOString(), '2026-01-01T00:00:00.000Z');
    assert.ok(result.body.purposes.length > 0);
    assert.ok(result.body.legalBases.length > 0);
    assert.ok(result.body.sharing.length > 0);
    assert.ok(result.body.retention.trim().length > 0);
    assert.ok(result.body.dataSubjectChannel.trim().length > 0);
  });

  it('rejeita aviso sem versão ou informações obrigatórias de transparência', () => {
    assert.throws(
      () => new InMemoryPrivacyRepository({ ...notice, purposes: [] }),
      /exige finalidades, bases legais e informações de compartilhamento/,
    );
    assert.throws(
      () => new InMemoryPrivacyRepository({ ...notice, version: ' ' }),
      /exige versão, retenção e canal do titular/,
    );
  });

  it('AC-6: persiste a recusa promocional e permite concluir a compra', async () => {
    const { repository, service } = createService();
    const result = await setMarketingPreference(service, 'user-1', false);

    assert.equal(result.body.granted, false);
    assert.equal(result.body.noticeVersion, notice.version);
    assert.equal(result.body.recordedAt.toISOString(), '2026-02-01T12:00:00.000Z');
    assert.equal(await service.isMarketingAllowed('user-1'), false);
    assert.equal(await service.canProceedWithPurchase('user-1'), true);

    const history = await repository.listConsentHistory('user-1');
    assert.equal(history.length, 1);
    assert.equal(history[0].granted, false);
  });

  it('aplica revogação imediatamente e mantém todas as manifestações para auditoria', async () => {
    const { repository, service, setCurrentTime } = createService();
    await setMarketingPreference(service, 'user-2', true);
    assert.equal(await service.isMarketingAllowed('user-2'), true);

    setCurrentTime('2026-02-02T09:30:00.000Z');
    const result = await revokeMarketingPreference(service, 'user-2');

    assert.equal(result.body.granted, false);
    assert.equal(result.body.revokedAt?.toISOString(), '2026-02-02T09:30:00.000Z');
    assert.equal(await service.isMarketingAllowed('user-2'), false);
    assert.equal(await service.canProceedWithPurchase('user-2'), true);
    assert.equal((await repository.listConsentHistory('user-2')).length, 2);
  });
});
