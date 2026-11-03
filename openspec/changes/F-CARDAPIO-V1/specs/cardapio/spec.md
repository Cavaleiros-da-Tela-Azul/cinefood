---
id: F-CARDAPIO-V1
parent: PROD-001
version: 1.0.0
status: in_review
risk_tier: low
related_adrs: [ADR-001]
---

# Feature Spec: Catálogo de Produtos e Combos

## Acceptance Criteria

- **AC-1.** A listagem do cardápio deve retornar apenas produtos marcados como ativos e disponíveis em estoque.
  @test:tests/cardapio/catalogo.test.ts

- **AC-2.** Ao filtrar por uma categoria válida (ex.: 'pipocas'), apenas os itens correspondentes a essa categoria devem ser retornados.
  @test:tests/cardapio/catalogo.test.ts

- **AC-3.** Combos promocionais devem listar explicitamente os itens individuais que o compõem e o valor total com desconto.
  @test:tests/cardapio/catalogo.test.ts

## Out of Scope
- Edição de preços por atendente (privilégio exclusivo de administradores via backoffice).

## NEEDS_CLARIFICATION
- [x] O estoque é reservado na montagem do carrinho ou na confirmação do pagamento? (R: Na confirmação do pagamento via F-PEDIDO-V1).
