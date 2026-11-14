# Design: Catálogo Híbrido (TMDB + OMDb), Comentários por Filme e UX de Sessões

## Context

Veja `proposal.md` para motivação e contexto completo. No estado atual do frontend (`cinefood/web/src/`):
- `Header.tsx` lista `'reviews'` como `"Comentários"`;
- `movieCatalogApi.ts` já suporta `VITE_TMDB_API_KEY` para `/movie/now_playing` (página única) e usa iTunes RSS/Search (até 8 itens) como fallback sem chave;
- `CommunityReviewsView.tsx` exibe um mural plano sem grid de catálogo extenso nem notas externas;
- `MovieDetailView.tsx` recebe apenas o `movie` selecionado e renderiza `filteredSessions` em uma grade plana única.

## Goals / Non-Goals

**Goals:**
- Evoluir o serviço de catálogo para suportar descoberta/busca paginada de catálogo extenso (TMDB + fallback iTunes/curado) e enriquecimento sob demanda de notas externas (IMDb e Rotten Tomatoes via OMDb) com cache em sessão.
- Transformar a aba `'reviews'` (rotulada `"Catálogo"`) em navegação de 2 níveis (Grade de Cards -> Ficha do Filme com sub-abas `Visão Geral` e `Comentários`) mantendo compatibilidade de deep-link vindo de `MovieDetailView`.
- Adicionar rail horizontal multi-filme em `MovieDetailView` e agrupamento `Unidade -> Data -> Cards de Horário`.

**Non-Goals:**
- Construção de proxy HTTP no backend neste momento (as chamadas continuam no client Vite com fallback gracioso sem chaves obrigatórias).
- Alteração das regras de negócio de avaliação verificada `RF-13` (Opção A confirmada pelo usuário).

## Decisions

### 1. Integração Híbrida TMDB (descoberta/busca) + OMDb (IMDb & Rotten Tomatoes sob demanda)
- **Decisão:** Utilizar `TMDB /discover/movie` + `/search/movie` + `/genre/movie/list` (em `pt-BR`) para listar e filtrar o catálogo extenso com paginação, e somente quando o usuário clicar em um filme específico consultar `/movie/{id}/external_ids` na TMDB para obter o `imdb_id` e buscar em `https://www.omdbapi.com/?i={imdb_id}&apikey=...` as notas de **IMDb** (`imdbRating`) e **Rotten Tomatoes** (`Ratings` onde `Source === 'Rotten Tomatoes'`).
- **Cache e Fallback:** Guardar notas e fichas detalhadas em cache `Map` em memória de sessão para evitar chamadas repetidas à OMDb (limite gratuito de 1.000 req/dia). Quando `VITE_TMDB_API_KEY` ou `VITE_OMDB_API_KEY` estiverem ausentes (como no ambiente local atual sem `.env`), usar múltiplas buscas iTunes + acervo curado local para manter a grade populada e exibir `"N/D"` (ou dados curados dos filmes demo) nas notas externas sem quebrar a interface.
- **Alternativas consideradas:** Usar apenas iTunes sem chave foi descartado porque iTunes não fornece IMDb/Rotten Tomatoes nem paginação rica por gênero; buscar OMDb para toda a grade de uma vez foi descartado por estourar rapidamente a cota diária.

### 2. Fluxo em dois níveis na aba `Catálogo` e preservação do vínculo com `Em Cartaz` / `RF-13`
- **Decisão:** Reaproveitar a rota interna `'reviews'` em `App.tsx` (evitando quebrar tipos de etapa existentes além de renomear o rótulo em `Header.tsx` para `"Catálogo"`), introduzindo um estado `selectedCatalogMovie` dentro do componente da visão de Catálogo (`CatalogView` / evolução de `CommunityReviewsView`).
- **Correspondência com filmes em cartaz:** Ao renderizar um card ou ficha do catálogo, cruzar por `id` ou título normalizado com a lista `movies` atualmente em exibição na rede. Se houver match, exibir badge `"Em Cartaz"` e o CTA `"Ver Sessões / Comprar"`, que define o filme ativo e navega para `'detail'`.
- **Deep-link de Sessões -> Comentários:** Quando `MovieDetailView` aciona `onOpenReviews(movie.id)`, passar o `movie.id` e `initialSubTab='comments'` para abrir diretamente a ficha daquele filme na sub-aba `"Comentários"`.
- **Comentários (Opção A):** O formulário de criar/editar/excluir avaliação na sub-aba `"Comentários"` só é liberado se `eligibleOrders` do usuário autenticado tiver ingresso daquele filme com check-in concluído e sessão encerrada.

### 3. Navegação multi-filme e agrupamento Unidade -> Data -> Horário em `Sessões`
- **Decisão:** Passar `movies` (lista completa em cartaz) e `onSelectMovie(movieId)` para `MovieDetailView.tsx`. No topo da tela, renderizar uma faixa horizontal responsiva (`overflow-x-auto` com `scroll-snap-type` no mobile + botões `<` e `>` no desktop) com minicards de pôster + título + formato.
- **Hierarquia de sessões:** Em vez de iterar diretamente sobre `filteredSessions`, agrupar primeiro pela ordem canônica dos complexos encontrados (respeitando `COMPLEX_OPTIONS`) e, dentro de cada complexo, pela ordem cronológica de `DATE_OPTIONS` (`dateId`). Cada card interno foca em Horário (`HH:mm`), Formato, Sala, Preço-base e barra de ocupação, eliminando repetição redundante de nome de complexo/data em todos os cards.

## Risks / Trade-offs

- **Exposição de chaves `VITE_*` no bundle cliente ou ausência de `.env` local** -> Mitigado mantendo ambas as chaves opcionais, tratando ausência/401/403 com fallback imediato para iTunes/curado + notas `"N/D"`, e documentando `.env.example` sem commitar segredos.
- **Compatibilidade de nomes de filmes entre TMDB (`pt-BR`) e OMDb** -> Mitigado usando o `imdb_id` retornado por `/movie/{id}/external_ids` da TMDB como chave principal na OMDb (evitando falhas de título traduzido).
- **Aumento de altura vertical na aba `Sessões` com agrupamento por Unidade e Data** -> Mitigado usando grid compacto de cards de horário (`sm:grid-cols-2 lg:grid-cols-3`) dentro de cada dia e preservando todos os filtros de formato/data/unidade no topo.
