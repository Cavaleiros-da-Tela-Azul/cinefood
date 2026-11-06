# Spec Delta: Reserva Concorrente de Assentos

## Purpose
Garantir a reserva exclusiva e temporária de assentos por sessão com expiração de 10 minutos, prevenindo vendas duplicadas em disputas simultâneas entre canais digitais e presenciais.

## ADDED Requirements

### Requirement: Reserva exclusiva de assento com trava de 10 minutos
O sistema DEVE bloquear atomicamente o assento selecionado para o comprador pelo prazo de 10 minutos, impedindo seleção simultânea por outro usuário.

#### Scenario: Disputa concorrente pelo mesmo assento
- **WHEN** dois compradores nos canais web, mobile ou bilheteria solicitam reserva da mesma poltrona simultaneamente
- **THEN** sistema aprova no máximo uma reserva ativa e rejeita a segunda requisição com erro HTTP 409 Conflict

#### Scenario: Liberação automática após expiração de 10 minutos
- **WHEN** reserva permanece sem confirmação de pagamento após 10 minutos de sua criação
- **THEN** sistema libera a poltrona para nova reserva por qualquer comprador

### Requirement: Proteção contra sobrescrita por confirmação tardia
O sistema DEVE impedir que um pagamento confirmado após a expiração de 10 minutos tome um assento já reservado ou ocupado por outro comprador.

#### Scenario: Pagamento tardio após perda da poltrona
- **WHEN** confirmação de pagamento chega após os 10 minutos e o assento já pertence a uma nova reserva válida
- **THEN** sistema preserva a nova reserva e encaminha o pagamento tardio para compensação e estorno automático

## Acceptance Criteria
- **AC-1.** Na disputa concorrente entre canais pelo mesmo assento, apenas uma reserva ativa é criada e a expiração de 10 min libera o lugar.
  @test:tests/booking/reserva.test.ts
- **AC-2.** Confirmação tardia após expiração não sobrescreve nova reserva de outro titular.
  @test:tests/booking/reserva.test.ts
