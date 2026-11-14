# Spec Delta: Tela Pública de Vitrine e Cardápio da Cantina

## Purpose
Disponibilizar ao cliente uma tela dedicada para visualizar todos os produtos e combos oferecidos pela cantina, consultar disponibilidade e preços oficiais e realizar pedidos independentes para retirada no balcão sem obrigatoriedade de compra de ingresso.

## ADDED Requirements

### Requirement: Vitrine dedicada de produtos da cantina
O sistema DEVE oferecer uma navegação direta na interface do cliente para a tela da cantina listando categorias (combos, pipocas, bebidas e doces), descrições, preços, estoque disponível e indicação de itens esgotados.

#### Scenario: Consulta direta do cardápio pela barra superior
- **WHEN** o cliente clica na aba "Cantina" na navegação principal
- **THEN** o sistema abre a tela completa de produtos da cantina com busca/filtro por categoria e controle de quantidade sem exigir seleção prévia de filme ou assento

### Requirement: Pedido independente da cantina para retirada no balcão
O sistema DEVE permitir concluir um pedido exclusivo de cantina para retirada no balcão (`ADR-005`) ou vincular entrega no assento apenas quando houver ingresso ativo compatível.

#### Scenario: Compra exclusiva de produtos da cantina no balcão
- **WHEN** o cliente adiciona itens disponíveis na vitrine da cantina e escolhe "Retirada no balcão"
- **THEN** o sistema permite avançar ao checkout independente da cantina sem exigir assento ou ingresso vinculado

#### Scenario: Tentativa de entrega no assento sem ingresso ativo
- **WHEN** o cliente seleciona "Entregar no meu assento" na cantina sem possuir ingresso ativo na sessão
- **THEN** o sistema informa a necessidade de um ingresso ativo e orienta o uso de retirada no balcão ou seleção de sessão

## Acceptance Criteria
- **AC-1.** Cliente acessa a vitrine completa da cantina pela navegação principal e visualiza preços, estoque e categorias.
  @test:web/tests/prototype.spec.ts
- **AC-2.** Pedido de cantina para retirada no balcão funciona de forma independente de ingresso conforme ADR-005.
  @test:tests/canteen/entrega.test.ts
