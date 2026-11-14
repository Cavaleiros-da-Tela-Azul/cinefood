# Spec Delta: Catálogo Externo com Imagens Reais e UX de Seleção

## Purpose
Integrar o catálogo de filmes a uma API gratuita pública com imagens reais e aprimorar a experiência de descoberta, comparação e seleção de filmes e sessões pelo cliente.

## ADDED Requirements

### Requirement: Integração com API gratuita de catálogo de filmes e imagens reais
O sistema DEVE carregar o catálogo de filmes a partir de uma API gratuita pública (com imagens reais de pôster e backdrop, metadados de gênero, duração e sinopse) com fallback curado resiliente caso a rede ou serviço externo esteja indisponível.

#### Scenario: Carregamento inicial com API gratuita disponível
- **WHEN** o cliente acessa o catálogo principal em Cartaz
- **THEN** o sistema consulta a API gratuita configurada, exibe imagens reais de pôster/backdrop com carregamento progressivo e preserva os horários de sessão da rede

#### Scenario: Falha de rede ou timeout da API externa
- **WHEN** a requisição à API gratuita falha ou excede o tempo limite
- **THEN** o sistema ativa automaticamente o catálogo de fallback sem quebrar a renderização nem bloquear a compra

### Requirement: Melhoria de UX na seleção de filmes, exibição de preços e propagação de filtros
O sistema DEVE exibir preço-base, classificação indicativa, duração, avaliação média da rede e seletor rápido de sessões (respeitando data, formato e unidade selecionados) ao navegar entre o catálogo, os detalhes do filme e o mapa de assentos.

#### Scenario: Navegação com filtros ativos de data e formato
- **WHEN** o cliente filtra por data ou formato no catálogo e seleciona "Ver Detalhes" ou "Escolher Assentos"
- **THEN** o sistema preserva os filtros aplicados e pré-seleciona a sessão compatível com o filtro ativo em vez de saltar para a primeira sessão indiscriminadamente

#### Scenario: Comparação rápida e escolha direta de horário no catálogo
- **WHEN** o cliente explora os filmes em cartaz
- **THEN** o sistema exibe resumo claro de preço-base, horários disponíveis e grade comparável de filmes em cartaz para seleção direta de sessão

## Acceptance Criteria
- **AC-1.** Catálogo consome API gratuita de filmes com imagens reais e fallback resiliente offline.
  @test:web/tests/prototype.spec.ts
- **AC-2.** Preços-base, classificação, duração e filtros selecionados são exibidos e propagados entre catálogo, detalhes e assentos.
  @test:tests/catalog/programacao.test.ts
