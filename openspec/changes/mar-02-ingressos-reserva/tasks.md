# Tasks: MAR-02 Ingressos (Reserva Concorrente, Pagamentos e Meia-Entrada)

## 1. Reserva Concorrente de Assentos (RF-03 / AC-1, AC-2)

- [ ] 1.1 Criar suíte de testes em `tests/booking/reserva.test.ts` validando disputa concorrente, trava de 10 minutos e proteção contra confirmação tardia.
- [ ] 1.2 Implementar serviço transacional de reserva de poltronas e expiração automática em `src/modules/booking` até aprovação dos testes.

## 2. Pagamento, Idempotência e Estorno de Pix Tardio (RF-04 / AC-3, AC-4)

- [ ] 2.1 Criar suíte de testes em `tests/payments/checkout.test.ts` cobrindo chave de idempotência, assinatura de webhook, timeout e estorno automático de Pix tardio (`RN-01`).
- [ ] 2.2 Implementar adaptador de gateway sandbox, processador de webhooks e rotina de compensação em `src/modules/payments` até aprovação dos testes.

## 3. Venda Assistida e Categorias de Meia-Entrada (RF-14, RF-16 / AC-5, AC-6)

- [ ] 3.1 Criar suíte de testes em `tests/booking/venda-assistida.test.ts` validando operação por atendente, disputa entre canais e recálculo server-side de meia-entrada.
- [ ] 3.2 Implementar endpoints de venda assistida e motor de cálculo de categorias de ingresso até aprovação dos testes.
