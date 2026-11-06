# Spec Delta: Atendimento KDS, Entrega no Assento e Ocorrência do Runner

## Purpose
Controlar as transições de preparo e entrega de pedidos na cantina, exigindo ingresso próprio validado na portaria para entrega no assento e tratando ocorrências do runner na sala escura.

## ADDED Requirements

### Requirement: Entrega no assento condicionada a ingresso pago e entrada validada
O sistema DEVE exigir ingresso próprio pago, não cancelado e com entrada validada na portaria antes de autorizar a saída do pedido para entrega na poltrona.

#### Scenario: Bloqueio de saída para entrega sem entrada validada na portaria
- **WHEN** operador tenta despachar pedido para entrega no assento mas o ingresso vinculado ainda não foi validado na portaria
- **THEN** sistema bloqueia a transição para saída de entrega com erro HTTP 422 Unprocessable Entity

### Requirement: Conversão para retirada no balcão em ocorrência do runner
O sistema DEVE permitir que o runner registre ocorrência de impossibilidade de entrega na sala escura, convertendo o pedido para retirada no balcão.

#### Scenario: Cliente ausente na poltrona durante tentativa de entrega
- **WHEN** runner registra ocorrência de cliente não localizado na poltrona após o tempo de tolerância
- **THEN** sistema altera a modalidade do pedido para RETIRADA_NO_BALCAO e emite aviso no histórico do titular

## Acceptance Criteria
- **AC-3.** Entrega no assento rejeita ingresso de terceiro ou sem entrada validada na portaria, enquanto retirada no balcão dispensa ingresso.
  @test:tests/canteen/entrega.test.ts
- **AC-4.** Registro de ocorrência pelo runner converte o pedido para retirada no balcão e notifica o titular.
  @test:tests/canteen/entrega.test.ts
