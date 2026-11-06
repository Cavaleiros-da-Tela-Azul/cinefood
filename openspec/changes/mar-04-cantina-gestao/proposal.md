# Proposal: MAR-04 Alimentação e Gestão (Cantina, KDS/Runner, Estorno CDC e Direitos LGPD)

## Why
O Marco MAR-04 (Semanas 14 a 18 do ciclo ISO/IEC/IEEE 12207:2021) completa as regras funcionais de negócio do CineFood: integra o pedido de alimentos da cantina (com reserva atômica de estoque, KDS e entrega no assento pelo runner), o painel administrativo, as consultas gerenciais de ocupação/vendas, o fluxo de cancelamento/estorno pelo CDC e o atendimento aos direitos do titular da LGPD.

## What Changes
* **Cardápio, Carrinho e Estoque Atômico (`RF-07`, `RF-08` / `CMP-05` / `ADR-005`):** Exibição de produtos, adicionais e combos com recálculo obrigatório no servidor; reserva de estoque no checkout e confirmação pós-pagamento sem permitir saldo negativo.
* **Atendimento KDS, Entrega Vinculada e Ocorrência do Runner (`RF-09`, `RF-20` / `CMP-05` / `RST-04`):** Fluxo da comanda (`AGUARDANDO_CHEGADA` -> `EM_PREPARO` -> `PRONTO` -> `EM_ENTREGA` / `RETIRADA_NO_BALCAO` -> `ENTREGUE`). Revalida entrada na portaria antes da saída para entrega e permite ao runner converter entrega inviabilizada na sala escura para `RETIRADA_NO_BALCAO` (`RN-03`).
* **Administração e Consultas Gerenciais (`RF-10`, `RF-15` / `CMP-01`, `CMP-02`, `CMP-05`, `CMP-06`):** Cadastro e atualização de sessões, preços e estoque sem afetar compras já confirmadas; cálculo de vendas, estornos e taxa de ocupação (`ingressos ativos / assentos comercializáveis * 100`).
* **Cancelamento e Estorno CDC (`RF-12` / `CMP-03`, `CMP-04`, `CMP-05`):** Solicitação de cancelamento com janela de corte de até 7 dias da compra e até 2 horas antes da sessão para ingressos não utilizados (`RN-04`), com estorno idempotente no gateway.
* **Direitos do Titular LGPD (`RF-18` / `CMP-01`, `CMP-06`):** Protocolo autenticado para solicitações de acesso, correção e eliminação de dados dispensáveis, preservando registros fiscais/legais obrigatórios.

## Capabilities

### New Capabilities
- `canteen/cardapio-estoque`: Cardápio da bomboniere com recálculo de preços no servidor e reserva atômica de estoque sem saldo negativo (`RF-07`, `RF-08`).
- `canteen/kds-entrega-runner`: Controle de preparo no KDS, validação de ingresso/entrada para entrega no assento e conversão para retirada no balcão em ocorrência do runner (`RF-09`, `RF-20`).
- `management/admin-relatorios-estorno`: Gestão administrativa da unidade, cálculo de ocupação/vendas e fluxo de cancelamento e estorno CDC com janela de corte (`RF-10`, `RF-12`, `RF-15`).
- `privacy/direitos-titular`: Atendimento protocolado aos direitos de acesso, correção e eliminação de dados do titular conforme LGPD (`RF-18`).

### Modified Capabilities
*(Nenhuma capacidade existente modificada).*

## Impact
* **Arquitetura e Dados:** Módulos `CMP-01`, `CMP-03`, `CMP-05` e `CMP-06`.
* **Riscos Mitigados:** `R5` (Estoque negativo ou entrega incorreta em assento não validado).
