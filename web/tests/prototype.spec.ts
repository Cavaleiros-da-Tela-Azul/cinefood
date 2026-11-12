import { expect, test } from '@playwright/test';

const SCREENSHOT_DIR = 'test-screenshots';

test.describe('CineFood Prototype E2E & Phase 1 Hardening Inspection', () => {
  test('Desktop 1440x900 full 4-step journey + filters + meia + expire + RN-01 + screenshots', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const brokenImagesHome = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).filter((img) => !img.complete || img.naturalWidth === 0).length,
    );
    expect(brokenImagesHome).toBe(0);

    const overflowHome = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowHome).toBe(false);

    // Verify poster card hover keeps dimensions intact (no squash/stretch layout distortion)
    const deckCard = page.getByRole('button', { name: /Selecionar NOTURNO ESMERALDA/i });
    const boxBefore = await deckCard.boundingBox();
    await deckCard.hover();
    await page.waitForTimeout(260);
    const boxAfter = await deckCard.boundingBox();
    expect(boxBefore).not.toBeNull();
    expect(boxAfter).not.toBeNull();
    if (boxBefore && boxAfter) {
      expect(Math.abs(boxAfter.width - boxBefore.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(boxAfter.height - boxBefore.height)).toBeLessThanOrEqual(1);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-home-hero-desktop.png`, fullPage: false });

    // Date strip filtering: 18 DEZ has 0 sessions -> empty state + recovery
    await page.getByRole('button', { name: /18.*DEZ/i }).click();
    await expect(page.getByRole('heading', { name: /Nenhuma sessão encontrada/i })).toBeVisible();
    await page.getByRole('button', { name: /Limpar Filtros/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('CIDADE DE FERRO');

    // Advance card in Hero deck
    await page.getByRole('button', { name: 'Próximo filme' }).click();
    await page.waitForTimeout(450);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('NOTURNO ESMERALDA');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01b-home-hero-next-desktop.png`, fullPage: false });

    // Enter Movie Detail
    await page.getByRole('button', { name: /Ver Detalhes/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('NOTURNO ESMERALDA');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-movie-detail-desktop.png`, fullPage: false });

    // Open and close Trailer modal
    await page.getByRole('button', { name: /Assistir Trailer/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /Fechar prévia/i }).click();

    // Select a session -> Seat Map
    await page.getByRole('button', { name: /20:30/i }).click();
    await expect(page.getByText('Escolha o Assento')).toBeVisible();

    // Select PCD seat A1, toggle Meia-Entrada, and fill legal document ID
    await page.getByRole('button', { name: /Poltrona A1 PCD Cadeirante/i }).click();
    await page.getByRole('button', { name: /Meia \(R\$ 20\)/i }).first().click();
    await page.getByPlaceholder(/Ex: CIE-/i).first().fill('CIE-994120');

    // Test Timer Expiration modal -> Renew (+10m)
    await page.getByRole('button', { name: /Simular fim da trava/i }).click();
    await expect(page.getByRole('dialog', { name: /Trava temporária expirada/i })).toBeVisible();
    await page.getByRole('button', { name: /Renovar Trava/i }).click();
    await expect(page.getByRole('dialog', { name: /Trava temporária expirada/i })).toBeHidden();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-seat-map-desktop.png`, fullPage: false });

    // Open Canteen Sheet (Step 2)
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(page.getByRole('dialog', { name: /Bomboniere/i })).toBeVisible();
    await page.getByRole('button', { name: /Adicionar uma unidade de Combo IMAX/i }).click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-canteen-sheet-desktop.png`, fullPage: false });

    // Go to Checkout (Step 3) & verify RN-01 Late Pix simulation + normal approval
    await page.getByRole('button', { name: /Ir para Pagamento/i }).click();
    await expect(page.getByRole('dialog', { name: /Bomboniere/i })).toBeHidden();
    await expect(page.getByText(/Ambiente de Homologação \/ Sandbox/i)).toBeVisible();

    await page.getByRole('button', { name: /Pix Tardio \(RN-01\)/i }).click();
    await page.getByRole('button', { name: /Confirmar Pagamento Simulado/i }).click();
    await expect(page.getByRole('alert')).toContainText('estorno automático');
    await page.getByRole('button', { name: /Aprovar Normal/i }).click();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-checkout-sandbox-desktop.png`, fullPage: false });

    // Confirm Payment -> Digital QR Ticket (Step 4) + OLED mode
    await page.getByRole('button', { name: /Confirmar Pagamento Simulado/i }).click();
    await expect(page.getByRole('img', { name: /QR Code opaco/i })).toBeVisible();
    await page.getByRole('button', { name: /Ativar Modo Sala Escura/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'oled');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-ticket-oled-desktop.png`, fullPage: false });

    // Fase 2: Navigate to Client Portal (Meus Ingressos) & verify created order + CDC Cancellation + Reviews + LGPD
    await page.getByRole('button', { name: /Ver em Meus Ingressos/i }).click();
    await expect(page.getByRole('heading', { name: /Meus Ingressos & LGPD/i })).toBeVisible();
    await expect(page.getByText(/Corte de 2h atingido \(RN-04\)/i)).toBeVisible();

    // Cancel eligible active order via CDC modal
    await page.getByRole('button', { name: /Cancelar Pedido \(CDC/i }).first().click();
    await expect(page.getByRole('dialog', { name: /Confirmar cancelamento CDC/i })).toBeVisible();
    await page.getByRole('button', { name: /Confirmar Estorno Idempotente/i }).click();
    await expect(page.getByText(/Estorno idempotente concluído/i).first()).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-client-orders-desktop.png`, fullPage: false });

    // Post-session review tab (RF-13)
    await page.getByRole('tab', { name: /Avaliação Pós-Sessão/i }).click();
    await page.getByRole('radio', { name: '5 estrelas' }).click();
    await page.getByLabel(/Comentário opcional/i).fill('Som IMAX excelente e entrega no assento sem ruído.');
    await page.getByRole('button', { name: /Enviar Avaliação Pós-Sessão/i }).click();
    await expect(page.getByText(/Avaliação registrada: 5\/5 estrelas/i)).toBeVisible();

    // LGPD Data Subject Rights tab (RF-18)
    await page.getByRole('tab', { name: /Direitos LGPD/i }).click();
    await page.getByRole('button', { name: /Anonimização/i }).click();
    await page.getByLabel(/Descrição da solicitação/i).fill('Solicito anonimização do histórico concluído.');
    await page.getByRole('button', { name: /Gerar Protocolo LGPD/i }).click();
    await expect(page.getByRole('status')).toContainText(/protocolo/i);
    await expect(page.getByText(/LGPD-2026-49101/)).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-client-lgpd-desktop.png`, fullPage: false });

    // Auth View (RF-01 + RF-17)
    await page.getByRole('button', { name: /Conta de/i }).click();
    await expect(page.getByText(/Sessão Autenticada/i)).toBeVisible();
    await page.getByRole('button', { name: /Encerrar Sessão/i }).click();
    await page.getByRole('tab', { name: /Criar Conta \(LGPD\)/i }).click();
    await expect(page.getByRole('heading', { name: /Criar Conta CineFood/i })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-auth-signup-lgpd-desktop.png`, fullPage: false });

    expect(errors).toEqual([]);
  });

  test('Mobile 390x844 drawer + sticky seat bottom bar + Worst Case break-ui toggle without horizontal overflow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const overflowMobileHome = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowMobileHome).toBe(false);

    // Open mobile navigation drawer & enable Pior Caso (break-ui)
    await page.getByRole('button', { name: /Abrir menu de navegação/i }).click();
    await expect(page.getByRole('dialog', { name: /Menu de navegação/i })).toBeVisible();
    await page.getByRole('button', { name: /Modo Pior Caso/i }).click();
    await page.getByRole('button', { name: /Fechar menu de navegação/i }).click();

    const overflowWorstHome = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowWorstHome).toBe(false);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-home-mobile.png`, fullPage: false });

    // Open seats on mobile and confirm fixed thumb-zone bottom bar + zero overflow
    await page.getByRole('button', { name: /Escolher Assentos/i }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: 'Avançar' })).toBeVisible();
    const overflowMobileSeats = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowMobileSeats).toBe(false);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-seats-mobile.png`, fullPage: false });

    // Mobile check on isolated Backstage CRM stacked table view
    await page.getByRole('button', { name: /Abrir menu de navegação/i }).click();
    await page.getByRole('button', { name: /CineFood Backstage/i }).click();
    await page.getByRole('tab', { name: /Painel Admin/i }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await page.getByRole('heading', { name: /Grade de Sessões/i }).scrollIntoViewIfNeeded();
    const overflowMobileAdmin = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowMobileAdmin).toBe(false);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/16-ops-admin-mobile.png`, fullPage: false });

    expect(errors).toEqual([]);
  });

  test('Fase 3 Isolated Backstage CRM + RBAC User Groups (Portaria QR, Bilheteria, KDS & Runner OLED, Admin)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Confirm Consumer Web nav has zero internal staff/CRM links
    await expect(page.getByRole('navigation', { name: /Navegação principal/i }).getByRole('button', { name: /Operação/i })).toHaveCount(0);

    // Enter isolated Backstage CRM via external-portal switcher (customer Header disappears)
    await page.getByRole('button', { name: /Abrir CineFood Backstage/i }).click();
    await expect(page.getByRole('navigation', { name: /Navegação principal/i })).toHaveCount(0);
    await expect(page.getByText(/Backstage CRM · Ops/i)).toBeVisible();

    // Verify RBAC group isolation: switch to PORTEIRO group and verify other modules are disabled
    const roleSelect = page.getByLabel(/Grupo de Usuário \(RBAC\)/i);
    await roleSelect.selectOption('PORTEIRO');
    await expect(page.getByRole('heading', { name: /Portaria & Leitor QR/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Bilheteria/i })).toBeDisabled();
    await expect(page.getByRole('tab', { name: /Painel Admin/i })).toBeDisabled();

    // Switch back to ADMIN supervisor group for cross-station verification
    await roleSelect.selectOption('ADMIN');
    await expect(page.getByRole('tab', { name: /Cantina KDS & Runner/i })).toBeEnabled();

    // 1. Validate RN-03 block on KDS BEFORE gate check-in for ORD-8492
    await page.getByRole('tab', { name: /Cantina KDS & Runner/i }).click();
    await expect(page.getByText(/Bloqueado pela RN-03 — aguardando validação na portaria/i)).toBeVisible();

    // 2. Portaria QR atomic validation (CF-QR-8492-NE -> unlocks EM_PREPARO; second scan -> DUPLICADO)
    await page.getByRole('tab', { name: /Portaria QR/i }).click();
    await page.getByRole('button', { name: /Validar Entrada/i }).click();
    await expect(page.getByRole('heading', { name: /Entrada Liberada/i })).toBeVisible();
    await expect(page.getByText(/RN-02: Cantina KDS liberada \(EM_PREPARO\)/i)).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/12-ops-portaria-qr-desktop.png`, fullPage: false });

    await page.getByRole('button', { name: /Validar Entrada/i }).click();
    await expect(page.getByRole('heading', { name: /QR Já Utilizado/i })).toBeVisible();

    // 3. Bilheteria Assisted Sale + Meia-Entrada (#10)
    await page.getByRole('tab', { name: /Bilheteria/i }).click();
    await expect(page.getByRole('heading', { name: /Bilheteria Assistida/i })).toBeVisible();
    await page.getByRole('button', { name: /Meia-Entrada 50%/i }).click();
    await page.getByRole('button', { name: /Emitir Ingresso na Bilheteria/i }).click();
    await expect(page.getByText(/Ingresso emitido \(ORD-/i)).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/13-ops-bilheteria-desktop.png`, fullPage: false });

    // 4. Cantina KDS advance + Runner OLED Dark Mode + RF-20 Incident (#17)
    await page.getByRole('tab', { name: /Cantina KDS & Runner/i }).click();
    await page.getByRole('button', { name: /Liberar para Runner \(EM_ENTREGA\)/i }).click();
    await page.getByRole('tab', { name: /Runner · OLED/i }).click();
    await expect(page.getByRole('heading', { name: /Modo Sala Escura OLED/i })).toBeVisible();
    await page.getByLabel(/Observação para a Supervisão/i).fill('Cliente solicitou entrega silenciosa no corredor G.');
    await page.getByRole('button', { name: /Registrar Ocorrência/i }).click();
    await expect(page.getByText(/Ocorrência registrada para ORD-8492/i)).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/14-ops-runner-oled-desktop.png`, fullPage: false });

    // Confirm delivery in Runner OLED
    await page.getByRole('button', { name: /Confirmar Entrega/i }).click();

    // 5. Painel Admin Occupancy Table & Dynamic Pricing (#18)
    await page.getByRole('tab', { name: /Painel Admin/i }).click();
    await expect(page.getByRole('heading', { name: /Painel Admin/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    const firstIncreaseBtn = page.getByRole('button', { name: /Aumentar preço da sessão/i }).first();
    await firstIncreaseBtn.click();
    await expect(page.getByRole('status')).toContainText(/Tarifa atualizada/i);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/15-ops-admin-desktop.png`, fullPage: false });

    // Return cleanly to Storefront Web
    await page.getByRole('button', { name: /Voltar para Loja Web/i }).click();
    await expect(page.getByRole('navigation', { name: /Navegação principal/i })).toBeVisible();

    expect(errors).toEqual([]);
  });
});
