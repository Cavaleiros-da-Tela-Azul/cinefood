# CineFood 🍿🎬

Plataforma de autoatendimento e delivery de bomboniere para cinemas da organização **Cavaleiros da Tela Azul**.

Este repositório é instrumentado com a arquitetura **Spec-Driven Development (SDD) & Spec-Anchored**, integrando a **Cadeia do Contrato do CEIA/UFG**, o **OpenSpec** (esteira de deltas) e o **ai-memory** (memória perene da organização).

---

## 🏛️ A Cadeia do Contrato (Rastreabilidade Total)

Neste repositório, **a especificação é a única fonte da verdade (SSOT)**:

```text
[01 CONSTITUTION] ──► [02 PRODUCT] ──► [03 FEATURE SPEC] ──► [04 COMPONENT] ──► [05 TASKS] ──► [06 TESTS]
       │                                       ▲
       └─────────────────► [ADRs] ─────────────┘ (Transversais: citadas em related_adrs)
```

1. **`01 CONSTITUTION`:** Regras inegociáveis registradas no `ai-memory` (`CONST-001`).
2. **`02 PRODUCT`:** Documentado em `PROD-001-cinefood` no `ai-memory/projects/cinefood/`.
3. **`03 FEATURE SPEC`:** Especificações ativas na pasta `openspec/changes/<feature>/specs/` com ACs numeradas.
4. **`04 COMPONENT`:** Contratos de schemas e interfaces técnicas em `src/`.
5. **`05 TASKS`:** Lista de tarefas em `tasks.md` vinculadas 1:1 com as ACs que atendem.
6. **`06 TESTS`:** Arquivos de testes apontados pela anotação obrigatória `@test:<caminho>`.
7. **`ADRs (Transversais)`:** Decisões de arquitetura registradas no `ai-memory/decisions/` e citadas no frontmatter.

---

## 🚀 Guia de Trabalho para o Desenvolvedor

### 1. Iniciar uma Nova Funcionalidade
Use o comando nativo do OpenSpec diretamente no chat do seu agente (Antigravity IDE, Claude Code, Cursor ou Codex):

* **No Antigravity / Cursor:** `/opsx-propose "F-NOME-DA-FEATURE"`
* **No Claude Code:** `/opsx:propose "F-NOME-DA-FEATURE"`

O OpenSpec criará a pasta `openspec/changes/F-NOME-DA-FEATURE/`.

---

### 2. A Regra do `@test:` (Obrigatória em toda AC)
No arquivo `spec.md`, cada **Acceptance Criteria** deve descrever um comportamento observável e apontar explicitamente para o teste físico que a comprova:

```markdown
- **AC-1.** A listagem do cardápio deve retornar apenas produtos ativos e em estoque.
  @test:tests/cardapio/catalogo.test.ts
```
> ⚠️ **Atenção:** O hook de Git recusará commits com ACs sem `@test:` ou apontando para testes inexistentes.

---

### 3. Implementação Guiada (`/opsx-apply`)
Com a spec preenchida e revisada, execute o comando:
* `/opsx-apply` (ou `/opsx:apply`)

O agente lerá o `tasks.md` e implementará passo a passo: primeiro o teste, depois a implementação mínima correspondente.

---

### 4. A Barreira Mecânica de Pré-Commit
O repositório conta com um guardião mecânico (`scripts/spec-guard.py` e `.githooks/pre-commit`):
* Impede commit de código em `src/` caso a spec em `openspec/` não tenha sido atualizada.
* Garante que toda AC possua um `@test:` válido.
* Para rodar manualmente:
  ```bash
  npm run check:spec
  ```

---

### 5. O que fazer quando surgir um Bug?
> 🚨 **Invariante do CEIA: "Bug vira mudança de spec, NÃO hotfix."**

1. Nunca faça um commit com correção direta em `src/`.
2. Identifique a AC ausente ou incorreta na spec.
3. Atualize a spec adicionando ou corrigindo a AC (versão `1.0.0` ➔ `1.1.0`).
4. Escreva o teste apontado pelo `@test:` comprovando a falha no código atual.
5. Corrija o código para fazer o teste passar.
6. Realize o commit e abra o PR.

---

## 🛠️ Comandos Rápidos

```bash
# Executa a suite de testes automatizados
npm test

# Executa o guardião de integridade do contrato
npm run check:spec

# Ativa os githooks no seu clone local (executado uma única vez)
git config core.hooksPath .githooks
```
