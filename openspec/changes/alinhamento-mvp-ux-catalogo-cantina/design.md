# Design: Alinhamento do MVP, Catálogo Real, Cantina, Comentários e UX

## Context
Ver `proposal.md` para a motivação e a lista completa de inconsistências mapeadas entre `PRODUCT.md`, `DESIGN.md`, `openspec/changes/mar-01..mar-05`, ADRs e o estado atual de `cinefood/web/` e `cinefood/src/modules/catalog/`.

## Goals / Non-Goals

**Goals:**
- Corrigir todas as inconsistências funcionais, visuais e contratuais no frontend (`cinefood/web/`) e no módulo `catalog` (`cinefood/src/modules/catalog/`).
- Integrar uma API gratuita pública de catálogo de filmes com imagens reais (pôsteres, backdrops, sinopse, gênero, duração), mantendo resiliência offline.
- Entregar a tela pública de **Cantina** (produtos e pedido independente no balcão) e a tela de **Comentários** sobre filmes assistidos na rede.
- Elevar o UX de seleção de filmes e sessões (preços visíveis, propagação de filtros, grade comparativa e seleção direta de horário).

**Non-Goals:**
- Construção de servidor HTTP completo com PostgreSQL e gateways bancários reais nesta change (o foco é alinhar o contrato de UI, os fluxos do MVP web e os ajustes já existentes em `src/modules/catalog/`).

## Decisions

### 1. API Gratuita de Catálogo de Filmes com Imagens Reais (`web/src/services/movieCatalogApi.ts`)
- **Decisão:** Utilizar a **iTunes Search API** (`https://itunes.apple.com/search?media=movie&entity=movie&country=BR&lang=pt_br`) como fonte primária gratuita e **sem necessidade de API key**, enriquecendo automaticamente as artes para alta resolução (`600x600bb` / `1000x1000bb`) e suportando opcionalmente **TMDB v3** caso `VITE_TMDB_API_KEY` esteja presente no ambiente. Em caso de indisponibilidade de rede/CORS ou timeout (`4s`), acionar fallback curado com imagens reais locais/TMDB já presentes no projeto.
- **Alternativas consideradas:**
  - *Exigir apenas TMDB API*: rejeitada como única fonte pois depende de `API_KEY` privada para funcionar out-of-the-box.
  - *OMDb API*: rejeitada pelo mesmo motivo (exige chave e possui limite restrito no tier gratuito).
- **Mapeamento:** Os filmes retornados pela API são combinados de forma determinística às sessões, salas e complexos da rede CineFood, preservando preços-base (`basePrice`), formatos (`IMAX 3D`, `Dolby Atmos`, `2D`) e datas disponíveis.

### 2. Separação Cliente vs. Backstage e Alinhamento RBAC
- **Decisão:** Remover integralmente o bloco "CineFood Backstage (CRM Operacional)" de `AuthView.tsx`. A rota `#/ops` abre uma tela de acesso operacional dedicada para seleção/autenticação de estação (`OPERADOR_PORTARIA`, `OPERADOR_CANTINA`, `RUNNER`, `ADMIN_CINEMA` — além de suporte ao posto de bilheteria dentro do fluxo administrativo/bilheteria) em vez de entrar diretamente autenticado como `ADMIN`.
- **Alternativas consideradas:** Manter atalho no perfil do cliente — rejeitada por violar `RF-01` / `AC-2` e a solicitação explícita de isolamento entre cliente e equipe.

### 3. Capacidade Única de Sala (`96` poltronas) e Mapa por Sessão
- **Decisão:** Adotar `ROOM_CAPACITY = 96` (`A–H` × 12) como fonte única em `cinemaData.ts`, `SeatSelectionView.tsx`, `BoxOfficeView.tsx` e `AdminOccupancyView.tsx`. `buildSeatMap(sessionId, occupancyPct)` passa a gerar estado determinístico por sessão coerente com `occupancyPct` e diferencia visualmente `pcd-plus` com largura `1.5×` (`col-span` / largura ampliada + badge `1.5×`) e `pcd-wheelchair` com ícone dedicado. Remover pré-seleções automáticas (`['F7','F8']` no cliente e `['D6']` na bilheteria).

### 4. Vitrine Pública da Cantina (`CanteenCatalogView.tsx`) e Desacoplamento (`ADR-005`)
- **Decisão:** Adicionar item **"Cantina"** na barra de navegação principal (`Header.tsx`). A tela permite filtrar por categoria, consultar estoque e preços, montar carrinho e finalizar pedido independente para **Retirada no Balcão** (sem exigir ingresso/assento), ou optar por entrega no assento vinculando a um ingresso ativo existente do titular.

### 5. Mural de Comentários Verificados (`CommunityReviewsView.tsx`)
- **Decisão:** Adicionar item **"Comentários"** na navegação principal e atalho contextual a partir de `MovieDetailView.tsx`. Exibe comentários de clientes que assistiram aos filmes na rede (com selo de entrada validada, complexo e nota de 1 a 5 estrelas), sincronizado bidirecionalmente com as avaliações criadas/editadas/excluídas pelo titular em `ClientOrdersView.tsx`.

### 6. Alinhamento do Fluxo de Pagamento, QR Individual, KDS/Runner e CDC
- **Decisão:**
  - `CheckoutView.tsx` passa a receber e exibir `secondsLeft`, bloqueando finalização se expirado, validando documento de meia-entrada quando aplicável, e suportando simulação do estado `PENDENTE` antes de confirmar `ATIVO` (registrando estorno/aviso no histórico em `Pix Tardio`).
  - `App.tsx` emite um `ClientTicketOrder` (ou array de tickets individuais com `qrToken` único por assento) sincronizado com o SVG exibido em `TicketPassView.tsx` e validado em `GateScannerView.tsx`.
  - Remover `"Simular avanço"` de `ClientOrdersView.tsx`. Corrigir `RN-02` (trava portaria) e `RN-03` (ocorrência runner); restringir fila do Runner a pedidos `PRONTO` / `SAIU_PARA_ENTREGA`; na ocorrência de ausência, converter `deliveryMode` para `'counter'`, status para `RETIRADA_NO_BALCAO` e emitir aviso para `ClientOrdersView.tsx`.
  - Aplicar regra CDC completa (até 7 dias da compra e >= 2h da sessão) liberando assentos e estoque ao cancelar.
  - Migrar cores hardcoded em `GateScannerView.tsx`, `AdminOccupancyView.tsx` e `KdsRunnerView.tsx` para CSS variables (`tokens.css`) compatíveis com `[data-theme="oled"]` e corrigir alvos >= 44px, anel de foco `#60A5FA` e inputs >= 16px no mobile.

### 7. Módulo Backend `src/modules/catalog/`
- **Decisão:** Ajustar `repository.ts` para aceitar filtros de gênero, diretor e complexo e comparar data/hora no fuso local configurado sem deslocamento UTC de `.toISOString()`, e incluir `category` (`standard`/`pcd-wheelchair`/`pcd-plus`) em `service.ts` (`toCurrentSeatState`).

## Risks / Trade-offs
- **CORS ou indisponibilidade da API gratuita de filmes** → Mitigação: adaptador com timeout curto (`4s`), cache em memória e fallback automático para dados curados com imagens reais.
- **Mudança de capacidade de 120 para 96 assentos impactando seletores de teste** → Mitigação: revisar assentos escolhidos em `web/tests/prototype.spec.ts` (garantindo que filas `A–H` sejam utilizadas e nenhum assento `I`/`J` fique órfão).
- **Cobertura de `spec-guard.py`** → Mitigação: todas as ACs nos arquivos de spec apontam para arquivos de teste físicos existentes e os novos fluxos são cobertos no Playwright e testes unitários.
