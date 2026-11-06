# Spec Delta: Emissão e Validação Atômica de Ingresso por QR Code

## Purpose
Emitir ingressos individuais com QR Code opaco após confirmação de pagamento e garantir validação e consumo único atômico na portaria com disparo de preparo para pedidos vinculados na cantina.

## ADDED Requirements

### Requirement: Emissão de ingresso individual por assento pago
O sistema DEVE gerar um ingresso distinto com QR Code opaco para cada assento da reserva exclusivamente após confirmação válida do pagamento.

#### Scenario: Compra de múltiplos assentos confirmada
- **WHEN** pagamento de uma reserva contendo dois assentos é confirmado pelo gateway
- **THEN** sistema emite dois ingressos distintos com tokens QR opacos únicos e disponibiliza pré-vínculo para cantina

### Requirement: Consumo atômico e único na portaria
O sistema DEVE permitir que apenas a primeira leitura válida na portaria consuma o ingresso, rejeitando reutilização, cancelamento ou sessão incorreta.

#### Scenario: Tentativa de leitura duplicada ou concorrente do mesmo QR Code
- **WHEN** o mesmo QR Code é lido duas vezes seguidas ou simultaneamente na portaria
- **THEN** sistema aprova apenas a primeira leitura alterando o estado para UTILIZADO e bloqueia a segunda leitura com erro HTTP 409

#### Scenario: Disparo de preparo de pedido vinculado ao validar entrada
- **WHEN** operador da portaria valida ingresso que possui pedido de cantina com entrega no assento em AGUARDANDO_CHEGADA
- **THEN** sistema atualiza o ingresso para UTILIZADO e transiciona automaticamente o pedido vinculado para EM_PREPARO

## Acceptance Criteria
- **AC-1.** Compra confirmada gera um QR Code opaco distinto por assento e impede emissão antes do pagamento.
  @test:tests/tickets/qrcode.test.ts
- **AC-2.** Leitura na portaria consome o ingresso atomicamente apenas na primeira vez e aciona o preparo de pedidos vinculados.
  @test:tests/tickets/qrcode.test.ts
