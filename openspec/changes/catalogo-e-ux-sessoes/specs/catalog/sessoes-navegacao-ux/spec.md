# Spec Delta: Navegação Multi-Filme e Hierarquia Unidade -> Data -> Horário em Sessões

## Purpose

Evitar que o usuário fique restrito ao filme previamente selecionado ao acessar a aba "Sessões" e tornar a leitura de horários imediata e livre de ambiguidades agrupando as sessões por unidade e data.

## ADDED Requirements

### Requirement: Seletor rápido multi-filme na aba Sessões
O sistema DEVE exibir no topo da aba "Sessões" uma faixa horizontal de minicards clicáveis (com pôster e título) acompanhada de setas laterais para alternar rapidamente entre todos os filmes em cartaz sem precisar retornar à tela inicial.

#### Scenario: Troca de filme dentro da aba Sessões
- **WHEN** o usuário acessa a aba "Sessões" e clica em outro minicard de filme ou utiliza as setas laterais de navegação
- **THEN** o sistema atualiza imediatamente o filme em foco (título, backdrop, metadados e grade de sessões), preservando os filtros ativos de data, unidade e formato

### Requirement: Agrupamento hierárquico de sessões por Unidade -> Data -> Horário
O sistema DEVE organizar os cards de sessão na aba "Sessões" hierarquicamente primeiro por Unidade (Complexo) e, dentro de cada unidade, por Dia/Data, exibindo em cada card o horário, formato, sala, preço-base e ocupação em tempo real.

#### Scenario: Visualização com "Todas as datas" e "Todos os complexos"
- **WHEN** o usuário mantém os filtros em "Todas as datas" e "Todos os complexos" na aba "Sessões"
- **THEN** o sistema exibe blocos separados por Unidade (Complexo), subdivididos por Data, permitindo comparar imediatamente em qual local, dia e horário cada sessão ocorre

#### Scenario: Afunilamento por filtros de Unidade, Data ou Formato
- **WHEN** o usuário seleciona uma unidade, data ou formato específico nos filtros
- **THEN** o sistema mantém o agrupamento exibindo apenas as unidades e datas correspondentes ou apresenta estado vazio com ação rápida para limpar filtros

## Acceptance Criteria

- **AC-1.** Aba "Sessões" permite alternar entre todos os filmes em cartaz via minicards clicáveis e setas laterais sem retornar ao cartaz principal.
  @test:web/tests/prototype.spec.ts
- **AC-2.** Sessões exibidas são agrupadas visualmente por Unidade (Complexo) -> Data -> Cards de Horário mesmo quando todos os filtros estão abertos.
  @test:web/tests/prototype.spec.ts
