# Design: MAR-05 Verificação Integrada e Qualidade (RNF-01 a RNF-06)

## Context
Verificação integrada e não funcional do monólito modular (`MAR-05`) para emissão da candidata `v1.0.0-rc.1`.

## Goals / Non-Goals

**Goals:**
* Medir o percentil 95 (`p95 <= 2000 ms`) na posição teto `ceil(0.95 * N)` das amostras ordenadas de operações internas e leitura de QR Code (`CA-N01`).
* Executar ataques simulados de autorização cruzada (IDOR/RBAC bypass) e varredura de vazamento de dados sensíveis (`CA-N02`).
* Executar disparos paralelos contra reserva de poltrona, baixa da última unidade de estoque e leitura de QR Code conferindo o estado persistido no banco (`CA-N03`).
* Garantir cobertura de linhas `>= 70%` nos módulos de negócio e guia reproduzível de instalação e restauração (`CA-N05`, `CA-N06`).

**Non-Goals:**
* Adição de novas funcionalidades de negócio fora dos 18 RFs do MVP.

## Decisions

### 1. Harness de Teste de Concorrência e Latência (`CA-N01`, `CA-N03`)
* **Decisão:** Utilizar `Promise.all` com lote de requisições simultâneas e medição de alta resolução (`performance.now()`) calculando o `p95` determinístico e inspecionando invariantes do banco ao término da bateria.

## Risks / Trade-offs

* **[Risco: Falsos positivos de cobertura sem validação de regras]** → Combinar meta de cobertura `>= 70%` com asserções explícitas sobre o estado final dos dados (`4.5`).
