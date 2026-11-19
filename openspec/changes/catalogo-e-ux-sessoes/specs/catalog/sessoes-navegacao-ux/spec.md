# Spec Delta: Navegação Multi-Filme e Hierarquia Unidade -> Data -> Horário em Sessões

## Purpose

Evitar que o usuário fique restrito ao filme previamente selecionado ao acessar a aba "Sessões" e tornar a leitura de horários imediata e livre de ambiguidades agrupando as sessões por unidade e data.

## ADDED Requirements

### Requirement: Seletor rápido multi-filme na aba Sessões
O sistema DEVE exibir no topo da aba "Sessões" uma faixa horizontal de minicards clicáveis (com pôster e título) acompanhada de setas laterais para alternar rapidamente entre todos os filmes em cartaz sem precisar retornar à tela inicial.

#### Scenario: Troca de filme dentro da aba Sessões
- **WHEN** o usuário acessa a aba "Sessões" e clica em outro minicard de filme ou utiliza as setas laterais de navegação
- **THEN** o sistema atualiza imediatamente o filme em foco (título, backdrop, metadados e grade de sessões), preservando os filtros ativos de data, unidade e formato

### Requirement: Agrupamento hierárquico de sessões por Unidade Piloto -> Data -> Horário (`RST-01`)
O sistema DEVE organizar os cards de sessão na aba "Sessões" hierarquicamente dentro da **Unidade Piloto Única (`CineFood Operações Piloto Ltda. · Salas 01 a 04`)** subdivididos por Dia/Data e Horário, exibindo formato, sala, preço-base e ocupação em tempo real sem filtros de múltiplos complexos (`RST-01`).

#### Scenario: Visualização com "Todas as datas" na Unidade Piloto Única
- **WHEN** o usuário mantém o filtro em "Todas as datas" na aba "Sessões"
- **THEN** o sistema exibe os blocos da unidade `CineFood Operações Piloto Ltda.` subdivididos por Data (`14 DEZ`, `15 DEZ`, etc.) com as sessões das Salas 01 a 04

#### Scenario: Afunilamento por filtros de Data ou Formato
- **WHEN** o usuário seleciona uma data ou formato específico nos filtros
- **THEN** o sistema mantém o agrupamento exibindo apenas as datas e formatos correspondentes ou apresenta estado vazio com ação rápida para limpar filtros

## Acceptance Criteria

- **AC-1.** Aba "Sessões" permite alternar entre todos os filmes em cartaz via minicards clicáveis e setas laterais sem retornar ao cartaz principal.
  @test:web/tests/prototype.spec.ts
- **AC-2.** Sessões exibidas são agrupadas visualmente por Unidade (Complexo) -> Data -> Cards de Horário mesmo quando todos os filtros estão abertos.
  @test:web/tests/prototype.spec.ts
