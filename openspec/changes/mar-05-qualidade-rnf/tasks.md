# Tasks: MAR-05 Verificação Integrada e Qualidade (RNF-01 a RNF-06)

## 1. Ensaios de Desempenho, Segurança e Integridade (RNF-01, RNF-02, RNF-03 / AC-1, AC-2)

- [ ] 1.1 Criar suíte de testes em `tests/quality/rnf-integridade.test.ts` medindo `p95 <= 2 s` e testando invariantes de concorrência e isolamento RBAC/IDOR.
- [ ] 1.2 Executar verificação de ausência de dados de cartão e segredos em logs e validar cobertura `>= 70%` nos módulos de negócio (`RNF-06`).

## 2. Usabilidade, Acessibilidade e Recuperação (RNF-04, RNF-05)

- [ ] 2.1 Documentar checklist de acessibilidade WCAG 2.2 AA e roteiro de avaliação de jornada com `>= 5` participantes (`docs/testes/`).
- [ ] 2.2 Validar rotina de backup e restauração de dados antes da liberação da candidata `v1.0.0-rc.1`.
