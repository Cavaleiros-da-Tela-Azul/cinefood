# Spec Delta: Catálogo Extenso de Filmes com Notas Externas e da Rede

## Purpose

Disponibilizar na aba de navegação "Catálogo" (antiga "Comentários") uma vitrine ampla e pesquisável de filmes alimentada por API gratuita com pôsteres reais, evoluindo para uma ficha técnica completa com notas do IMDb, Rotten Tomatoes e usuários do CineFood antes da leitura/escrita de comentários.

## ADDED Requirements

### Requirement: Aba Catálogo com grade extensa de pôsteres e nomes
O sistema DEVE exibir na topbar o item "Catálogo" no lugar de "Comentários", abrindo uma grade paginada e filtrável por busca textual e tags de gênero, onde cada card apresenta a imagem do pôster, o título do filme e indicação visual caso esteja em cartaz na rede.

#### Scenario: Exploração e filtragem do catálogo extenso
- **WHEN** o cliente acessa a aba "Catálogo" na navegação principal
- **THEN** o sistema carrega o catálogo paginado a partir da API configurada, exibe os cards com pôster e título e permite buscar por nome ou filtrar por categoria

#### Scenario: Fallback resiliente sem chaves externas ou com falha de rede
- **WHEN** as chaves de API externa não estão configuradas ou ocorre timeout/erro de rede
- **THEN** o sistema ativa automaticamente o catálogo público de fallback (iTunes ampliado e acervo curado) mantendo a grade navegável e exibindo indicador "N/D" para notas externas indisponíveis

### Requirement: Ficha do filme com descrição, tags de categoria e painel de notas
O sistema DEVE abrir a ficha detalhada do filme ao clicar em um card do catálogo, apresentando pôster, descrição completa, tags de categoria e o comparativo de três notas: IMDb, Rotten Tomatoes e avaliação média dos usuários do CineFood.

#### Scenario: Consulta das notas externas sob demanda ao selecionar um filme
- **WHEN** o cliente clica em um filme da grade do "Catálogo"
- **THEN** o sistema exibe descrição e tags de categoria do filme, consulta sob demanda (com cache em sessão) as notas de IMDb e Rotten Tomatoes, calcula a média verificada dos clientes CineFood e exibe um atalho direto para "Ver Sessões / Comprar" quando o filme estiver em cartaz na rede

## Acceptance Criteria

- **AC-1.** Topbar exibe "Catálogo" e a grade carrega catálogo extenso com busca, tags e fallback resiliente offline.
  @test:web/tests/prototype.spec.ts
- **AC-2.** Ao selecionar um filme do catálogo, são exibidos descrição, tags de categoria, nota IMDb, nota Rotten Tomatoes e média dos usuários da rede, além de atalho para sessões quando em cartaz.
  @test:web/tests/prototype.spec.ts
