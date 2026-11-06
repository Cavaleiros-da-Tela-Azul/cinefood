# Tasks: MAR-01 Fundamentos (Conta, Catálogo e LGPD)

## 1. Estrutura Base, Identidade Visual (UI/UX) e Persistência

- [ ] 1.1 Definir Identidade Visual *Dark-First*, Design Tokens (cores, tipografia, espaçamento, estados de assento com contraste >= 4.5:1 WCAG 2.2 AA) e protótipo navegável no Figma (`EAP 1.1.1` / `RNF-04`).
- [ ] 1.2 Estruturar diretórios modulares em `src/modules/{identity, catalog, privacy}` e definir contratos de interfaces compartilhadas.
- [ ] 1.3 Criar script de schema relacional e dados sementes para papéis, salas, filmes e poltronas.

## 2. Identidade, Autenticação e RBAC (RF-01 / AC-1, AC-2)

- [ ] 2.1 Criar suíte de testes em `tests/identity/auth.test.ts` validando cadastro, login com sucesso e bloqueio de duplicidade/senha incorreta.
- [ ] 2.2 Implementar serviços de cadastro de usuário, hash seguro de senha e emissão de token JWT até a aprovação dos testes de `auth.test.ts`.
- [ ] 2.3 Criar suíte de testes em `tests/identity/rbac.test.ts` validando isolamento e acesso restrito por perfil (`CLIENTE`, `OPERADOR_PORTARIA`, `OPERADOR_CANTINA`, `RUNNER`, `ADMIN_CINEMA`).
- [ ] 2.4 Implementar middleware de autorização por perfil até a aprovação dos testes de `rbac.test.ts`.

## 3. Catálogo e Programação (RF-02 / AC-3, AC-4)

- [ ] 3.1 Criar suíte de testes em `tests/catalog/programacao.test.ts` e `tests/catalog/assentos.test.ts` cobrindo listagem de filmes, filtros de sessões e mapa de poltronas.
- [ ] 3.2 Implementar serviços de catálogo e endpoints de consulta de programação e assentos até a aprovação dos testes.

## 4. Transparência e Consentimento LGPD (RF-17 / AC-5, AC-6)

- [ ] 4.1 Criar suíte de testes em `tests/privacy/transparencia.test.ts` cobrindo versionamento de termos e consentimento facultativo sem bloqueio de jornada.
- [ ] 4.2 Implementar endpoint de consulta de termos de privacidade e persistência de preferências do titular até a aprovação dos testes.

## 5. Integração e Verificação Mecânica do Contrato

- [ ] 5.1 Executar a suíte de testes com `npm test` e verificar aprovação completa dos testes de unidade e integração.
- [ ] 5.2 Executar o guardião mecânico `npm run check:spec` para validar 100% de ancoragem das ACs às suítes de teste.
