# Tasks

## 1. Serviço de Catálogo Extenso (TMDB + OMDb + Fallback)

- [x] 1.1 Documentar as variáveis opcionais `VITE_TMDB_API_KEY` e `VITE_OMDB_API_KEY` em `cinefood/web/.env.example` e verificar que o build do Vite não falha com nenhuma delas ausente.
- [x] 1.2 Expandir `cinefood/web/src/services/movieCatalogApi.ts` para buscar catálogo extenso paginado/buscável por gênero e termo (TMDB `/discover/movie`, `/search/movie`, `/genre/movie/list`) com fallback iTunes Search ampliado + acervo curado offline; validar com build TypeScript (`npm run build` em `cinefood/web`).
- [x] 1.3 Implementar consulta sob demanda das notas **IMDb** e **Rotten Tomatoes** em `movieCatalogApi.ts` (TMDB `/movie/{id}/external_ids` -> `imdb_id` -> OMDb API) com cache em sessão e fallback `"N/D"` ou curado; verificar no navegador e via teste E2E em modo offline/fallback.

## 2. Nova Aba Catálogo em Dois Níveis e Comentários Verificados (RF-13)

- [x] 2.1 Renomear o item `"Comentários"` para `"Catálogo"` em `cinefood/web/src/components/Header.tsx` (desktop e drawer mobile) mantendo alvos `>= 44px` e `aria-current="page"`; verificar visualmente e nos seletores E2E.
- [x] 2.2 Evoluir `CommunityReviewsView.tsx` (ou extrair `CatalogView.tsx`) para fluxo em 2 níveis: (1) grade extensa de cards com pôster, título, busca, filtros por categoria e selo `"Em Cartaz"`; (2) ficha completa do filme selecionado com descrição, tags de categoria, comparativo **IMDb / Rotten Tomatoes / Média CineFood**, atalho `"Ver Sessões / Comprar"` quando em cartaz e sub-aba `"Comentários"` restrita à Opção A (`RF-13`); verificar criação/edição/exclusão e bloqueio sem ingresso validado.
- [x] 2.3 Atualizar `App.tsx` para ligar a navegação vinda de `"Ver Comentários da Rede"` em `MovieDetailView` diretamente à ficha do filme correspondente na sub-aba `"Comentários"` do `Catálogo`, e atualizar/executar testes E2E em `cinefood/web/tests/prototype.spec.ts` cobrindo os cenários do `Catálogo` e `RF-13`.

## 3. Melhoria de UX em Sessões (Troca Multi-Filme + Hierarquia Unidade -> Data -> Horário)

- [x] 3.1 Passar a lista de filmes em cartaz e callback `onSelectMovie` para `MovieDetailView.tsx` em `App.tsx` e implementar no topo de `Sessões` a faixa horizontal de minicards clicáveis + setas laterais (`<` / `>`) preservando filtros ativos; verificar navegação entre filmes sem sair da aba `Sessões`.
- [x] 3.2 Reestruturar a listagem de sessões em `MovieDetailView.tsx` por hierarquia **Unidade (Complexo) -> Data -> Cards de Horário**, mantendo compatibilidade com os filtros de formato, data e complexo e tokens OLED/WCAG (`>= 44px`); verificar nos cenários E2E em `cinefood/web/tests/prototype.spec.ts`.

## 4. Verificação Integrada

- [x] 4.1 Executar `npm run build` e `npx playwright test` em `cinefood/web`, além de `npm test` e `openspec validate catalogo-e-ux-sessoes` em `cinefood/`, confirmando zero regressões e todos os cenários passando.
