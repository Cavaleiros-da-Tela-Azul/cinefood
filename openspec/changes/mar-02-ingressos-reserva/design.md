# Design: MAR-02 Ingressos (Reserva Concorrente, Pagamentos e Meia-Entrada)

## Context
Entrega do fluxo transacional de reserva e liquidação de ingressos (`MAR-02`), apoiada nas decisões `ADR-002` (PostgreSQL como autoridade de trava de 10 min), `ADR-003` (idempotência e conciliação de gateway), `ADR-004` (API única entre canais) e `ADR-005` (checkouts separados).

## Goals / Non-Goals

**Goals:**
* Garantir exclusividade absoluta na reserva de poltronas sob concorrência simultânea entre web, Android e venda assistida (`CA-F03`, `CA-N03`).
* Processar cobranças e webhooks do provedor externo de forma idempotente, fora da transação de banco durante chamadas de rede (`CA-F04`).
* Executar estorno automático caso um pagamento tardio confirme após a expiração de 10 minutos e perda do assento para outro comprador (`RN-01`).
* Calcular preços de inteira e meia-entrada estritamente no servidor (`CA-F16`).

**Non-Goals:**
* Emissão e leitura do QR Code na portaria (escopo de `mar-03-acesso-historico`).
* Carrinho e estoque da cantina (escopo de `mar-04-cantina-gestao`).

## Decisions

### 1. Atualização Condicional Atômica no PostgreSQL (`ADR-002`)
* **Decisão:** Reservar assentos via transação SQL condicional verificando `estado = 'DISPONIVEL' OR (estado = 'RESERVADO' AND reservado_ate < NOW())`.
* **Justificativa:** Impede condições de corrida (*race conditions*) diretamente no motor relacional sem depender de locks em memória volátil.

### 2. Idempotência e Compensação de Pagamento Tardio (`ADR-003` / `RN-01`)
* **Decisão:** Cada tentativa de checkout recebe um `idempotency_key` único. Quando o webhook `PAYMENT_APPROVED` chega, a transação local verifica se a reserva ainda pertence ao comprador ou continua livre. Se o assento já foi tomado por terceiro após os 10 minutos, persiste estado `CONFLITO_EXPIRACAO` e dispara estorno idempotente imediato no gateway.

### 3. Recálculo Server-Side para Categorias e Venda Assistida (`RF-14`, `RF-16`)
* **Decisão:** O servidor ignora qualquer valor monetário enviado pelo cliente, calculando o total em centavos inteiros a partir da tabela oficial da sessão e da regra da categoria selecionada.

## Risks / Trade-offs

* **[Risco: Timeout na chamada ao Gateway]** → Manter compra como `PENDENTE` e resolver via rotina de conciliação antes de liberar ou cancelar (`R2`).
* **[Risco: Abuso de bloqueio de assentos]** → Limitar quantidade máxima de reservas pendentes simultâneas por usuário autenticado.
