# Spec Delta: Cardápio e Reserva Atômica de Estoque da Cantina

## Purpose
Gerenciar o cardápio de produtos, adicionais e combos com recálculo obrigatório de preços no servidor e reserva atômica de estoque sem saldo negativo.

## ADDED Requirements

### Requirement: Recálculo de carrinho da cantina no servidor
O sistema DEVE recalcular o valor total do pedido e de seus adicionais no servidor e recusar itens indisponíveis antes do pagamento.

#### Scenario: Tentativa de envio de preço adulterado no checkout da cantina
- **WHEN** cliente submete carrinho com preço unitário manipulado no payload ou item sem estoque
- **THEN** sistema ignora o valor do cliente aplicando o preço oficial do banco ou rejeita o item indisponível

### Requirement: Reserva e baixa atômica de estoque sem saldo negativo
O sistema DEVE reservar o estoque no início do checkout e impedir que disputas concorrentes gerem saldo negativo.

#### Scenario: Disputa simultânea pela última unidade em estoque
- **WHEN** dois clientes tentam finalizar checkout da última unidade disponível de um produto simultaneamente
- **THEN** sistema reserva a unidade para apenas um checkout e recusa o segundo com erro HTTP 409 Conflict

## Acceptance Criteria
- **AC-1.** Carrinho recalcula total com adicionais no servidor, ignora preço adulterado e bloqueia item indisponível.
  @test:tests/canteen/estoque.test.ts
- **AC-2.** Disputa pela última unidade reserva estoque para apenas um checkout sem permitir saldo negativo.
  @test:tests/canteen/estoque.test.ts
