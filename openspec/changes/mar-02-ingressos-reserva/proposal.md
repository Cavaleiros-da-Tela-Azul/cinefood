# Proposal: MAR-02 Ingressos (Reserva Concorrente, Pagamentos e Meia-Entrada)

## Why
O Marco MAR-02 (Semanas 7 a 10 do ciclo ISO/IEC/IEEE 12207:2021) implementa o núcleo transacional de vendas de ingressos do CineFood. Garante que clientes digitais (web/Android) e operadores presenciais da bilheteria reservem assentos sem colisão (zero overbooking), processem pagamentos externos com idempotência e apliquem as regras legais de meia-entrada.

## What Changes
* **Reserva Exclusiva de Assentos (`RF-03` / `CMP-02` / `ADR-002`):** Bloqueio atômico de poltronas no PostgreSQL por sessão e comprador com expiração configurável de 10 minutos, liberando automaticamente reservas vencidas.
* **Pagamento Externo e Conciliação (`RF-04` / `CMP-03` / `ADR-003`):** Adaptador de gateway (Pix e Cartão em sandbox) com chave de idempotência obrigatória, validação criptográfica de webhooks, tratamento de timeouts e **estorno automático de "Pix Tardio"** quando a reserva de 10 min já expirou e o assento foi ocupado por outro comprador.
* **Venda Assistida na Bilheteria (`RF-14` / `CMP-02`, `CMP-03` / `ADR-004`):** Fluxo operacional para atendente presencial utilizando a mesma API e trava concorrente de assentos do autoatendimento.
* **Categorias de Ingresso e Meia-Entrada (`RF-16` / `CMP-02`):** Aplicação de inteira e meia-entrada conforme Lei nº 12.933/2013 e Decreto nº 8.537/2015, com validação de preço no servidor e exigência de comprovação documental.

## Capabilities

### New Capabilities
- `booking/reserva-assentos`: Reserva atômica concorrente de poltronas com trava temporária de 10 minutos e resolução de disputas entre canais (`RF-03`).
- `payments/checkout-gateway`: Processamento de pagamentos Pix/Cartão com idempotência, webhooks autenticados e compensação/estorno automático de pagamento tardio (`RF-04`).
- `booking/venda-assistida-categorias`: Venda assistida por operador na mesma fonte de dados e cálculo/validação de categorias de ingresso e meia-entrada (`RF-14`, `RF-16`).

### Modified Capabilities
*(Nenhuma capacidade existente modificada).*

## Impact
* **Arquitetura e Dados:** Módulos `CMP-02` e `CMP-03` com bloqueio transacional no PostgreSQL (`ADR-002`) e desacoplamento do checkout da cantina (`ADR-005`).
* **Riscos Mitigados:** `R1` (Venda duplicada de assento) e `R2` (Pagamento repetido ou divergente).
