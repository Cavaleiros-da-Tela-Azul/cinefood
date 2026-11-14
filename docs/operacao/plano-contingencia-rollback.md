# Plano de Contingência e Ensaio de Rollback (`MAR-06`)

- **Issue:** `#24` (`[MAR-06][RELEASE]`)
- **Referência Técnica:** `openspec/changes/mar-06-transicao-operacao/design.md` (Seções 4.3, 5.4.4, 5.5.1)
- **Objetivo:** Garantir reversão controlada de versão da aplicação (`rollback`) sem perda nem sobrescrita de compras confirmadas, ingressos emitidos ou pedidos da cantina registrados no PostgreSQL.

---

## 1. Critérios de Acionamento de Contingência

Acionar imediatamente o procedimento de contenção/rollback se qualquer uma das condições abaixo ocorrer após implantação ou atualização na unidade piloto:

1. Falha no *smoke test* pós-implantação (`npm test` / `tests/operations/smoke-piloto.test.ts`);
2. Indicação de desvio na trava Sandbox `RST-03` (`GET /operations/health` retornando `403` ou `503`);
3. Erro crítico em consumo atômico de QR Code na portaria, reserva concorrente de poltrona ou baixa de estoque da cantina;
4. Degradação sustentada de latência (`p95 > 2000 ms` contra meta `RNF-01`).

---

## 2. Procedimento de Contenção Seletiva (`5.5.1`)

1. **Preservar transações válidas:** Nunca abortar manualmente ingressos ou pedidos já liquidados (`APROVADO`);
2. **Isolar apenas o fluxo afetado:**
   - Se a falha estiver na fila de entrega da cantina, converter despacho pendente para atendimento no balcão (`RETIRADA_NO_BALCAO`);
   - Se a falha estiver no checkout Web/Mobile, manter Bilheteria Assistida (`OPERADOR_BILHETERIA`) operando sobre a mesma trava única de assentos (`ADR-002`);
   - Em divergência financeira de fechamento, acionar imediatamente `reconcileShiftClosing` para identificar o pedido exato.

---

## 3. Execução de Rollback de Aplicação Sem Corrupção de Banco

> **Princípio Fundamental (`ADR-002` / `MAR-06`):** O rollback reverte o binário/artefato da aplicação para a versão estável anterior (`v1.0.0-rc.1` -> versão prévia) mantendo o esquema e os registros transacionais do PostgreSQL intactos (*forward-compatible schema*).

### Passo a Passo Validado
1. **Congelar novas sessões de checkout Web** (modo manutenção breve `< 2 min` na borda HTTP);
2. **Reverter deploy da aplicação** (build Node + bundle `web/dist` da tag anterior):
   ```bash
   git fetch --tags origin
   git checkout <TAG_ESTAVEL_ANTERIOR>
   npm --prefix web run build
   ```
3. **Executar verificação sanitária no banco existente (sem DROP/TRUNCATE):**
   - Rodar `npm test` (`39/39`) e `npm run check:spec` no artefato revertido;
   - Verificar `GET /operations/health` confirmando `status: READY` e `sandboxLocked: true`.
4. **Somente se houver necessidade de restauração de backup de banco (`4.3`):**
   - **Proibido** restaurar backup diretamente sobre a instância ativa se houver compras confirmadas posteriores ao snapshot;
   - Restaurar dump em instância de recuperação, validar checksum SHA-256 e reaplicar eventos WAL/webhooks pós-corte (`Idempotency-Key`) conforme roteiro validado em `scripts/verify-backup-restore.mjs` e `docs/testes/ensaio-backup-rpo-rto.md`;
5. **Reconciliação pós-rollback (`ADMIN_CINEMA`):**
   - Executar `reconcileShiftClosing` confirmando `discrepancyCents === 0`;
   - Reabrir checkout Web e registrar incidente no log operacional do turno.

---

## 4. Evidência de Ensaio Executado

- **Teste automatizado de contingência/reconciliação de turno:** `tests/operations/smoke-piloto.test.ts` (`AC-1` e `AC-2` aprovados);
- **Ensaio automatizado de restauração WAL sem sobrescrita:** `scripts/verify-backup-restore.mjs` (`BACKUP_RESTORE_OK`, `rpoConfirmedTransactionsLost: 0`, `walApplied: 1`, `walSkippedDuplicates: 1`).
