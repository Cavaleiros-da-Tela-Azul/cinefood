# Tasks: MAR-03 Acesso e Histórico (QR Code, Portaria e Avaliação Privada)

## 1. Emissão e Consumo Atômico de QR Code (RF-05, RF-06 / AC-1, AC-2)

- [ ] 1.1 Criar suíte de testes em `tests/tickets/qrcode.test.ts` cobrindo emissão por poltrona, bloqueio de segunda leitura concorrente e gatilho `AGUARDANDO_CHEGADA -> EM_PREPARO` (`RN-02`).
- [ ] 1.2 Implementar geração de token opaco, serviço de validação atômica de portaria e esteira guiada pós-ingresso (`RN-05`) em `src/modules/tickets` até aprovação dos testes.

## 2. Histórico Privado e Avaliação Pós-Sessão (RF-11, RF-13 / AC-3, AC-4)

- [ ] 2.1 Criar suíte de testes em `tests/history/avaliacao.test.ts` validando isolamento de histórico por titular e regras de elegibilidade da avaliação de 1 a 5 estrelas.
- [ ] 2.2 Implementar endpoints de histórico, avisos internos e CRUD de avaliação privada em `src/modules/history` até aprovação dos testes.
