# Proposal: Catálogo Extenso com Notas Externas e Navegação Hierárquica de Sessões

## Why

Atualmente a aba "Comentários" do CineFood expõe um mural único restrito a poucos filmes locais, sem permitir explorar um catálogo amplo nem consultar notas consolidadas da crítica/público antes de decidir o que assistir. Além disso, a aba "Sessões" exibe apenas o filme previamente selecionado em "Em Cartaz" sem indicação de outros títulos em exibição e mistura unidades e datas diferentes em uma grade plana difícil de comparar.

## What Changes

- **Topbar e Nova Aba `Catálogo` (antes `Comentários`)**:
  - Renomear o item `"Comentários"` da navegação principal (`Header`) para `"Catálogo"`.
  - Transformar a tela em uma experiência em dois níveis: primeiro uma grade extensa, buscável e filtrável por categoria com cards de pôster e nome dos filmes (com selo de `"Em Cartaz"` quando em exibição na rede); ao clicar em um card, abrir a ficha completa do filme com descrição, tags de categoria, painel de notas (**IMDb**, **Rotten Tomatoes** e **avaliação média dos usuários do CineFood**) e atalho `"Ver Sessões / Comprar"` se estiver em exibição.
- **Comentários Verificados por Filme (Opção A / `RF-13`)**:
  - Integrar a aba de `"Comentários"` dentro da ficha de cada filme selecionado no `Catálogo`, mantendo a restrição de escrita estrita para titulares autenticados com ingresso validado na portaria e sessão encerrada para aquele filme, e modo leitura explicativo para filmes fora de cartaz.
  - Preservar a navegação vinda do botão `"Ver Comentários da Rede"` na tela de `Sessões` abrindo diretamente a ficha do filme correspondente já na sub-aba `"Comentários"`.
- **Integração Híbrida TMDB + OMDb com Fallback**:
  - Expandir o serviço de catálogo de filmes para consultar a **TMDB API** (`VITE_TMDB_API_KEY`) para listagem extensa paginada, busca, tags em `pt-BR`, sinopse e imagens reais, e consultar a **OMDb API** (`VITE_OMDB_API_KEY`) sob demanda ao clicar em um filme para obter notas reais do **IMDb** e **Rotten Tomatoes** com cache em sessão e fallback automático para iTunes/catálogo curado na ausência de chaves ou falha de rede.
- **UX de Troca de Filmes e Hierarquia em `Sessões`**:
  - Adicionar na aba `Sessões` (`MovieDetailView`) uma faixa horizontal de minicards clicáveis estilo rail + setas laterais (`<` `>`) listando todos os filmes em cartaz para evitar que o usuário fique preso ao título anterior.
  - Reorganizar a exibição de horários na aba `Sessões` por hierarquia **Unidade (Complexo) -> Dia -> Cards de Horário**, mantendo compatibilidade com os filtros de formato, data e complexo.

## Capabilities

### New Capabilities

- `catalog/catalogo-filmes-notas`: Catálogo extenso de filmes com busca/tags, ficha detalhada com descrição, categorias e notas externas (IMDb e Rotten Tomatoes via OMDb + TMDB) somadas à média da rede e fallback resiliente.
- `catalog/sessoes-navegacao-ux`: Navegação multi-filme em faixa horizontal com minicards/setas e agrupamento hierárquico de sessões por Unidade -> Data -> Horários na aba `Sessões`.
- `history/comentarios-comunidade`: Sub-aba de comentários verificados acoplada à ficha de cada filme no `Catálogo`, respeitando estritamente a regra `RF-13` (ingresso validado e sessão encerrada).

### Modified Capabilities

<!-- openspec/specs/ ainda não possui capabilities sincronizadas; o comportamento de history/comentarios-comunidade é especificado integralmente nesta change -->

## Impact

- **Frontend (`cinefood/web/src/`)**:
  - `components/Header.tsx`: renomear item de navegação para `Catálogo`.
  - `services/movieCatalogApi.ts`: integração paginada TMDB + consulta sob demanda OMDb (IMDb/Rotten Tomatoes) com cache em sessão e fallback iTunes/curado.
  - `components/CommunityReviewsView.tsx` (ou novo componente `CatalogView.tsx`): fluxo em 2 níveis (grade de catálogo extenso -> ficha do filme com notas, tags, descrição e sub-aba de comentários `RF-13`).
  - `components/MovieDetailView.tsx` e `App.tsx`: rail de minicards/setas de filmes em cartaz + agrupamento hierárquico Unidade -> Data -> Horários.
  - `tests/prototype.spec.ts`: cobertura E2E dos novos fluxos.
- **Variáveis de ambiente opcionais (`cinefood/web/.env`)**: `VITE_TMDB_API_KEY` e `VITE_OMDB_API_KEY` (com degradação graciosa quando não definidas).
