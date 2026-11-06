# Spec Delta: Venda Assistida e Categorias de Ingresso

## Purpose
Suporte à venda presencial assistida por operador na bilheteria compartilhando a mesma fonte de assentos e aplicação das regras legais de inteira e meia-entrada no servidor.

## ADDED Requirements

### Requirement: Venda assistida na mesma fonte de assentos
O sistema DEVE permitir que operador autorizado realize reserva de ingressos identificando comprador, canal presencial e categoria na mesma API central.

#### Scenario: Venda assistida disputando assento com canal digital
- **WHEN** operador da bilheteria e cliente no aplicativo tentam reservar o mesmo assento simultaneamente
- **THEN** sistema aplica a trava transacional única confirmando apenas um canal e registrando operador e comprador

### Requirement: Cálculo de categorias e meia-entrada no servidor
O sistema DEVE calcular os valores de inteira e benefícios legais de meia-entrada no servidor, ignorando preços enviados pelo cliente.

#### Scenario: Cálculo de meia-entrada elegível e bloqueio de preço adulterado
- **WHEN** comprador seleciona meia-entrada em sessão com inteira a R$ 40,00 mesmo enviando payload com valor manipulado
- **THEN** sistema aplica R$ 20,00 (2000 centavos) conforme regra legal e exige registro da categoria de comprovação

## Acceptance Criteria
- **AC-5.** Venda assistida registra operador e comprador, compartilha a mesma trava de assentos e não emite ingresso antes do pagamento.
  @test:tests/booking/venda-assistida.test.ts
- **AC-6.** Categorias de inteira e meia-entrada são calculadas no servidor rejeitando adulteração de preço no payload.
  @test:tests/booking/venda-assistida.test.ts
