# Spec Delta: Transição, Prontidão Operacional e Jornada Piloto

## Purpose
Validar a transição para o ambiente piloto ou simulado por meio de verificação de saúde, jornada integrada de fumaça (smoke test) e conciliação de fechamento operacional.

## ADDED Requirements

### Requirement: Ensaio rápido de jornada integrada pós-implantação
O sistema DEVE completar sem falhas o fluxo integrado de reserva, pagamento, emissão de QR Code, validação na portaria, pedido na cantina e avaliação pós-sessão no teste de prontidão.

#### Scenario: Execução de smoke test ponta a ponta na liberação
- **WHEN** o verificador de transição executa a jornada integrada completa no ambiente preparado
- **THEN** todas as etapas transitam pelos estados esperados com consistência de saldo, assento, estoque e histórico

### Requirement: Bloqueio de cobrança real sem homologação formal
O sistema DEVE operar exclusivamente em modo sandbox e simulação enquanto a unidade piloto e o gateway não estiverem formalmente homologados.

#### Scenario: Verificação de trava de ambiente não homologado
- **WHEN** o sistema é iniciado sem flag e credenciais de homologação comercial aprovadas
- **THEN** o adaptador financeiro bloqueia cobranças reais e processa transações exclusivamente em sandbox simulado

## Acceptance Criteria
- **AC-1.** Jornada integrada ponta a ponta (smoke test) executa compra, acesso por QR, pedido na cantina e avaliação com estado consistente.
  @test:tests/operations/smoke-piloto.test.ts
- **AC-2.** Ambiente sem homologação comercial ativa mantém bloqueio de cobrança real operando estritamente em sandbox (`RST-03`).
  @test:tests/operations/smoke-piloto.test.ts
