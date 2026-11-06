# Proposal: MAR-01 Fundamentos (Conta, Catálogo e LGPD)

## Why
O Marco MAR-01 (Semanas 1 a 6 do ciclo ISO/IEC/IEEE 12207:2021) é a pedra fundamental do CineFood. Para que as jornadas de compra, reserva de assentos e pedidos de cantina funcionem nos marcos subsequentes, o sistema necessita de uma autoridade central de identidade com controle de acesso baseado em papéis (RBAC), catálogo de programação de sessões com mapa de assentos e transparência com adequação à LGPD.

## What Changes
* **Conta e Acesso (`RF-01` / `CMP-01`):** Endpoints e regras de cadastro de usuário, autenticação segura com JWT/cookies protegidos, hashing de senhas (Argon2/bcrypt), recuperação de credenciais e validação de papéis de sistema (`CLIENTE`, `OPERADOR_PORTARIA`, `OPERADOR_CANTINA`, `RUNNER`, `ADMIN_CINEMA`).
* **Programação e Catálogo (`RF-02` / `CMP-02`):** Consulta estruturada de filmes em cartaz, sinopses, classificação indicativa, salas, horários de sessões, valores-base de ingressos e estado em tempo real do mapa de poltronas da sala.
* **Transparência e Preferências LGPD (`RF-17` / `CMP-01`, `CMP-06`):** Disponibilização de aviso de privacidade com finalidades de uso e base legal antes da coleta de dados, com separação e registro explícito de consentimentos opcionais.
* **Identidade Visual, Design System e Prototipação Figma (`EAP 1.1.1` / `RNF-04` / `role:RI`):** Definição da paleta visual *Dark-First* (pensada para uso em sala escura sem ofuscamento), tokens semânticos de estado de poltronas (`DISPONIVEL`, `RESERVADO`, `OCUPADO`), tipografia, contraste mínimo `4.5:1` (WCAG 2.2 Nível AA) e protótipo navegável no Figma para Web e Android.

## Capabilities

### New Capabilities
- `identity/auth-rbac`: Gestão de contas, autenticação segura, recuperação de senha e autorização por papéis (RBAC) com isolamento multi-tenant/perfil (`RF-01`).
- `catalog/programacao`: Catálogo de filmes, salas de exibição, sessões programadas e consulta de mapa de assentos (`RF-02`).
- `privacy/transparencia`: Termo de transparência, finalidades e registro de consentimento LGPD (`RF-17`).

### Modified Capabilities
*(Nenhuma capacidade existente modificada nesta entrega inicial).*

## Impact
* **Arquitetura:** Início da estrutura do Monólito Modular em Node.js/TypeScript conforme `ADR-001`.
* **Banco de Dados:** Criação do schema inicial no PostgreSQL para usuários, papéis, filmes, salas, sessões, poltronas e auditoria de consentimento (`ADR-002`, `ADR-004`).
* **Segurança e Desempenho:** Aderência aos requisitos `RNF-01` (p95 ≤ 2s para consultas) e `RNF-02` (hashing seguro de senha e RBAC inviolável no backend).
