# Tasks: MAR-04 Alimentação e Gestão (Cantina, KDS/Runner, Estorno CDC e Direitos LGPD)

## 1. Cardápio e Reserva Atômica de Estoque (RF-07, RF-08 / AC-1, AC-2)

- [ ] 1.1 Criar suíte de testes em `tests/canteen/estoque.test.ts` validando recálculo server-side de carrinho e disputa simultânea pela última unidade de estoque.
- [ ] 1.2 Implementar serviço de cardápio, reserva atômica de estoque e baixa pós-pagamento em `src/modules/canteen` até aprovação dos testes.

## 2. KDS da Cantina, Entrega Vinculada e Runner (RF-09, RF-20 / AC-3, AC-4)

- [ ] 2.1 Criar suíte de testes em `tests/canteen/entrega.test.ts` cobrindo validação de entrada na portaria antes da entrega e ocorrência do runner convertendo para balcão (`RN-03`).
- [ ] 2.2 Implementar máquina de estados do KDS e endpoints operacionais da cantina e do runner até aprovação dos testes.

## 3. Administração, Ocupação e Cancelamento/Estorno CDC (RF-10, RF-12, RF-15 / AC-5, AC-6)

- [ ] 3.1 Criar suíte de testes em `tests/management/ocupacao-estorno.test.ts` validando preservação de compras passadas, cálculo de 30% de ocupação e janela de corte de estorno CDC (`RN-04`).
- [ ] 3.2 Implementar endpoints de administração, relatório de ocupação e fluxo de estorno idempotente até aprovação dos testes.

## 4. Direitos do Titular LGPD (RF-18 / AC-7)

- [ ] 4.1 Criar suíte de testes em `tests/privacy/direitos-titular.test.ts` validando protocolo de acesso, correção e eliminação seletiva com retenção legal.
- [ ] 4.2 Implementar serviço de direitos do titular em `src/modules/privacy` até aprovação dos testes.
