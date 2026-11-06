# Design: MAR-01 Fundamentos (Conta, Catálogo e LGPD)

## Context
Primeira entrega técnica do CineFood no modelo Monólito Modular (`ADR-001`) sobre Node.js/TypeScript e PostgreSQL (`ADR-002`, `ADR-004`). Ver `proposal.md` para motivação e escopo.

## Goals / Non-Goals

**Goals:**
* Estruturar a arquitetura base da API modular em `src/modules/{identity, catalog, privacy}`.
* Implementar autenticação segura stateless via JWT e middleware de controle de acesso (RBAC) rigoroso (`RF-01`).
* Modelar entidades relacionais de Usuário, Papel, Filme, Sala, Sessão, Poltrona e Registro de Consentimento.
* Expor endpoints de consulta de programação e mapa de assentos com latência p95 ≤ 2s (`RNF-01`).
* Atender às diretrizes de privacidade e consentimento da LGPD (`RF-17`).

**Non-Goals:**
* Reserva temporária concorrente e checkout financeiro (escopo do marco `MAR-02`).
* Geração de QR Code e bilheteria digital (escopo do marco `MAR-03`).
* Pedidos de alimentos e KDS da cantina (escopo do marco `MAR-04`).

## Decisions

### 1. Autenticação JWT com Claims de RBAC
* **Decisão:** O token JWT contém `userId`, `email` e `role` (`CLIENTE`, `OPERADOR_PORTARIA`, `OPERADOR_CANTINA`, `RUNNER`, `ADMIN_CINEMA`).
* **Justificativa:** Permite que middlewares em memória validem privilégios sem overhead de consultas contínuas ao banco de dados para cada requisição interna.
* **Alternativa rejeitada:** Sessão armazenada em banco/Redis — adicionaria infraestrutura desnecessária para o MVP piloto.

### 2. Estrutura de Domínio e Contratos Tipados
* **Decisão:** Cada módulo possui seu próprio diretório com `types.ts`, `service.ts`, `routes.ts` e `repository.ts`.
* **Justificativa:** Garante fronteiras modulares coesas conforme `ADR-001`, permitindo evolução independente sem quebrar contratos de API.

### 3. Persistência Relacional com Migrations Explícitas
* **Decisão:** Schemas gerenciados via migrations SQL reproduzíveis (`001_initial_schema.sql`).
* **Justificativa:** Garantia de integridade referencial nativa no PostgreSQL (chaves estrangeiras, constraints de unicidade em e-mail e identificadores de assentos).

## Risks / Trade-offs

* **[Risco: Tentativa de Acesso Cruzado ou Falsificação de Papel]** → Middleware de autorização valida assinatura criptográfica do token e rejeita tokens expirados/adulterados (`RNF-02`).
* **[Risco: Latência na renderização de mapa de assentos]** → Índices compostos no PostgreSQL em `(sessao_id, estado)` garantindo p95 ≤ 2s (`RNF-01`).
* **[Risco: Vazamento de senhas em logs]** → Sanitização explícita em logs; senhas sofrem hashing unidirecional irreversível antes de persistir.
