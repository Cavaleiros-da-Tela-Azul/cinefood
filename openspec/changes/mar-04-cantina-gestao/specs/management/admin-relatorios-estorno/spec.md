# Spec Delta: Administração, Relatórios de Ocupação e Cancelamento CDC

## Purpose
Permitir a gestão administrativa de cadastros sem afetar compras passadas, exibir consultas de vendas e taxa de ocupação por sessão e processar cancelamentos e estornos conforme o CDC.

## ADDED Requirements

### Requirement: Proteção de compras confirmadas em alterações administrativas
O sistema DEVE garantir que alterações de preço ou cadastro realizadas pelo administrador não modifiquem compras já confirmadas nem apaguem ingressos emitidos.

#### Scenario: Alteração de preço de sessão com ingressos já vendidos
- **WHEN** administrador altera o preço da sessão após compras já terem sido confirmadas
- **THEN** sistema aplica o novo preço apenas a compras futuras mantendo inalterado o valor histórico dos ingressos emitidos

### Requirement: Cálculo da taxa de ocupação por sessão
O sistema DEVE calcular a ocupação dividindo os ingressos ativos pelos assentos comercializáveis multiplicado por 100, excluindo pendências e cancelados.

#### Scenario: Sessão com 10 assentos, 3 ingressos ativos e 1 cancelado
- **WHEN** gestor consulta a ocupação de uma sessão com 10 assentos comercializáveis, 3 ingressos ativos e 1 ingresso cancelado
- **THEN** sistema exibe exatamente 30% de ocupação

### Requirement: Cancelamento e estorno conforme CDC e janela operacional
O sistema DEVE aprovar solicitações de cancelamento dentro de 7 dias da compra até 2 horas antes da sessão para ingressos não utilizados, disparando estorno idempotente.

#### Scenario: Solicitação de cancelamento elegível e bloqueio de repetição de estorno
- **WHEN** titular solicita cancelamento dentro do prazo elegível com ingresso não utilizado
- **THEN** sistema invalida o ingresso, solicita estorno único no gateway e impede duplicidade em chamadas repetidas

## Acceptance Criteria
- **AC-5.** Mudança administrativa de preço preserva compras passadas e consulta de 10 assentos com 3 ativos e 1 cancelado retorna 30% de ocupação.
  @test:tests/management/ocupacao-estorno.test.ts
- **AC-6.** Cancelamento elegível até 2h antes da sessão realiza estorno idempotente e rejeita ingresso já utilizado na portaria.
  @test:tests/management/ocupacao-estorno.test.ts
