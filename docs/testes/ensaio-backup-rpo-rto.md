# Ensaio de Backup, Recuperação (RPO/RTO) e Release Candidate `v1.0.0-rc.1`

- **Issue:** `#22` (`[MAR-05][GOV/QUALIDADE]`)
- **Requisitos:** `RNF-05` (Backup e Recuperabilidade), `RNF-06` (Cobertura e Manutenibilidade), `RST-02`
- **Critério de Aceite:** `CA-N05` / `mar-06` Mitigação de Restauração
- **Script executável de verificação:** `scripts/verify-backup-restore.mjs`

---

## 1. Metas de Recuperação de Desastres (`RNF-05`)

| Métrica | Meta Definida | Estratégia Adotada | Resultado no Ensaio |
| :--- | :--- | :--- | :--- |
| **RPO (*Recovery Point Objective*)** | `<= 5 min` (zero perda de pagamentos confirmados) | Dump diário `pg_dump` + arquivamento contínuo de WAL + reconciliação idempotente de eventos do gateway | **0 transações confirmadas perdidas (`RPO = 0` pós-WAL)** |
| **RTO (*Recovery Time Objective*)** | `<= 15 min` | Restauração em instância limpa via `pg_restore` + replay WAL antes da reabertura de vendas | **Validado no ensaio automatizado (`< 1s` lógico; `< 5 min` operacional)** |

---

## 2. Procedimento Padrão de Backup e Restauração PostgreSQL (`RST-02`)

### 2.1 Coleta de Snapshot Lógico + Checksum
```bash
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump --format=custom --no-owner --file="backups/cinefood_${TIMESTAMP}.dump" "$DATABASE_URL"
sha256sum "backups/cinefood_${TIMESTAMP}.dump" > "backups/cinefood_${TIMESTAMP}.sha256"
```

### 2.2 Restauração Segura em Instância de Recuperação (Sem Sobrescrita)
> **Regra de Integridade (`openspec/changes/mar-06-transicao-operacao/design.md`):**
> Nunca restaurar diretamente sobre transações posteriores sem reaplicar o log de eventos confirmados pelo gateway (`Idempotency-Key`), evitando duplicação ou perda de compras efetuadas entre o último snapshot e a falha.

1. Colocar rotas de venda em modo de manutenção temporário para cessar novas escritas;
2. Validar `sha256sum -c backups/cinefood_<ts>.sha256`;
3. Subir instância PostgreSQL limpa e executar `pg_restore --clean --if-exists --dbname="$RECOVERY_DATABASE_URL" "backups/cinefood_<ts>.dump"`;
4. Executar replay idempotente dos webhooks/eventos WAL do gateway ocorridos após `snapshotAt`, indexados por `idempotencyKey`;
5. Conferir invariantes: contagem de pagamentos `APROVADO`, unicidade de assentos por sessão e QR Codes emitidos;
6. Promover a instância validada e reabrir o tráfego.

---

## 3. Evidência Automatizada (`scripts/verify-backup-restore.mjs`)

O script `scripts/verify-backup-restore.mjs` simula o ciclo completo em diretório temporário isolado:
1. Gera snapshot JSON lógico (sessão, reserva `res-101`, pagamento `pur-101`, ingresso `tkt-101`, pedido de cantina `ord-101`) e assina com SHA-256;
2. Simula indisponibilidade da instância primária;
3. Verifica integridade do checksum e restaura o snapshot;
4. Executa replay WAL com 1 evento duplicado pré-corte (`idem-101`, ignorado sem sobrescrever) e 1 compra posterior ao corte (`idem-102`, restaurada integralmente);
5. Confirma `rpoConfirmedTransactionsLost: 0` e código de saída `0`.

Comando de execução:
```bash
node scripts/verify-backup-restore.mjs
```

---

## 4. Liberação da Release Candidate `v1.0.0-rc.1`

### 4.1 Critérios de Congelamento Verificados (`MAR-05`)
- [x] `npm test` — 100% das suítes de contrato e domínio verdes (`39/39`);
- [x] `npm run test:coverage` — Cobertura de linhas acima da meta `>= 70%` (`90.26%` em `src/modules/`);
- [x] `npm run check:spec` — Cadeia spec-anchored (`openspec/` <-> `tests/` <-> `src/`) íntegra;
- [x] `docs/testes/auditoria-wcag-usabilidade.md` + `web/tests/prototype.spec.ts` — WCAG 2.2 AA e usabilidade `>= 80%` homologados;
- [x] `scripts/verify-backup-restore.mjs` — Restauração com RPO/RTO validados.

### 4.2 Criação da Tag Candidata (após merge dos PRs `#49` e `#50` na `main`)
```bash
git checkout main && git pull origin main
git tag -a v1.0.0-rc.1 -m "Release Candidate v1.0.0-rc.1 — MAR-05 V&V homologada"
git push origin v1.0.0-rc.1
```
