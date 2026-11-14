# Tasks

## 1. Fundação de Dados, API Gratuita de Filmes e Módulo Catalog

- [x] 1.1 Criar serviço `web/src/services/movieCatalogApi.ts` integrando API gratuita pública de catálogo de filmes com imagens reais (iTunes Search API sem chave obrigatória + suporte opcional TMDB via `VITE_TMDB_API_KEY` + cache e fallback resiliente offline), verificando carga bem-sucedida e fallback via teste unitário/Playwright.
- [x] 1.2 Atualizar `web/src/data/cinemaData.ts` para unificar `ROOM_CAPACITY = 96` (`A–H` × 12), tornar `buildSeatMap(sessionId, occupancyPct)` determinístico por sessão, alinhar `StaffRoleGroup` (`OPERADOR_PORTARIA`, `OPERADOR_CANTINA`, `RUNNER`, `ADMIN_CINEMA`), incluir estados completos da cantina (`PENDENTE_PAGAMENTO`, `AGUARDANDO_CHEGADA`, `EM_PREPARO`, `PRONTO`, `SAIU_PARA_ENTREGA`, `RETIRADA_NO_BALCAO`, `ENTREGUE`), campos `userId`, `meiaCategory`, `meiaDoc`, `seatQrTokens`, `purchasedAt`, além de `status`/`startsAt` em `SessionSlot` e lista inicial de comentários verificados e avisos internos; verificar compilação TypeScript (`tsc -b`).
- [x] 1.3 Corrigir `src/modules/catalog/repository.ts`, `service.ts` e `types.ts` para filtrar por gênero, diretor e complexo, comparar data/horário em fuso local (sem deslocamento UTC de `.toISOString()`) e expor categoria da poltrona (`standard`/`pcd-wheelchair`/`pcd-plus`) em `toCurrentSeatState`; verificar com teste em `tests/catalog/programacao.test.ts` e `tests/catalog/assentos.test.ts`.

## 2. UX de Seleção de Filmes e Tela de Comentários da Rede

- [x] 2.1 Aprimorar `web/src/components/HeroCatalogView.tsx` e `web/src/components/MovieDetailView.tsx` para exibir preços-base (`basePrice`), nota média da rede, classificação, duração, seletor rápido de sessões/horários com data/complexo visíveis, propagar filtros ativos na navegação e garantir `aria-pressed`, anel de foco `#60A5FA` e alvos >= 44px; verificar via build e fluxo Playwright.
- [x] 2.2 Criar `web/src/components/CommunityReviewsView.tsx` exibindo mural de comentários de clientes sobre os filmes assistidos na rede CineFood (selo de entrada validada, complexo, nota 1–5 estrelas, filtro por filme e ordenação) com suporte a publicação, edição e exclusão pelo titular validado; verificar renderização, filtro e CRUD no Playwright.

## 3. Tela Pública da Cantina e Fluxo Desacoplado (`ADR-005`)

- [x] 3.1 Criar `web/src/components/CanteenCatalogView.tsx` listando todos os produtos e combos da cantina com filtro por categoria, busca, preços oficiais, estoque em tempo real e montagem de pedido independente para retirada no balcão sem exigir ingresso (ou vinculado a ingresso ativo do titular); verificar via fluxo Playwright.
- [x] 3.2 Atualizar `web/src/components/CanteenSheet.tsx` para alinhar nomenclatura das regras de negócio e permitir escolha consistente entre retirada no balcão independente e entrega no assento; verificar via `tsc -b` e Playwright.

## 4. Assentos, Checkout, QR Individual, Conta/LGPD e Histórico

- [x] 4.1 Atualizar `web/src/components/SeatSelectionView.tsx` para operar no mapa de `96` poltronas (`A–H`), exibir diferenciação visual `1.5×` para `pcd-plus`, validar documento de meia-entrada no formulário antes de avançar e usar fontes >= 16px nos inputs mobile; verificar no build e Playwright.
- [x] 4.2 Atualizar `web/src/components/CheckoutView.tsx` e `web/src/components/TicketPassView.tsx` para exibir e bloquear expiração do timer `secondsLeft`, simular transição `PENDENTE` -> `ATIVO` (registrando estorno e aviso em `Pix Tardio`) e emitir/renderizar QR Code individual por assento cujo token seja validável na Portaria; verificar no Playwright.
- [x] 4.3 Atualizar `web/src/components/AuthView.tsx` e `web/src/components/ClientOrdersView.tsx` para remover o portal Backstage da tela do cliente, exibir aviso LGPD completo com timestamps dinâmicos e gestão contínua de `marketingOptIn` pós-login, isolar pedidos por `userId`, remover o botão `"Simular avanço"`, adicionar caixa de avisos internos, habilitar edição/exclusão de avaliações e validar regra CDC completa (7 dias da compra + 2h antes da sessão); verificar no Playwright.

## 5. Backstage Operacional (`#/ops`), Navegação, OLED e Orquestração Global

- [x] 5.1 Atualizar `web/src/components/OpsWorkspace.tsx`, `BoxOfficeView.tsx`, `GateScannerView.tsx`, `KdsRunnerView.tsx` e `AdminOccupancyView.tsx` para adicionar barreira inicial de seleção/acesso operacional em `#/ops`, usar capacidade `96` compartilhada na Bilheteria sem `D6` pré-selecionada e com campo documental de meia-entrada, validar sessão/horário na Portaria, corrigir `RN-02`/`RN-03`, restringir fila do Runner a `PRONTO`/`SAIU_PARA_ENTREGA`, converter ocorrências para `RETIRADA_NO_BALCAO` com aviso ao cliente, habilitar gestão de sessões/estoque no Admin e substituir cores hardcoded por variáveis CSS compatíveis com `[data-theme="oled"]`; verificar no Playwright e build.
- [x] 5.2 Atualizar `web/src/components/Header.tsx`, `StepperBar.tsx`, `web/src/styles/tokens.css` e `web/src/App.tsx` para incluir as abas **Cantina** e **Comentários** na barra de navegação, corrigir `aria-current="step"`, alvos >= 44px e anel de foco `#60A5FA`, remover pré-seleções indevidas de assento e integrar todos os estados (catálogo API, pedidos desacoplados, liberação de assentos/estoque no cancelamento CDC, comentários e avisos); verificar com `tsc -b && vite build`.

## 6. Verificação Ponta a Ponta e Conformidade Spec-Guard

- [x] 6.1 Atualizar `web/tests/prototype.spec.ts` e os testes em `tests/catalog/`, `tests/canteen/`, `tests/history/`, `tests/booking/`, `tests/identity/` cobrindo as novas telas e regras corrigidas, executando `npm --prefix web run build`, testes E2E Playwright e `python scripts/spec-guard.py` até todos passarem sem erros.
