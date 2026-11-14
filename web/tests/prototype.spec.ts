import { expect, Page, test } from '@playwright/test';

const SCREENSHOT_DIR = 'test-screenshots';

async function stubOfflineCatalog(page: Page) {
  await page.route('https://itunes.apple.com/**', (route) => route.abort());
}

test.describe('CineFood Aligned MVP E2E Verification', () => {
  test('1. Real movie catalog API (iTunes mock) & offline fallback + Hero UX selection flow', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    let allowAbortedNetworkLog = false;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (allowAbortedNetworkLog && txt.includes('ERR_FAILED')) return;
        consoleErrors.push(txt);
      }
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.setViewportSize({ width: 1440, height: 900 });

    // 1A. Verify real movie catalog loading via iTunes API integration
    await page.route('https://itunes.apple.com/br/rss/topmovies/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          feed: {
            entry: [
              {
                id: { attributes: { 'im:id': '9001' } },
                'im:name': { label: 'Aventura Real API' },
                'im:artist': { label: 'Diretor API' },
                summary: { label: 'Sinopse real retornada pelo catálogo iTunes em português.' },
                category: { attributes: { label: 'Ação' } },
                'im:releaseDate': { label: '2026-12-01' },
                'im:image': [{ label: '/assets/horizon-poster.jpg' }],
              },
              {
                id: { attributes: { 'im:id': '9002' } },
                'im:name': { label: 'Drama Noturno API' },
                'im:artist': { label: 'Diretora API' },
                summary: { label: 'Segunda obra retornada pela API pública gratuita.' },
                category: { attributes: { label: 'Drama' } },
                'im:releaseDate': { label: '2026-11-20' },
                'im:image': [{ label: '/assets/nocturne-poster.jpg' }],
              },
            ],
          },
        }),
      });
    });

    await page.route('https://itunes.apple.com/lookup**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          resultCount: 2,
          results: [
            {
              trackId: 9001,
              trackName: 'Aventura Real API',
              artistName: 'Diretor API',
              longDescription: 'Sinopse completa vinda do lookup iTunes sem chave de API.',
              primaryGenreName: 'Ficção Científica',
              contentAdvisoryRating: '14',
              trackTimeMillis: 7800000,
              artworkUrl100: '/assets/horizon-poster.jpg',
            },
            {
              trackId: 9002,
              trackName: 'Drama Noturno API',
              artistName: 'Diretora API',
              longDescription: 'Suspense atmosférico do catálogo real.',
              primaryGenreName: 'Suspense',
              contentAdvisoryRating: '16',
              trackTimeMillis: 7200000,
              artworkUrl100: '/assets/nocturne-poster.jpg',
            },
          ],
        }),
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('catalog-source-badge')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('AVENTURA REAL API');
    await expect(page.getByText(/A partir de R\$ 40/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Nota da rede 4\.8 de 5/i })).toBeVisible();

    // Filter by format 2D on Hero -> selects movie that has 2D session on 14 DEZ (Drama Noturno API / NOTURNO ESMERALDA)
    await page.getByRole('group', { name: /Filtrar por formato de sala/i }).getByRole('button', { name: '2D' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('DRAMA NOTURNO API');
    await expect(page.getByText(/A partir de R\$ 36/i)).toBeVisible();

    // Unroute and reload with offline fallback
    await page.unroute('https://itunes.apple.com/br/rss/topmovies/**');
    await page.unroute('https://itunes.apple.com/lookup**');
    allowAbortedNetworkLog = true;
    await stubOfflineCatalog(page);

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('catalog-source-badge')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('CIDADE DE FERRO');

    const brokenImagesHome = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).filter((img) => !img.complete || img.naturalWidth === 0).length,
    );
    expect(brokenImagesHome).toBe(0);

    const overflowHome = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowHome).toBe(false);

    // Poster card hover maintains bounding box without distortion
    const deckCard = page.getByRole('button', { name: /Selecionar NOTURNO ESMERALDA/i });
    const boxBefore = await deckCard.boundingBox();
    await deckCard.hover();
    await page.waitForTimeout(240);
    const boxAfter = await deckCard.boundingBox();
    expect(boxBefore).not.toBeNull();
    expect(boxAfter).not.toBeNull();
    if (boxBefore && boxAfter) {
      expect(Math.abs(boxAfter.width - boxBefore.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(boxAfter.height - boxBefore.height)).toBeLessThanOrEqual(1);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-home-hero-desktop.png`, fullPage: false });

    // Date strip filtering: 18 DEZ has 0 sessions -> empty state + Limpar Filtros
    await page.getByRole('button', { name: /18.*DEZ/i }).click();
    await expect(page.getByRole('heading', { name: /Nenhuma sessão encontrada/i })).toBeVisible();
    await page.getByRole('button', { name: /Limpar Filtros/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('CIDADE DE FERRO');

    // Advance card in Hero deck -> NOTURNO ESMERALDA
    await page.getByRole('button', { name: 'Próximo filme' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('NOTURNO ESMERALDA');

    // Navigate to Movie Detail & verify Trailer modal + format 2D filter + hierarchical grouping + multi-movie rail
    await page.getByRole('button', { name: /Ver Detalhes & Horários/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('NOTURNO ESMERALDA');

    await page.getByRole('button', { name: /Assistir Trailer/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /Fechar prévia do trailer/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // Hierarchical grouping: Unidade -> Data -> Horários
    const paulistaGroup = page.locator('section[aria-label="CineFood Paulista IMAX"]');
    await expect(paulistaGroup).toBeVisible();
    await expect(paulistaGroup.getByRole('heading', { name: /14 DEZ/i })).toBeVisible();
    await expect(paulistaGroup.getByRole('button', { name: /22:15/i })).toBeVisible();

    await page.getByRole('group', { name: /Filtrar sessões por formato/i }).getByRole('button', { name: '2D' }).click();
    await expect(paulistaGroup.getByRole('button', { name: /22:15/i })).toBeVisible();

    // Multi-movie quick-switcher rail switches films without returning to Em Cartaz
    const switcher = page.getByRole('region', { name: /Filmes em Cartaz/i });
    await expect(switcher).toBeVisible();
    await switcher.getByRole('button', { name: 'Próximo filme' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ÓRBITA ESCARLATE');

    await page.getByRole('group', { name: /Filtrar sessões por formato/i }).getByRole('button', { name: 'Todos' }).click();
    await switcher.getByRole('button', { name: /CIDADE DE FERRO/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('CIDADE DE FERRO');
    await page.getByRole('group', { name: /Filtrar sessões por data/i }).getByRole('button', { name: /Todas as datas/i }).click();
    await expect(paulistaGroup.getByRole('heading', { name: /14 DEZ/i })).toBeVisible();
    await expect(paulistaGroup.getByRole('heading', { name: /15 DEZ/i })).toBeVisible();
    await expect(page.locator('section[aria-label="CineFood Jardins Atmos"]').getByRole('button', { name: /19:15/i })).toBeVisible();

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('2. SeatSelectionView (96 seats, PCD 1.5x, meiaDoc), CheckoutView (PENDENTE -> ATIVO, Pix Tardio), Individual QR & CDC release', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('ERR_FAILED')) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await stubOfflineCatalog(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Select CIDADE DE FERRO -> Escolher Assentos
    await page.getByRole('button', { name: /Escolher Assentos/i }).click();
    await expect(page.getByText('Escolha o Assento')).toBeVisible();
    await expect(page.getByText(/96 Poltronas \(A–H\)/i)).toBeVisible();

    // Confirm zero pre-selected seats and Avançar is disabled
    await expect(
      page.getByText(/Selecione ao menos uma poltrona disponível no mapa ao lado/i),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Avançar' })).toBeDisabled();

    // Select PCD Obeso 1.5x seat (A12) + first available standard seat in row B/C
    const pcdPlusBtn = page.getByRole('button', { name: /Poltrona A12 PCD Obeso 1\.5x — Disponível/i });
    await pcdPlusBtn.click();
    await expect(page.getByText('PCD 1.5×').first()).toBeVisible();

    const firstAvailableSeat = page.locator('button[aria-label^="Poltrona "][aria-label$="— Disponível"]').first();
    const secondSeatLabel = await firstAvailableSeat.getAttribute('aria-label');
    const secondSeatMatch = secondSeatLabel?.match(/Poltrona ([A-H]\d+)/);
    const secondSeatId = secondSeatMatch?.[1] ?? 'A1';
    await firstAvailableSeat.click();

    // Toggle first seat to Meia and verify meiaDoc validation blocks advancing
    await page.getByRole('button', { name: /Meia \(R\$/i }).first().click();
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(page.locator('#meia-err-A12')).toContainText(/Informe ao menos 4 caracteres do documento de meia-entrada/i);

    // Fill legal meiaDoc
    await page.locator('#meia-doc-A12').fill('BPC-884120');

    // Test lock expiration modal & renewal
    await page.getByRole('button', { name: /Simular fim da trava/i }).click();
    await expect(page.getByRole('dialog', { name: /Trava temporária expirada/i })).toBeVisible();
    await page.getByRole('button', { name: /Renovar Trava/i }).click();
    await expect(page.getByRole('dialog', { name: /Trava temporária expirada/i })).toBeHidden();

    // Advance -> CanteenSheet -> add combo -> CheckoutView
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(page.getByRole('dialog', { name: /Bomboniere e Cantina CineFood/i })).toBeVisible();
    await page.getByRole('button', { name: /Adicionar uma unidade de Combo IMAX Manteiga Trufada/i }).click();
    await page.getByRole('button', { name: /Ir para Pagamento/i }).click();

    await expect(page.getByText(/Ambiente de Homologação \/ Sandbox/i)).toBeVisible();
    await expect(page.getByText(/Trava Temporária de Assentos \(10 min\)/i)).toBeVisible();

    // Test Pix Tardio (RN-01) creates refund alert + notice
    await page.getByRole('button', { name: /Pix Tardio \(RN-01\)/i }).click();
    await page.getByRole('button', { name: /Confirmar Pagamento Simulado/i }).click();
    await expect(page.getByRole('status')).toContainText(/Status: PENDENTE/i);
    await expect(page.getByRole('alert').filter({ hasText: /estorno automático/i })).toBeVisible();

    // Approve normally -> PENDENTE -> ATIVO -> TicketPassView with individual QR per seat
    await page.getByRole('button', { name: /Aprovar Normal/i }).click();
    await page.getByRole('button', { name: /Confirmar Pagamento Simulado/i }).click();
    await expect(page.getByRole('status')).toContainText(/Status: PENDENTE/i);

    await expect(page.getByText(/QR Codes Individuais por Assento \(2\)/i)).toBeVisible();
    await expect(page.getByRole('img', { name: new RegExp(`assento A12 \\(`) })).toBeVisible();
    await expect(page.getByRole('img', { name: new RegExp(`assento ${secondSeatId} \\(`) })).toBeVisible();

    // Toggle OLED mode on ticket pass
    await page.getByRole('button', { name: /Ativar Modo Sala Escura \(OLED\)/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'oled');
    await page.getByRole('button', { name: /Desativar Modo OLED/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Navigate to ClientOrdersView -> verify no "Simular avanço", Pix Tardio notice present, and RN-04 cutoff on ORD-8310
    await page.getByRole('button', { name: /Ver em Meus Ingressos/i }).click();
    await expect(page.getByRole('heading', { name: /Meus Ingressos & LGPD/i })).toBeVisible();
    await expect(page.getByText(/Simular avanço/i)).toHaveCount(0);
    await expect(page.getByText(/Estorno automático por Pix Tardio \(RN-01\)/i)).toBeVisible();
    await expect(page.getByText(/Corte de 2h atingido \(RN-04\)/i)).toBeVisible();

    // Cancel the newly created order via CDC and confirm seat A12 is released back to Disponível
    await page.getByRole('button', { name: /Cancelar Pedido \(CDC/i }).first().click();
    await expect(page.getByRole('dialog', { name: /Confirmar cancelamento CDC/i })).toBeVisible();
    await page.getByRole('button', { name: /Confirmar Estorno Idempotente/i }).click();
    await expect(page.getByText(/Estorno idempotente concluído/i).first()).toBeVisible();
    await expect(page.getByText(/Cancelamento CDC confirmado/i)).toBeVisible();

    // Verify Assentos tab is absent from topbar and verify seats released after selecting a movie session
    await expect(page.getByRole('navigation', { name: /Navegação principal/i }).getByRole('button', { name: /Assentos/i })).toHaveCount(0);
    await page.getByRole('navigation', { name: /Navegação principal/i }).getByRole('button', { name: /Em Cartaz/i }).click();
    await page.getByRole('button', { name: /Escolher Assentos/i }).click();
    await expect(page.getByRole('button', { name: /Poltrona A12 PCD Obeso 1\.5x — Disponível/i })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('3. Standalone Cantina view (ADR-005 counter pickup without ticket)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await stubOfflineCatalog(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Header -> Cantina
    await page.getByRole('navigation', { name: /Navegação principal/i }).getByRole('button', { name: 'Cantina' }).click();
    await expect(page.getByRole('heading', { name: /Cardápio da Bomboniere/i })).toBeVisible();

    // All 13 canteen items render with distinct, loaded product images
    const canteenImages = page.locator('section[aria-label="Vitrine e cardápio da cantina"] article img');
    await expect(canteenImages).toHaveCount(13);
    await expect
      .poll(async () => {
        const stats = await canteenImages.evaluateAll((imgs) =>
          imgs.map((el) => {
            const img = el as HTMLImageElement;
            return {
              src: img.getAttribute('src') ?? '',
              loaded: img.complete && img.naturalWidth > 0,
            };
          }),
        );
        return {
          allLoaded: stats.every((s) => s.loaded),
          uniqueCount: new Set(stats.map((s) => s.src)).size,
        };
      })
      .toEqual({ allLoaded: true, uniqueCount: 13 });

    // Without active ticket, seat delivery is disabled and counter pickup works independently
    await expect(page.getByText(/Entrega no assento requer ingresso ativo/i)).toBeVisible();
    await expect(page.getByRole('radio', { name: /Entregar no meu assento/i })).toBeDisabled();
    await page.getByRole('radio', { name: /Retirada no balcão/i }).click();
    await expect(page.getByRole('radio', { name: /Retirada no balcão/i })).toHaveAttribute('aria-checked', 'true');

    // Filter by category Bebidas and search Soda
    await page.getByRole('tab', { name: /Bebidas/i }).click();
    await page.locator('#canteen-catalog-search').fill('Soda');
    await expect(page.getByRole('heading', { name: /Soda Italiana Frutas Vermelhas 500ml/i })).toBeVisible();

    await page.getByRole('button', { name: /Adicionar uma unidade de Soda Italiana Frutas Vermelhas 500ml/i }).click();
    await page.getByRole('button', { name: /Ramo de hortelã e gelo extra/i }).click();

    await page.getByRole('button', { name: /Finalizar Pedido da Cantina/i }).click();

    // CheckoutView in canteen-only mode (ADR-005)
    await expect(page.getByText(/Bomboniere Expressa/i)).toBeVisible();
    await expect(page.getByText(/Pedido avulso de cantina \(ADR-005\)/i)).toBeVisible();
    await page.getByRole('button', { name: /Confirmar Pagamento Simulado/i }).click();

    // TicketPassView displays pickup token
    await expect(page.getByRole('heading', { name: /PEDIDO DE CANTINA \(BALCÃO\)/i })).toBeVisible();
    await expect(page.getByRole('img', { name: /QR Code opaco de retirada na cantina/i })).toBeVisible();

    // Appears in Meus Ingressos as Somente Cantina
    await page.getByRole('button', { name: /Ver em Meus Ingressos/i }).click();
    await expect(page.getByText('Somente Cantina').first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('4. Catálogo 2-level flow (CommunityReviewsView): grid, ficha, ratings, Ver Sessões, deep-link & RF-13 CRUD', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await stubOfflineCatalog(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Topbar 'Catálogo' opens Level 1 extensive catalog grid
    await page.getByRole('navigation', { name: /Navegação principal/i }).getByRole('button', { name: 'Catálogo' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Catálogo de Filmes/i })).toBeVisible();
    await expect(page.locator('#catalog-search-input')).toBeVisible();
    await expect(page.getByRole('group', { name: /Filtrar catálogo por categoria/i })).toBeVisible();
    await expect(page.getByText('Em Cartaz', { exact: true }).first()).toBeVisible();

    // Filter by category and search
    await page.getByRole('group', { name: /Filtrar catálogo por categoria/i }).getByRole('button', { name: 'Suspense' }).click();
    await expect(page.getByRole('button', { name: /NOTURNO ESMERALDA/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /CIDADE DE FERRO/i })).toHaveCount(0);
    await page.getByRole('group', { name: /Filtrar catálogo por categoria/i }).getByRole('button', { name: 'Todos' }).click();

    await page.locator('#catalog-search-input').fill('ÓRBITA');
    await expect(page.getByRole('button', { name: /ÓRBITA ESCARLATE/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /CIDADE DE FERRO/i })).toHaveCount(0);
    await page.getByRole('button', { name: /Limpar busca/i }).click();
    await expect(page.getByRole('button', { name: /CIDADE DE FERRO/i })).toBeVisible();

    // Open Level 2 ficha for CIDADE DE FERRO -> verify blocked RF-13 state (pending check-in, no ended session)
    await page.getByRole('button', { name: /CIDADE DE FERRO/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /CIDADE DE FERRO/i })).toBeVisible();
    await expect(page.getByLabel('Comparativo de notas do filme')).toContainText('IMDb');
    await expect(page.getByLabel('Comparativo de notas do filme')).toContainText('Rotten Tomatoes');
    await expect(page.getByLabel('Comparativo de notas do filme')).toContainText('Usuários CineFood');
    await page.locator('#catalog-tab-comments').click();
    await expect(page.getByText(/Pré-requisito de entrada validada na portaria \(RF-13\)/i)).toBeVisible();
    await expect(page.locator('#review-eligible-order')).toHaveCount(0);

    // Return to Level 1 grid and open ÓRBITA ESCARLATE ficha
    await page.getByRole('button', { name: /Voltar ao Catálogo/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Catálogo de Filmes/i })).toBeVisible();

    await page.getByRole('button', { name: /ÓRBITA ESCARLATE/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /ÓRBITA ESCARLATE/i })).toBeVisible();
    await expect(page.getByText(/tempestade solar interromper a telemetria orbital/i).first()).toBeVisible();
    await expect(page.getByText('Drama Espacial', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Comparativo de notas do filme')).toContainText('8.6');
    await expect(page.getByLabel('Comparativo de notas do filme')).toContainText('94%');

    // Click "Ver Sessões / Comprar" -> navigates to Sessões with ÓRBITA ESCARLATE selected
    await page.getByRole('button', { name: /Ver Sessões \/ Comprar/i }).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ÓRBITA ESCARLATE');
    await expect(page.getByRole('button', { name: /22:00/i })).toBeVisible();

    // Deep-link from Sessões ("Ver Comentários da Rede") lands on film's "Comentários" sub-tab
    await page.getByRole('button', { name: /Ver Comentários da Rede/i }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: /ÓRBITA ESCARLATE/i })).toBeVisible();
    await expect(page.locator('#catalog-tab-comments')).toHaveAttribute('aria-selected', 'true');

    // Publish review for validated ended session ORD-7904 (ÓRBITA ESCARLATE)
    await expect(page.locator('#review-eligible-order')).toContainText('ORD-7904');
    await page.getByRole('group', { name: /Selecionar nota de 1 a 5 estrelas/i }).getByRole('button', { name: '4 estrelas' }).click();
    await page.locator('#review-comment-input').fill('Experiência IMAX fantástica na Órbita Escarlate, som cristalino.');
    await page.getByRole('button', { name: /Publicar Comentário Verificado/i }).click();

    await expect(page.getByText(/Experiência IMAX fantástica na Órbita Escarlate/i)).toBeVisible();
    await expect(page.getByText(/Sessão Assistida · Entrada Validada/i).first()).toBeVisible();

    // Edit newly created review
    const ownReviewCard = page.locator('article').filter({ hasText: 'Experiência IMAX fantástica na Órbita Escarlate' });
    await ownReviewCard.getByRole('button', { name: 'Editar' }).click();
    const editingCard = page.locator('article').filter({ has: page.getByLabel(/Editar texto do comentário/i) });
    await editingCard.getByLabel(/Editar texto do comentário/i).fill('Texto editado: projeção e entrega silenciosa impecáveis!');
    await editingCard.getByRole('button', { name: /Salvar Alterações/i }).click();
    await expect(page.getByText(/Texto editado: projeção e entrega silenciosa impecáveis!/i)).toBeVisible();

    // Delete review
    const editedCard = page.locator('article').filter({ hasText: 'Texto editado: projeção e entrega silenciosa impecáveis!' });
    await editedCard.getByRole('button', { name: 'Excluir' }).click();
    await editedCard.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText(/Texto editado: projeção e entrega silenciosa impecáveis!/i)).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test('5. Customer AuthView: zero Backstage cards, LGPD notice, marketing opt-in toggle & LGPD DSR', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await stubOfflineCatalog(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Open AuthView
    await page.getByRole('button', { name: /Conta de Joana Silva/i }).click();
    await expect(page.getByText(/Sessão Autenticada/i)).toBeVisible();

    // Confirm zero Backstage / CRM links or buttons in customer AuthView
    await expect(page.getByText(/Abrir CineFood Backstage/i)).toHaveCount(0);
    await expect(page.getByText(/CRM Operacional/i)).toHaveCount(0);
    await expect(page.getByText(/Aviso Completo de Privacidade \(LGPD · RF-17\)/i)).toBeVisible();

    // Toggle marketing opt-in switch
    const marketingSwitch = page.getByRole('switch');
    await expect(marketingSwitch).toHaveAttribute('aria-checked', 'false');
    await marketingSwitch.click();
    await expect(marketingSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText(/Atualizado em/i)).toBeVisible();

    // Logout and inspect Sign-up LGPD transparency
    await page.getByRole('button', { name: /Encerrar Sessão/i }).click();
    await page.getByRole('tab', { name: /Criar Conta \(LGPD\)/i }).click();
    await expect(page.getByRole('heading', { name: /Criar Conta CineFood/i })).toBeVisible();
    await expect(page.getByText(/Ciência Contratual/i)).toBeVisible();
    await expect(page.getByText(/Abrir CineFood Backstage/i)).toHaveCount(0);

    // Quick Demo Login -> LGPD tab -> generate protocol
    await page.getByRole('tab', { name: 'Entrar' }).click();
    await page.getByRole('button', { name: /Acesso Rápido Demo \(Joana\)/i }).click();
    await page.getByRole('tab', { name: /Direitos LGPD/i }).click();
    await page.getByRole('button', { name: /Eliminação de Dados Dispensáveis/i }).click();
    await page.getByLabel(/Descrição da solicitação/i).fill('Solicito eliminação de dados opcionais mantendo nota fiscal.');
    await page.getByRole('button', { name: /Gerar Protocolo LGPD/i }).click();
    await expect(page.getByRole('status')).toContainText(/protocolo/i);
    await expect(page.getByText(/LGPD-2026-49101/)).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('6. Isolated #/ops OpsWorkspace: station gate (1234 PIN), RBAC roles, BoxOffice (no D6), Gate (RN-02), KDS/Runner (RN-03), Admin', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await stubOfflineCatalog(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Confirm Consumer Web nav has zero internal staff/CRM links
    await expect(page.getByRole('navigation', { name: /Navegação principal/i }).getByRole('button', { name: /Operação|Backstage/i })).toHaveCount(0);

    // Enter isolated #/ops
    await page.goto('/#/ops', { waitUntil: 'networkidle' });
    await expect(page.getByRole('navigation', { name: /Navegação principal/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /CineFood Backstage · Login de Estação/i })).toBeVisible();

    // Invalid PIN check
    await page.locator('#ops-pin-input').fill('0000');
    await page.getByRole('button', { name: /Confirmar e Entrar na Estação/i }).click();
    await expect(page.getByRole('alert')).toContainText(/PIN operacional inválido/i);

    // Login as OPERADOR_PORTARIA (1234) -> only Portaria QR enabled
    await page.getByRole('button', { name: /OPERADOR_PORTARIA/i }).click();
    await page.locator('#ops-pin-input').fill('1234');
    await page.getByRole('button', { name: /Confirmar e Entrar na Estação/i }).click();
    await expect(page.getByRole('heading', { name: /Portaria & Leitor QR/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Bilheteria/i })).toBeDisabled();
    await expect(page.getByRole('tab', { name: /Cantina KDS & Runner/i })).toBeDisabled();
    await expect(page.getByRole('tab', { name: /Painel Admin/i })).toBeDisabled();

    // Switch station -> OPERADOR_CANTINA -> KDS active, Runner sub-tab disabled
    await page.getByRole('button', { name: /Encerrar Turno \/ Trocar Estação/i }).click();
    await page.getByRole('button', { name: /OPERADOR_CANTINA/i }).click();
    await page.getByRole('button', { name: /Confirmar e Entrar na Estação/i }).click();
    await expect(page.getByRole('tab', { name: /Cozinha KDS/i })).toBeEnabled();
    await expect(page.getByRole('tab', { name: /Runner · OLED/i })).toBeDisabled();

    // Switch station -> RUNNER -> Runner sub-tab active, Cozinha KDS sub-tab disabled
    await page.getByRole('button', { name: /Encerrar Turno \/ Trocar Estação/i }).click();
    await page.getByRole('button', { name: /SALA · RUNNER OLED/i }).click();
    await page.getByRole('button', { name: /Confirmar e Entrar na Estação/i }).click();
    await expect(page.getByRole('tab', { name: /Runner · OLED/i })).toBeEnabled();
    await expect(page.getByRole('tab', { name: /Cozinha KDS/i })).toBeDisabled();

    // Switch station -> ADMIN_CINEMA -> full operational verification
    await page.getByRole('button', { name: /Encerrar Turno \/ Trocar Estação/i }).click();
    await page.getByRole('button', { name: /ADMIN_CINEMA/i }).click();
    await page.getByRole('button', { name: /Confirmar e Entrar na Estação/i }).click();

    await expect(page.getByText(/Backstage CRM · Ops/i)).toBeVisible();

    // A. Bilheteria: confirm NO pre-selected D6, requires seat + meiaDoc + check to emit
    await page.getByRole('tab', { name: /Bilheteria/i }).click();
    await expect(page.getByRole('heading', { name: /Bilheteria Assistida/i })).toBeVisible();
    await expect(page.getByText(/nenhum assento/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Emitir Ingresso na Bilheteria/i })).toBeDisabled();

    const boxSeat = page.locator('button[aria-label^="Poltrona "][aria-label$="— Disponível"]').first();
    await boxSeat.click();
    await page.getByRole('button', { name: /Meia 50%/i }).click();
    await expect(page.getByRole('button', { name: /Emitir Ingresso na Bilheteria/i })).toBeDisabled();
    await page.locator('#box-meia-doc').fill('CIE-551020');
    await page.getByLabel(/Documento comprobatório original conferido/i).check();
    await page.getByRole('button', { name: /Emitir Ingresso na Bilheteria/i }).click();
    await expect(page.getByText(/Ingresso emitido \(ORD-/i)).toBeVisible();

    // B. KDS before check-in -> RN-02 block on ORD-8492
    await page.getByRole('tab', { name: /Cantina KDS & Runner/i }).click();
    await expect(page.getByText(/Bloqueado pela RN-02 — aguardando validação na portaria/i)).toBeVisible();

    // C. Portaria QR -> validate session mismatch, then valid RN-02 check-in, then duplicate
    await page.getByRole('tab', { name: /Portaria QR/i }).click();
    await page.locator('#gate-session-filter').selectOption('cf-imax-2140');
    await page.getByRole('button', { name: /Validar Entrada/i }).click();
    await expect(page.getByRole('heading', { name: /Ingresso de Outra Sessão/i })).toBeVisible();

    await page.locator('#gate-session-filter').selectOption('ALL');
    await page.getByRole('button', { name: /Validar Entrada/i }).click();
    await expect(page.getByRole('heading', { name: /Entrada Liberada/i })).toBeVisible();
    await expect(page.getByText(/RN-02: Cantina KDS liberada \(EM_PREPARO\)/i)).toBeVisible();

    await page.getByRole('button', { name: /Validar Entrada/i }).click();
    await expect(page.getByRole('heading', { name: /QR Já Utilizado/i })).toBeVisible();

    // D. KDS advance (EM_PREPARO -> PRONTO -> SAIU_PARA_ENTREGA) + Runner OLED RN-03 CLIENTE_AUSENTE
    await page.getByRole('tab', { name: /Cantina KDS & Runner/i }).click();
    const ord8492Card = page.locator('article').filter({ hasText: 'ORD-8492' });
    await ord8492Card.getByRole('button', { name: /Marcar Pronto \(PRONTO\)/i }).click();
    await ord8492Card.getByRole('button', { name: /Despachar para Runner \(SAIU_PARA_ENTREGA\)/i }).click();

    await page.getByRole('tab', { name: /Runner · OLED/i }).click();
    await expect(page.getByRole('heading', { name: /Modo Sala Escura OLED/i })).toBeVisible();
    await page.locator('#runner-order').selectOption('ORD-8492');
    await page.locator('#runner-reason').selectOption('CLIENTE_AUSENTE');
    await page.locator('#runner-notes').fill('Cliente não localizado nas poltronas G7, G8 durante sessão.');
    await page.getByRole('button', { name: /Registrar Ocorrência/i }).click();
    await expect(page.getByText(/RN-03 aplicada: pedido ORD-8492 .* convertido para RETIRADA_NO_BALCAO/i)).toBeVisible();

    // E. Admin Panel: session status toggle, price adjustment, canteen stock edit & CDC summary
    await page.getByRole('tab', { name: /Painel Admin/i }).click();
    await expect(page.getByRole('heading', { name: /Painel Admin/i })).toBeVisible();
    await expect(page.getByText(/Estornos \/ Cancelamentos \(CDC\)/i)).toBeVisible();

    const firstStatusSelect = page.getByLabel(/Status da sessão/i).first();
    await firstStatusSelect.selectOption('INATIVA');
    await expect(page.getByRole('status')).toContainText(/Status da sessão alterado para INATIVA/i);
    await firstStatusSelect.selectOption('ATIVA');

    await page.getByRole('button', { name: /Aumentar preço da sessão/i }).first().click();
    await expect(page.getByRole('status')).toContainText(/Tarifa atualizada/i);

    await page.getByRole('button', { name: /Reduzir estoque de Combo IMAX Manteiga Trufada/i }).click();
    await expect(page.getByRole('status')).toContainText(/Estoque de "Combo IMAX Manteiga Trufada" atualizado/i);

    // Return cleanly to storefront
    await page.getByRole('button', { name: /Voltar para Loja Web/i }).click();
    await expect(page.getByRole('navigation', { name: /Navegação principal/i })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('7. Mobile 390x844 navigation drawer (Cantina/Catálogo, zero Backstage), Sessões switcher, SeatMap & #/ops Admin without horizontal overflow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await stubOfflineCatalog(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const overflowMobileHome = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowMobileHome).toBe(false);

    // Mobile drawer contains Cantina & Catálogo and zero Backstage links
    await page.getByRole('button', { name: /Abrir menu de navegação/i }).click();
    const mobileNav = page.getByRole('dialog', { name: /Menu de navegação CineFood/i });
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole('button', { name: 'Cantina' })).toBeVisible();
    await expect(mobileNav.getByRole('button', { name: 'Catálogo' })).toBeVisible();
    await expect(mobileNav.getByRole('button', { name: 'Assentos' })).toHaveCount(0);
    await expect(mobileNav.getByRole('button', { name: /Backstage/i })).toHaveCount(0);

    await mobileNav.getByRole('button', { name: 'Catálogo' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Catálogo de Filmes/i })).toBeVisible();
    const overflowMobileCatalog = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowMobileCatalog).toBe(false);

    await page.getByRole('button', { name: /Abrir menu de navegação/i }).click();
    await page.getByRole('dialog', { name: /Menu de navegação CineFood/i }).getByRole('button', { name: 'Cantina' }).click();
    await expect(page.getByRole('heading', { name: /Cardápio da Bomboniere/i })).toBeVisible();
    const overflowMobileCanteen = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowMobileCanteen).toBe(false);

    await page.getByRole('button', { name: /Abrir menu de navegação/i }).click();
    await page.getByRole('dialog', { name: /Menu de navegação CineFood/i }).getByRole('button', { name: 'Sessões' }).click();
    await expect(page.getByRole('region', { name: /Filmes em Cartaz/i })).toBeVisible();
    const overflowMobileSessions = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowMobileSessions).toBe(false);

    await page.getByRole('button', { name: /Abrir menu de navegação/i }).click();
    await page.getByRole('dialog', { name: /Menu de navegação CineFood/i }).getByRole('button', { name: 'Em Cartaz' }).click();
    await page.getByRole('button', { name: /Escolher Assentos/i }).click();
    await expect(page.getByRole('button', { name: 'Avançar' })).toBeVisible();
    const overflowMobileSeats = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowMobileSeats).toBe(false);

    // Isolated #/ops Admin mobile responsiveness check
    await page.goto('/#/ops', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /ADMIN_CINEMA/i }).click();
    await page.locator('#ops-pin-input').fill('1234');
    await page.getByRole('button', { name: /Confirmar e Entrar na Estação/i }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await page.getByRole('heading', { name: /Grade de Sessões/i }).scrollIntoViewIfNeeded();
    const overflowMobileAdmin = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowMobileAdmin).toBe(false);

    expect(errors).toEqual([]);
  });
});
