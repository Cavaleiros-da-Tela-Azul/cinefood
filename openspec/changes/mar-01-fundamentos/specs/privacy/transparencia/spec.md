# Spec Delta: Transparência e Privacidade LGPD

## Purpose
Disponibilização do aviso de privacidade institucional, finalidades do tratamento de dados pessoais e gestão de preferências de consentimento conforme a LGPD.

## ADDED Requirements

### Requirement: Exibição do aviso de privacidade e finalidades
O sistema DEVE apresentar ao usuário os termos de privacidade, bases legais aplicáveis e canais de contato com o encarregado antes da coleta final de dados cadastrais.

#### Scenario: Visualização do aviso de privacidade
- **WHEN** usuário acessa o fluxo de cadastro ou configurações de privacidade
- **THEN** sistema exibe a versão vigente do aviso de privacidade com finalidades de tratamento e retenção

### Requirement: Gestão de consentimento facultativo
O sistema DEVE permitir ao usuário optar livremente por comunicações de marketing sem que a recusa impeça o uso dos serviços essenciais de compra de ingressos.

#### Scenario: Recusa de consentimento opcional não bloqueia o serviço
- **WHEN** usuário desmarca ou recusa o consentimento para comunicações promocionais
- **THEN** sistema registra a preferência e permite normalmente a conclusão do cadastro e das compras

## Acceptance Criteria
- **AC-5.** Aviso de privacidade disponível com registro de versão e dados obrigatórios de finalidade.
  @test:tests/privacy/transparencia.test.ts
- **AC-6.** Recusa de opção facultativa é persistida sem inviabilizar o fluxo principal de compra.
  @test:tests/privacy/transparencia.test.ts
