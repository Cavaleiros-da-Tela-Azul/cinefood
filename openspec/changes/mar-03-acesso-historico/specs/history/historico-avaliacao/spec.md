# Spec Delta: Histórico Privado e Avaliação Pós-Sessão

## Purpose
Exibir ao titular o histórico consolidado de compras, ingressos, pedidos e avisos internos, permitindo avaliação privada de 1 a 5 estrelas após o término da exibição para ingressos utilizados.

## ADDED Requirements

### Requirement: Consulta de histórico privado e avisos do titular
O sistema DEVE apresentar apenas os ingressos, pedidos e avisos pertencentes ao usuário autenticado com seus estados persistidos.

#### Scenario: Isolamento de histórico entre contas
- **WHEN** usuário autenticado consulta seu histórico de compras e pedidos
- **THEN** sistema retorna exclusivamente os registros do próprio titular e bloqueia acesso a registros de terceiros

### Requirement: Avaliação privada pós-sessão condicionada ao uso do ingresso
O sistema DEVE permitir registrar, editar ou excluir nota de 1 a 5 estrelas apenas após o fim da sessão e com ingresso próprio validado na portaria.

#### Scenario: Tentativa de avaliação antes do fim da sessão ou sem entrada validada
- **WHEN** usuário tenta avaliar sessão ainda em andamento ou cujo ingresso não teve entrada validada na portaria
- **THEN** sistema rejeita a avaliação com erro HTTP 422 Unprocessable Entity

## Acceptance Criteria
- **AC-3.** Histórico exibe estados atualizados apenas ao próprio titular e falha de aviso não corrompe pagamento.
  @test:tests/history/avaliacao.test.ts
- **AC-4.** Avaliação privada aceita apenas notas de 1 a 5 após o término da sessão para ingresso com entrada validada.
  @test:tests/history/avaliacao.test.ts
