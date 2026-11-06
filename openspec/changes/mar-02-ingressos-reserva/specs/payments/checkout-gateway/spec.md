# Spec Delta: Checkout e Integração com Gateway de Pagamento

## Purpose
Processamento seguro e idempotente de pagamentos via Pix e cartão em provedor externo, com validação de webhooks autenticados, conciliação de pendências e estorno automático em conflitos de expiração.

## ADDED Requirements

### Requirement: Idempotência e validação de eventos de pagamento
O sistema DEVE processar criações de cobrança e webhooks do gateway utilizando chaves únicas de idempotência e verificação de autenticidade.

#### Scenario: Repetição de requisição ou webhook de pagamento
- **WHEN** cliente ou gateway reenvia solicitação ou evento com a mesma chave de idempotência
- **THEN** sistema retorna o resultado já registrado sem duplicar cobrança ou operação financeira

#### Scenario: Rejeição de webhook com assinatura inválida
- **WHEN** endpoint de webhook recebe notificação sem assinatura criptográfica válida do provedor
- **THEN** sistema rejeita o evento com erro HTTP 401 e mantém o estado da compra inalterado

### Requirement: Estorno automático em conflito de Pix tardio
O sistema DEVE acionar estorno integral imediato no gateway quando um pagamento for confirmado após a expiração da reserva e perda do assento.

#### Scenario: Compensação de Pix tardio com assento indisponível
- **WHEN** webhook válido confirma pagamento de reserva expirada cujo assento foi alocado a outro usuário
- **THEN** sistema registra estorno automático no gateway e notifica o titular no histórico da compra

## Acceptance Criteria
- **AC-3.** Solicitações e webhooks repetidos respeitam a idempotência sem duplicar cobranças, e eventos não autenticados são rejeitados.
  @test:tests/payments/checkout.test.ts
- **AC-4.** Pagamento confirmado após expiração com assento já ocupado aciona compensação e estorno automático.
  @test:tests/payments/checkout.test.ts
