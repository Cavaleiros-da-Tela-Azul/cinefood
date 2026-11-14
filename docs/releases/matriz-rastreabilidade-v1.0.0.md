# Matriz de Rastreabilidade Completa — CineFood MVP `v1.0.0`

- **Issue:** `#24` (`[MAR-06][RELEASE]`)
- **Spec Guard:** `scripts/spec-guard.py` (`✅ Contrato íntegro`)
- **Cobertura:** 100% dos 18 Requisitos Funcionais (`RF-01`..`RF-18` + `RF-20`), 6 RNFs (`RNF-01`..`RNF-06`), 4 Restrições (`RST-01`..`RST-04`) e 5 ADRs (`ADR-001`..`ADR-005`).

---

## 1. Requisitos Funcionais (`RF-01` a `RF-18`, `RF-20`)

| ID | Requisito Funcional | OpenSpec Change | Módulos de Implementação | Suítes de Teste / Evidência |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Autenticação e Controle de Acesso (RBAC 5 papéis) | `mar-01-fundamentos` | `src/modules/identity/{rbac,routes,types}.ts` | `tests/identity/auth.test.ts`, `tests/identity/rbac.test.ts` |
| **RF-02** | Catálogo de Sessões e Mapa de Assentos (96 poltronas, PCD 1.5×) | `mar-01-fundamentos`, `catalogo-e-ux-sessoes` | `src/modules/catalog/{repository,service,routes,types}.ts`, `web/src/components/{HeroCatalogView,MovieDetailView,SeatSelectionView}.tsx` | `tests/catalog/programacao.test.ts`, `tests/catalog/assentos.test.ts`, `web/tests/prototype.spec.ts` (Testes 1, 2, 4) |
| **RF-03** | Trava Temporária Concorrente de Assento (10 min) | `mar-02-ingressos-reserva` | `src/modules/booking/{repository,service,routes,types}.ts` | `tests/booking/reserva.test.ts` |
| **RF-04** | Checkout Idempotente e Compensação Pix Tardio (`RN-01`) | `mar-02-ingressos-reserva` | `src/modules/payments/{gateway,repository,service,routes,types}.ts` | `tests/payments/checkout.test.ts` |
| **RF-05** | Emissão de Ingressos Individuais com QR Code Opaco | `mar-03-acesso-historico` | `src/modules/tickets/{repository,service,routes,types}.ts` | `tests/tickets/qrcode.test.ts` |
| **RF-06** | Validação e Consumo Atômico na Portaria (`RN-02`) | `mar-03-acesso-historico` | `src/modules/tickets/{repository,service,routes}.ts`, `web/src/components/GateScannerView.tsx` | `tests/tickets/qrcode.test.ts`, `web/tests/prototype.spec.ts` (Teste 6) |
| **RF-07** | Cardápio de Cantina, Combos, Adicionais e Recálculo no Servidor | `mar-04-cantina-gestao`, `alinhamento-mvp-ux-catalogo-cantina` | `src/modules/canteen/{repository,service,routes,types}.ts`, `web/src/components/{CanteenSheet,CanteenCatalogView}.tsx` | `tests/canteen/estoque.test.ts`, `web/tests/prototype.spec.ts` (Teste 3) |
| **RF-08** | Baixa Atômica Condicional de Estoque sem Saldo Negativo | `mar-04-cantina-gestao` | `src/modules/canteen/{repository,service}.ts` | `tests/canteen/estoque.test.ts` |
| **RF-09** | Painel KDS e Ciclo de Preparo até Entrega no Assento / Balcão | `mar-04-cantina-gestao` | `src/modules/canteen/{service,routes}.ts`, `web/src/components/KdsRunnerView.tsx` | `tests/canteen/entrega.test.ts`, `web/tests/prototype.spec.ts` (Teste 6) |
| **RF-10** | Administração de Filmes, Salas, Sessões e Preços (`ADMIN_CINEMA`) | `mar-04-cantina-gestao` | `src/modules/management/{repository,service,routes,types}.ts`, `web/src/components/AdminOccupancyView.tsx` | `tests/management/ocupacao-estorno.test.ts`, `web/tests/prototype.spec.ts` (Teste 6) |
| **RF-11** | Histórico Privado Consolidado do Titular e Avisos Internos | `mar-03-acesso-historico` | `src/modules/history/{repository,service,routes,types}.ts`, `web/src/components/ClientOrdersView.tsx` | `tests/history/avaliacao.test.ts`, `web/tests/prototype.spec.ts` (Teste 2) |
| **RF-12** | Arrependimento CDC (7 dias) e Janela de 2h antes da Sessão (`RN-04`) | `mar-04-cantina-gestao` | `src/modules/management/{cdc-cancellation,routes}.ts` | `tests/management/ocupacao-estorno.test.ts`, `web/tests/prototype.spec.ts` (Teste 2) |
| **RF-13** | Avaliação Pós-Sessão Verificada (1..5 estrelas após portaria + fim) | `mar-03-acesso-historico` | `src/modules/history/{service,routes}.ts`, `web/src/components/CommunityReviewsView.tsx` | `tests/history/avaliacao.test.ts`, `web/tests/prototype.spec.ts` (Teste 4) |
| **RF-14** | Venda Assistida em Bilheteria com Operador Identificado | `mar-02-ingressos-reserva` | `src/modules/booking/{service,routes}.ts`, `web/src/components/BoxOfficeView.tsx` | `tests/booking/venda-assistida.test.ts`, `web/tests/prototype.spec.ts` (Teste 6) |
| **RF-15** | Relatório Gerencial de Ocupação Real (`%` sobre ativos) | `mar-04-cantina-gestao` | `src/modules/management/{service,routes}.ts` | `tests/management/ocupacao-estorno.test.ts` |
| **RF-16** | Categorias de Meia-Entrada e Documento Comprobatório Obrigatório | `mar-02-ingressos-reserva` | `src/modules/booking/service.ts`, `web/src/components/{SeatSelectionView,BoxOfficeView}.tsx` | `tests/booking/venda-assistida.test.ts`, `web/tests/prototype.spec.ts` (Testes 2, 6) |
| **RF-17** | Aviso Versionado de Privacidade LGPD e Opt-in Promocional Granular | `mar-01-fundamentos` | `src/modules/privacy/{repository,service,routes,types}.ts`, `web/src/components/AuthView.tsx` | `tests/privacy/transparencia.test.ts`, `web/tests/prototype.spec.ts` (Teste 5) |
| **RF-18** | Direitos do Titular LGPD (Confirmação, Acesso, Retificação, Eliminação c/ Retenção Legal) | `mar-04-cantina-gestao` | `src/modules/privacy/{service,routes}.ts`, `web/src/components/AuthView.tsx` | `tests/privacy/direitos-titular.test.ts`, `web/tests/prototype.spec.ts` (Teste 5) |
| **RF-20** | Ocorrência de Runner em Sala Escura (`RETIRADA_NO_BALCAO` / `RN-03`) | `mar-04-cantina-gestao` | `src/modules/canteen/service.ts`, `web/src/components/KdsRunnerView.tsx` | `tests/canteen/entrega.test.ts`, `web/tests/prototype.spec.ts` (Teste 6) |

---

## 2. Requisitos Não Funcionais (`RNF-01` a `RNF-06`)

| ID | Requisito Não Funcional | Meta | Evidência / Teste Automatizado |
| :--- | :--- | :--- | :--- |
| **RNF-01** | Desempenho sob Carga Concorrente | `p95 <= 2000 ms` | `tests/quality/rnf-integridade.test.ts` (`AC-1`: 100 ops internas + 100 validações QR com 20 workers concorrentes) |
| **RNF-02** | Segurança, RBAC/IDOR, Sigilo PAN/CVV e Assinatura HMAC | Zero vazamento / HTTP 403 | `tests/quality/rnf-integridade.test.ts` (`AC-2`), `tests/identity/rbac.test.ts`, `tests/payments/checkout.test.ts` |
| **RNF-03** | Integridade Transacional Absoluta sob Disputa | 0 venda dupla / estoque < 0 / reuso QR | `tests/quality/rnf-integridade.test.ts` (`AC-2`), `tests/booking/reserva.test.ts`, `tests/canteen/estoque.test.ts`, `tests/tickets/qrcode.test.ts` |
| **RNF-04** | Usabilidade e Acessibilidade WCAG 2.2 AA | `>= 80%` conclusão sem ajuda + contraste `>= 4.5:1` | `docs/testes/auditoria-wcag-usabilidade.md`, `web/tests/prototype.spec.ts` (Teste 9) |
| **RNF-05** | Backup e Recuperabilidade (RPO/RTO + WAL replay) | `RPO = 0` pós-WAL / `RTO <= 15 min` | `docs/testes/ensaio-backup-rpo-rto.md`, `scripts/verify-backup-restore.mjs` |
| **RNF-06** | Qualidade de Código, Cobertura e Cadeia de Contrato | Cobertura `>= 70%` (`90.26%` atingido) | `npm run test:coverage` + `npm run check:spec` (`scripts/spec-guard.py`) |

---

## 3. Restrições Arquiteturais (`RST-01` a `RST-04`) e ADRs (`ADR-001` a `ADR-005`)

| Código | Descrição | Onde Está Enforçado e Validado |
| :--- | :--- | :--- |
| **RST-01** | Escopo em Unidade Piloto Única | `src/modules/operations/service.ts`, `tests/operations/smoke-piloto.test.ts`, `docs/operacao/checklist-prontidao-piloto.md` |
| **RST-02** | API Centralizada Única em Monólito Modular | `src/modules/*`, `scripts/spec-guard.py`, `docs/testes/ensaio-backup-rpo-rto.md` |
| **RST-03** | Operação Estrita em Sandbox Sem Homologação Comercial | `src/modules/payments/gateway.ts`, `src/modules/operations/{service,routes}.ts`, `tests/operations/smoke-piloto.test.ts` (`AC-2`) |
| **RST-04** | Entrega no Assento Condicionada à Portaria (`RN-02`) | `src/modules/canteen/service.ts` (`assertSeatDeliveryAuthorized`), `tests/canteen/entrega.test.ts` (`AC-3`) |
| **ADR-001** | Monólito Modular Orientado a Contratos (*Spec-Anchored*) | `openspec/changes/*`, `scripts/spec-guard.py`, `src/modules/*` |
| **ADR-002** | Lock Atômico Transacional Unificado de Assentos e Estoque | `src/modules/booking/repository.ts`, `src/modules/canteen/repository.ts`, `tests/quality/rnf-integridade.test.ts` |
| **ADR-003** | Gateway Sandbox + Idempotência + Webhook HMAC-SHA256 | `src/modules/payments/{gateway,service,routes}.ts`, `tests/payments/checkout.test.ts` |
| **ADR-004** | Tokens Opacos HMAC/CSPRNG para QR Code de Uso Único | `src/modules/tickets/{service,repository}.ts`, `tests/tickets/qrcode.test.ts` |
| **ADR-005** | Cantina Autônoma (Balcão) + Esteira Guiada Pós-Ingresso (`RN-05`) | `src/modules/canteen/service.ts`, `web/src/components/{CanteenCatalogView,TicketPassView}.tsx`, `web/tests/prototype.spec.ts` (Testes 3, 8) |
