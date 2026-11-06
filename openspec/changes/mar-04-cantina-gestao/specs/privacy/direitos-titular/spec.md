# Spec Delta: Atendimento aos Direitos do Titular (LGPD)

## Purpose
Processar solicitações autenticadas de acesso, correção e eliminação de dados pessoais com número de protocolo e respeito às obrigações legais de retenção.

## ADDED Requirements

### Requirement: Solicitação autenticada de acesso, correção e eliminação
O sistema DEVE permitir que apenas o próprio titular autenticado abra protocolo de acesso, retificação ou eliminação de dados dispensáveis.

#### Scenario: Eliminação de dados dispensáveis preservando histórico fiscal obrigatório
- **WHEN** titular solicita eliminação de seus dados pessoais possuindo compras financeiras registradas
- **THEN** sistema gera protocolo, elimina dados opcionais dispensáveis e conserva os registros transacionais obrigatórios com justificativa legal

## Acceptance Criteria
- **AC-7.** Direitos do titular rejeitam solicitação de outra conta, eliminam dados dispensáveis e conservam registros obrigatórios com protocolo.
  @test:tests/privacy/direitos-titular.test.ts
