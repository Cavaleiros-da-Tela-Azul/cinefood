import os
import sys

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

print("Starting generation of CineFood benchmarked prototype...")

# Read the template parts or write directly
# Let's write the complete, immaculate HTML file
output_path = 'cinefood/docs/prototipo/index.html'

html_code = """<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>CineFood — Multiplex & Alta Gastronomia na Poltrona (Benchmark Global)</title>
  
  <!-- Google Fonts: Oswald, Work Sans, Playfair, Baskerville-like Cormorant, Space Grotesk, Plus Jakarta Sans, JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400;1,600&family=JetBrains+Mono:wght@400;600;800&family=Oswald:wght@500;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700;800&family=Work+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            cine: {
              // Paleta Geral Neutra Dark
              canvas: '#0B0B12',
              canvasDeep: '#050508',
              surfaceN1: '#12100D',
              surfaceN2: '#1B1B3A',
              surfaceN3: '#24244E',
              border: '#27272A',
              textPrimary: '#FFFFFF',
              textSecondary: '#94A3B8',
              textMuted: '#64748B',
              
              // Alamo Drafthouse Tokens
              alamoGold: '#F5B324',
              alamoDark: '#090909',
              alamoBorder: '#3F3F46',
              
              // Everyman Cinemas Tokens
              everymanRose: '#EE9CA6',
              everymanBlush: '#EFCFD3',
              everymanEspresso: '#212020',
              everymanCard: '#1E1B1B',
              
              // AMC & Cinemark Tokens
              amcRed: '#CE0E2D',
              cinemarkCrimson: '#BE0D0D',
              cinemarkAccent: '#FF3939',
              formatCyan: '#06B6D4',
              formatBlue: '#3B82F6',
              
              // Paleta Oficial Solar Sunset do Usuário
              sunsetOrange: '#FF4D00',
              sunsetAmber: '#FF9F1C',
              sunsetGold: '#FFD166',
              sunsetIndigo: '#1B1B3A',
              sunsetVoid: '#0B0B12',
              
              // Sucesso e PCD
              success: '#00E054',
              accessible: '#2563EB'
            }
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
            headline: ['"Oswald"', 'sans-serif'],
            bento: ['"Space Grotesk"', 'sans-serif']
          }
        }
      }
    }
  </script>

  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    /* Emil Kowalski Design Engineering Rules */
    :root {
      --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
      --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
    }

    * {
      -webkit-tap-highlight-color: transparent;
      box-sizing: border-box;
    }

    body {
      background-color: #0B0B12;
      color: #F8FAFC;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      touch-action: manipulation;
      overflow-x: hidden;
    }

    /* Tabular Nums for dynamic counters & prices to prevent horizontal jitter */
    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }

    /* Spring-like tactile press feedback on active interactive elements */
    button, [role="button"], .interactive-press {
      transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out), border-color 160ms var(--ease-out), color 160ms var(--ease-out);
    }
    button:active, [role="button"]:active, .interactive-press:active {
      transform: scale(0.97);
    }

    /* Accessible focus indicator */
    :focus-visible {
      outline: 2px solid #FF9F1C !important;
      outline-offset: 2px !important;
    }

    /* Custom Scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #090909;
    }
    ::-webkit-scrollbar-thumb {
      background: #27272A;
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #3F3F46;
    }

    /* Seat state transitions */
    .seat-btn {
      transition: transform 150ms var(--ease-out), background-color 150ms var(--ease-out);
    }
    .seat-btn:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    /* Glow utilities */
    .glow-sunset {
      box-shadow: 0 0 35px -5px rgba(255, 77, 0, 0.35);
    }
    .glow-alamo {
      box-shadow: 0 0 25px -5px rgba(245, 179, 36, 0.3);
    }
    .glow-amc {
      box-shadow: 0 0 30px -5px rgba(206, 14, 45, 0.35);
    }
  </style>
</head>
<body data-archetype="solar-sunset" class="min-h-screen flex flex-col">

  <!-- ACCESSIBILITY SKIP-LINK -->
  <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 px-4 py-2 bg-cine-accessible text-white font-bold rounded-lg shadow-2xl">
    Pular para o conteúdo principal
  </a>

  <!-- ==================================================== -->
  <!-- TOP BENCHMARK EXPLORER BAR: 4 RADICAL ARCHITECTURES -->
  <!-- ==================================================== -->
  <aside id="benchmark-bar" class="bg-black/95 border-b border-zinc-800 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-50 sticky top-0 backdrop-blur-md">
    <div class="flex items-center gap-2.5">
      <div class="w-2.5 h-2.5 rounded-full bg-cine-sunsetOrange animate-pulse shadow-md shadow-cine-sunsetOrange/50"></div>
      <span class="font-extrabold uppercase tracking-widest text-[11px] text-zinc-100 flex items-center gap-1.5">
        <i data-lucide="layers" class="w-3.5 h-3.5 text-cine-sunsetAmber"></i> 4 Arquiteturas de Cinema:
      </span>
      <span class="text-zinc-400 text-[11px] hidden lg:inline">Extraídas via Firecrawl & Paleta Oficial:</span>
    </div>

    <!-- 4 Radical Layout Switchers -->
    <div class="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/90 border border-zinc-700/80 overflow-x-auto max-w-full">
      <button onclick="setArchetype('solar-sunset')" id="btn-arch-sunset" class="px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white shadow-md shadow-cine-sunsetOrange/30 active:scale-[0.97]" title="Opção 4: Bento Grid Solar (#FF4D00, #FF9F1C, #FFD166, #1B1B3A, #0B0B12)">
        <i data-lucide="sun" class="w-3.5 h-3.5 text-cine-sunsetGold"></i>
        <span>1. Solar Sunset (Bento)</span>
      </button>

      <button onclick="setArchetype('boutique-gold')" id="btn-arch-boutique" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white active:scale-[0.97]" title="Opção 1: Alamo Drafthouse Dine-In Gazette (Tabela Horária, Quinas Retas 0px, Fundo #090909 e Ouro #F5B324)">
        <i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-400"></i>
        <span>2. Alamo Dine-In</span>
      </button>

      <button onclick="setArchetype('cyber-imax')" id="btn-arch-cyber" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white active:scale-[0.97]" title="Opção 2: Everyman Boutique Velvet Lounge (Hospitalidade Britânica, Sofás Duplos, Rosa #EE9CA6, Serifa Baskerville)">
        <i data-lucide="armchair" class="w-3.5 h-3.5 text-rose-300"></i>
        <span>3. Everyman Velvet</span>
      </button>

      <button onclick="setArchetype('cinephile-minimal')" id="btn-arch-cinephile" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white active:scale-[0.97]" title="Opção 3: AMC & Cinemark Megaplex (Radar de Formatos IMAX/Dolby/XD, Widescreen 21:9, Vermelho #CE0E2D, Stadium Pills)">
        <i data-lucide="tv" class="w-3.5 h-3.5 text-red-500"></i>
        <span>4. AMC / Cinemark</span>
      </button>
    </div>
  </aside>

  <!-- ============================================== -->
  <!-- MAIN APP HEADER -->
  <!-- ============================================== -->
  <header class="bg-[#0B0B12] border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
    <div class="flex items-center gap-6">
      <!-- BESPOKE BRAND LOGOMARK -->
      <div class="flex items-center gap-3 cursor-pointer group" onclick="switchView('catalog');">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cine-sunsetOrange via-cine-sunsetAmber to-cine-sunsetGold flex items-center justify-center shadow-lg shadow-cine-sunsetOrange/25 group-hover:scale-105 transition duration-200">
          <i data-lucide="popcorn" class="w-5 h-5 text-white"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl font-black tracking-tight text-white font-bento leading-none">
              CINE<span class="text-transparent bg-clip-text bg-gradient-to-r from-cine-sunsetAmber to-cine-sunsetGold">FOOD</span>
            </span>
            <span class="text-[9px] px-2 py-0.5 rounded-full bg-cine-sunsetOrange/20 text-cine-sunsetGold font-extrabold border border-cine-sunsetOrange/40 uppercase tracking-widest">
              Dine-In Hub
            </span>
          </div>
          <span class="block text-[11px] text-zinc-400 font-medium tracking-wide mt-0.5">
            Multiplex & Gastronomia na Poltrona
          </span>
        </div>
      </div>

      <!-- DUAL ENTRY: POR FILME VS POR COMPLEXO -->
      <div class="hidden md:flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold">
        <button id="entry-by-movie" onclick="setDualEntry('movie')" class="px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-bold shadow-sm flex items-center gap-1.5 transition">
          <i data-lucide="film" class="w-3.5 h-3.5 text-cine-sunsetAmber"></i> Por Filme
        </button>
        <button id="entry-by-cinema" onclick="setDualEntry('cinema')" class="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white flex items-center gap-1.5 transition">
          <i data-lucide="map-pin" class="w-3.5 h-3.5 text-zinc-500"></i> Por Complexo / Shopping
        </button>
      </div>
    </div>

    <!-- UTILITY SHORTCUTS -->
    <div class="flex items-center gap-2.5">
      <!-- Gastronomy Quick Drawer Shortcut -->
      <button onclick="openConcessionDrawer()" class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cine-sunsetOrange/15 to-cine-sunsetAmber/15 hover:from-cine-sunsetOrange/25 hover:to-cine-sunsetAmber/25 border border-cine-sunsetOrange/40 text-xs text-cine-sunsetGold font-bold flex items-center gap-2 transition active:scale-[0.97]" title="Abrir Cardápio de Poltrona">
        <i data-lucide="utensils" class="w-3.5 h-3.5 text-cine-sunsetAmber"></i>
        <span class="hidden sm:inline">Cardápio de Poltrona</span>
      </button>

      <!-- In-Theater Silent Mode (Alamo AFCA protocol) -->
      <button id="btn-theater-mode" onclick="toggleTheaterMode()" class="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 transition active:scale-[0.97]" title="Ativar Modo Sala Escura (0 cd/m² OLED)">
        <i data-lucide="moon" class="w-3.5 h-3.5 text-cine-sunsetGold"></i>
        <span class="hidden md:inline">Modo Sala Escura</span>
      </button>

      <!-- User Profile Badge -->
      <div class="flex items-center gap-2 pl-2 border-l border-zinc-800">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cine-sunsetOrange to-cine-sunsetAmber text-white font-bold text-xs flex items-center justify-center shadow-md">
          CF
        </div>
      </div>
    </div>
  </header>

  <!-- IN-THEATER SILENT STATUS BANNER -->
  <aside id="banner-theater-mode" class="hidden bg-black border-b border-zinc-800 px-4 py-2 text-center text-xs text-zinc-400 flex flex-wrap items-center justify-center gap-3">
    <span class="inline-flex items-center gap-1.5 text-cine-sunsetAmber font-bold">
      <i data-lucide="moon" class="w-3.5 h-3.5"></i> Protocolo In-Theater Ativo:
    </span>
    <span>OLED absoluto (0 cd/m²), tipografia atenuada e vibração silenciosa para não incomodar outros espectadores.</span>
    <button onclick="quickRepeatLastOrder()" class="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-[11px] flex items-center gap-1 transition active:scale-[0.97]">
      <i data-lucide="repeat" class="w-3 h-3 text-cine-sunsetAmber"></i> 1-Tap Reorder (Repetir Pedido)
    </button>
  </aside>

  <!-- STICKY DATE-STRIP -->
  <nav aria-label="Seleção de Datas de Exibição" class="sticky top-[45px] z-30 bg-[#0B0B12]/95 border-b border-zinc-800/80 px-4 sm:px-8 py-2.5 backdrop-blur-md">
    <div class="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto date-strip-scroll" id="date-strip-container">
      <!-- Date Pills dynamically populated -->
    </div>
  </nav>

  <!-- ============================================== -->
  <!-- MAIN WORKSPACE CONTAINER -->
  <!-- ============================================== -->
  <main id="main-content" class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

    <!-- VIEW 1: CATALOG VIEW -->
    <section id="view-catalog-movie">

      <!-- ================================================================= -->
      <!-- ARQUITETURA 1: SOLAR SUNSET ASYMMETRIC BENTO GRID (PALETA DO USUÁRIO) -->
      <!-- Cores: #FF4D00, #FF9F1C, #FFD166, #1B1B3A, #0B0B12 -->
      <!-- ================================================================= -->
      <div id="layout-solar-sunset" class="space-y-8">
        
        <!-- Header Bento Description -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <div class="flex items-center gap-2 font-mono text-xs">
              <span class="px-2.5 py-0.5 rounded-full bg-cine-sunsetOrange text-white font-extrabold tracking-wider uppercase">Layout 1</span>
              <span class="text-cine-sunsetAmber font-bold uppercase tracking-wider">Bento Grid Assimétrico 12-Colunas</span>
              <span class="text-zinc-500">•</span>
              <span class="text-zinc-400 font-mono">Paleta Oficial Oficial</span>
            </div>
            <h1 class="text-2xl sm:text-4xl font-extrabold text-white font-bento tracking-tight mt-1">
              Experiência Solar Sunset Multiplex
            </h1>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-zinc-400 font-mono bg-cine-sunsetIndigo/80 border border-cine-sunsetAmber/30 px-3 py-1.5 rounded-xl">
              🔥 Próxima Sessão em <strong class="text-cine-sunsetGold tabular-nums" id="bento-countdown">00:42:18</strong>
            </span>
          </div>
        </div>

        <!-- 12-COLUMN ASYMMETRIC BENTO GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <!-- BENTO TILE 1 (8 COLUNAS, 2 LINHAS): MARQUEE MASTER HERO -->
          <div class="lg:col-span-8 rounded-3xl bg-gradient-to-br from-[#1B1B3A] via-[#15152E] to-[#0B0B12] border-2 border-cine-sunsetAmber/40 p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between space-y-6 glow-sunset">
            <!-- Ambient Sunset Glow Effect -->
            <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cine-sunsetOrange/25 blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-cine-sunsetAmber/20 blur-3xl pointer-events-none"></div>

            <div class="relative z-10 space-y-4">
              <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span class="px-3 py-1 rounded-full bg-cine-sunsetOrange text-white font-black uppercase tracking-wider shadow-md">
                  ★ Destaque IMAX Laser
                </span>
                <span class="px-2.5 py-1 rounded-full bg-zinc-900/90 text-cine-sunsetGold border border-cine-sunsetGold/30 font-bold">
                  Dolby Atmos 128 Canais
                </span>
                <span class="px-2.5 py-1 rounded-full bg-zinc-900/90 text-zinc-300 border border-zinc-700">
                  Duração: 166 min
                </span>
                <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/40">
                  14 ANOS
                </span>
              </div>

              <h2 class="text-3xl sm:text-5xl font-black text-white font-bento tracking-tight leading-tight">
                DUNA: PARTE 2
              </h2>
              <p class="text-sm sm:text-base text-zinc-300 max-w-2xl leading-relaxed">
                Paul Atreides se une a Chani e aos Fremen em busca de vingança. Exibição na Sala Laser 1 com serviço de alta gastronomia e coquetelaria temática servida antes da tempestade de areia.
              </p>

              <!-- Curated Chef Pairing Bar inside Marquee -->
              <div class="p-4 rounded-2xl bg-cine-sunsetIndigo/80 border border-cine-sunsetGold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-sm">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-cine-sunsetAmber/20 border border-cine-sunsetAmber/40 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="sparkles" class="w-5 h-5 text-cine-sunsetGold"></i>
                  </div>
                  <div>
                    <span class="text-xs font-bold text-cine-sunsetGold uppercase tracking-wider">Harmonização Recomendada do Chef:</span>
                    <p class="text-xs text-zinc-200">Mini Burger Angus Trufado + Cocktail Especiarias de Arrakis</p>
                  </div>
                </div>
                <button onclick="addConcessionItem('Combo Harmonizado Duna (Burger + Cocktail)', 58.00)" class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white text-xs font-extrabold hover:brightness-110 shadow-md active:scale-[0.97] flex items-center gap-1.5 whitespace-nowrap">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i> + R$ 58,00 na Poltrona
                </button>
              </div>
            </div>

            <!-- Booking Action Row inside Hero -->
            <div class="relative z-10 pt-4 border-t border-cine-sunsetAmber/20 flex flex-wrap items-center justify-between gap-4">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-bold text-zinc-400 font-mono">Sessões Hoje:</span>
                <button onclick="openSeatSelection('Duna: Parte 2', '16:00', 'Sala IMAX Laser 1', 46.00)" class="px-3.5 py-2 rounded-xl bg-cine-sunsetIndigo hover:bg-cine-sunsetOrange/30 border border-cine-sunsetAmber/40 text-xs font-bold text-white transition active:scale-[0.97]">
                  16:00 <span class="text-cine-sunsetGold text-[10px]">DUB</span>
                </button>
                <button onclick="openSeatSelection('Duna: Parte 2', '19:30', 'Sala IMAX Laser 1', 52.00)" class="px-4 py-2 rounded-xl bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white text-xs font-extrabold shadow-lg shadow-cine-sunsetOrange/30 transition active:scale-[0.97] ring-2 ring-cine-sunsetGold/50">
                  🔥 19:30 <span class="text-white text-[10px]">LEG [Lotando]</span>
                </button>
                <button onclick="openSeatSelection('Duna: Parte 2', '22:15', 'Sala IMAX Laser 1', 46.00)" class="px-3.5 py-2 rounded-xl bg-cine-sunsetIndigo hover:bg-cine-sunsetOrange/30 border border-cine-sunsetAmber/40 text-xs font-bold text-white transition active:scale-[0.97]">
                  22:15 <span class="text-cine-sunsetGold text-[10px]">LEG</span>
                </button>
              </div>

              <button onclick="openSeatSelection('Duna: Parte 2', '19:30', 'Sala IMAX Laser 1', 52.00)" class="px-5 py-2.5 rounded-xl bg-cine-sunsetGold text-cine-sunsetVoid text-xs font-black uppercase tracking-wider hover:bg-white transition flex items-center gap-2 active:scale-[0.97] shadow-lg">
                <i data-lucide="ticket" class="w-4 h-4"></i> Escolher Poltronas
              </button>
            </div>
          </div>

          <!-- BENTO TILE 2 (4 COLUNAS): MENU GASTRONÔMICO SOLAR DA SEMANA -->
          <div class="lg:col-span-4 rounded-3xl bg-[#1B1B3A] border-2 border-cine-sunsetAmber/30 p-6 flex flex-col justify-between space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-cine-sunsetAmber/20 text-cine-sunsetGold text-[10px] font-black uppercase tracking-wider border border-cine-sunsetAmber/40">
                  Gastronomia na Poltrona
                </span>
                <i data-lucide="utensils" class="w-4 h-4 text-cine-sunsetGold"></i>
              </div>
              <h3 class="text-xl font-bold text-white font-bento">Menu Solar Signature</h3>
              <p class="text-xs text-zinc-300">Pratos quentes e petiscos de autor servidos silenciosamente na sua mesa lateral.</p>
            </div>

            <!-- Culinary Items list -->
            <div class="space-y-3">
              <div class="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 hover:border-cine-sunsetAmber/40 transition">
                <div>
                  <h4 class="text-xs font-bold text-white">Tacos Birria de Cinema (3 un)</h4>
                  <span class="text-[11px] text-zinc-400">Carne desfiada, queijo tostado e caldo</span>
                </div>
                <button onclick="addConcessionItem('Tacos Birria de Cinema', 44.00)" class="px-2.5 py-1.5 rounded-lg bg-cine-sunsetAmber/20 hover:bg-cine-sunsetAmber text-cine-sunsetGold hover:text-black font-mono font-bold text-xs transition active:scale-[0.97]">
                  R$ 44,00 +
                </button>
              </div>

              <div class="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 hover:border-cine-sunsetAmber/40 transition">
                <div>
                  <h4 class="text-xs font-bold text-white">Pipoca Trufada com Flor de Sal</h4>
                  <span class="text-[11px] text-zinc-400">Azeite de trufas brancas & pecorino</span>
                </div>
                <button onclick="addConcessionItem('Pipoca Trufada Flor de Sal', 36.00)" class="px-2.5 py-1.5 rounded-lg bg-cine-sunsetAmber/20 hover:bg-cine-sunsetAmber text-cine-sunsetGold hover:text-black font-mono font-bold text-xs transition active:scale-[0.97]">
                  R$ 36,00 +
                </button>
              </div>

              <div class="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 hover:border-cine-sunsetAmber/40 transition">
                <div>
                  <h4 class="text-xs font-bold text-white">Cocktail Sunset Tangerine 300ml</h4>
                  <span class="text-[11px] text-zinc-400">Gin artesanal, tangerina fresca & alecrim</span>
                </div>
                <button onclick="addConcessionItem('Cocktail Sunset Tangerine', 38.00)" class="px-2.5 py-1.5 rounded-lg bg-cine-sunsetAmber/20 hover:bg-cine-sunsetAmber text-cine-sunsetGold hover:text-black font-mono font-bold text-xs transition active:scale-[0.97]">
                  R$ 38,00 +
                </button>
              </div>
            </div>

            <button onclick="openConcessionDrawer()" class="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-cine-sunsetGold flex items-center justify-center gap-2 transition active:scale-[0.97]">
              <span>Ver Cardápio Completo (18 opções)</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- BENTO TILE 3 (4 COLUNAS): SESSÃO SECRETA 35MM (CULT CLUB) -->
          <div class="lg:col-span-4 rounded-3xl bg-[#1B1B3A] border-2 border-cine-sunsetOrange/40 p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-cine-sunsetOrange/20 text-cine-sunsetOrange text-[10px] font-black uppercase tracking-wider border border-cine-sunsetOrange/40">
                  Sessão Secreta 35mm
                </span>
                <i data-lucide="disc" class="w-4 h-4 text-cine-sunsetOrange"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-bento">Clube do Vinil & Película</h3>
              <p class="text-xs text-zinc-300">Toda sexta-feira: um clássico restaurado projetado em 35mm autêntico com degustação de chopp artesanal.</p>
            </div>

            <!-- Vinyl Animation Dial Visual -->
            <div class="my-2 p-4 rounded-2xl bg-[#0B0B12] border border-cine-sunsetOrange/30 flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-cine-sunsetOrange to-cine-sunsetGold flex items-center justify-center shadow-lg relative animate-spin" style="animation-duration: 8s;">
                <div class="w-5 h-5 rounded-full bg-[#0B0B12] border border-white/40"></div>
              </div>
              <div>
                <span class="text-[11px] font-bold text-cine-sunsetGold uppercase">Sexta, 23:00 • Sala 3</span>
                <h4 class="text-sm font-black text-white">Blade Runner (Final Cut)</h4>
                <span class="text-xs text-zinc-400 font-mono">Chopp IPA 400ml Incluso</span>
              </div>
            </div>

            <button onclick="openSeatSelection('Blade Runner (Final Cut 35mm)', '23:00', 'Sala Cult 35mm', 48.00)" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white text-xs font-bold uppercase tracking-wider transition active:scale-[0.97] shadow-md">
              Garantir Ingresso Secreto
            </button>
          </div>

          <!-- BENTO TILE 4 (4 COLUNAS): RADAR DE LOTAÇÃO & PONTO DOCE ACÚSTICO -->
          <div class="lg:col-span-4 rounded-3xl bg-[#1B1B3A] border-2 border-cine-sunsetAmber/30 p-6 flex flex-col justify-between space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-cine-sunsetGold/20 text-cine-sunsetGold text-[10px] font-black uppercase tracking-wider border border-cine-sunsetGold/40">
                  Heatmap Acústico
                </span>
                <i data-lucide="gauge" class="w-4 h-4 text-cine-sunsetGold"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-bento">Ponto Doce da Sala (Sweet Spot)</h3>
              <p class="text-xs text-zinc-300">As fileiras D e E concentram o alinhamento calibrado pelo engenheiro de áudio Dolby Atmos.</p>
            </div>

            <!-- Visual Capacity Bar -->
            <div class="space-y-2 p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-zinc-400">Ocupação Sala Laser 1:</span>
                <span class="text-cine-sunsetGold font-bold">78%</span>
              </div>
              <div class="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cine-sunsetOrange via-cine-sunsetAmber to-cine-sunsetGold rounded-full" style="width: 78%;"></div>
              </div>
              <span class="text-[10px] text-zinc-400 block text-right">Restam 18 poltronas livres</span>
            </div>

            <button onclick="openSeatSelection('Interestelar: Edição Especial', '19:30', 'Sala IMAX Laser 1', 42.00)" class="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-cine-sunsetGold/40 text-xs font-bold text-cine-sunsetGold flex items-center justify-center gap-2 transition active:scale-[0.97]">
              <i data-lucide="target" class="w-3.5 h-3.5"></i>
              <span>Reservar Fileira D (Centro)</span>
            </button>
          </div>

          <!-- BENTO TILE 5 (4 COLUNAS): CLUBE FIDELIDADE SOLAR -->
          <div class="lg:col-span-4 rounded-3xl bg-[#1B1B3A] border-2 border-cine-sunsetGold/30 p-6 flex flex-col justify-between space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40">
                  CineFood Club
                </span>
                <i data-lucide="crown" class="w-4 h-4 text-cine-sunsetGold"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-bento">Desconto de 30% em Ingressos</h3>
              <p class="text-xs text-zinc-300">Assinantes do clube têm taxa de serviço zero, refil de pipoca cortesia e upgrade automático para poltrona reclinável.</p>
            </div>

            <div class="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-white">Plano Cinephile Gourmet</span>
                <span class="block text-[11px] text-cine-sunsetGold font-mono">R$ 29,90 / mês</span>
              </div>
              <span class="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">ATIVO</span>
            </div>

            <button onclick="toast.show('Seu desconto de 30% do CineFood Club foi aplicado no checkout!', { type: 'success' })" class="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition active:scale-[0.97]">
              Gerenciar Benefícios
            </button>
          </div>

        </div>
      </div>


      <!-- ================================================================= -->
      <!-- ARQUITETURA 2: ALAMO DRAFTHOUSE CINE-GAZETTE & SCHEDULE MATRIX -->
      <!-- Cores: #F5B324 (Alamo Gold), #090909 (Black OLED), Quinas Retas 0px -->
      <!-- ================================================================= -->
      <div id="layout-boutique-gold" class="space-y-8 hidden">
        
        <!-- Alamo Marquee Broadsheet Header -->
        <div class="border-b-4 border-cine-alamoGold pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 text-xs font-mono text-cine-alamoGold font-bold uppercase tracking-widest">
              <span>ALAMO DRAFTHOUSE CINEMA</span>
              <span>•</span>
              <span class="text-zinc-400">PROGRAMAÇÃO OFICIAL & DINE-IN</span>
              <span>•</span>
              <span class="text-zinc-500">SÃO PAULO FLAVOR</span>
            </div>
            <h2 class="text-3xl sm:text-5xl font-black text-white font-headline uppercase tracking-tight mt-1">
              MATRIZ DE SESSÕES & COZINHA SCRATCH
            </h2>
          </div>
          <div class="text-right text-xs text-zinc-400 hidden sm:block">
            <span class="block text-cine-alamoGold font-black uppercase tracking-wider">Garçom na Fileira • Chame com o Papel</span>
            <span class="text-[11px]">Silêncio absoluto durante a projeção</span>
          </div>
        </div>

        <!-- Alamo Hero 50/50 Split -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#090909] border-2 border-cine-alamoGold/50 p-6 rounded-none glow-alamo">
          <!-- Left 50%: Film Focus -->
          <div class="lg:col-span-6 space-y-4">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 bg-cine-alamoGold text-black font-black uppercase text-xs tracking-wider">
                FILME EM DESTAQUE 35MM
              </span>
              <span class="text-xs font-mono text-zinc-400">Diretor: Christopher Nolan</span>
            </div>
            <h3 class="text-3xl sm:text-4xl font-black text-white font-headline uppercase">
              INTERESTELAR: EDIÇÃO 10 ANOS
            </h3>
            <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              "Não entre suavemente nessa noite escura." Exibição comemorativa especial em película analógica 35mm com som magnético de 6 canais e serviço completo de alimentação na poltrona.
            </p>
            
            <div class="p-3 bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <strong class="text-cine-alamoGold block uppercase font-mono">Regra de Ouro do Alamo:</strong>
              <p class="text-[11px] text-zinc-400">Nada de conversas ou celulares ligados durante o filme. Caso alguém desrespeite, avise nosso atendente pelo bilhete e o infrator será expulso sem reembolso.</p>
            </div>
          </div>

          <!-- Right 50%: Scratch Kitchen Highlights & Ticket Direct -->
          <div class="lg:col-span-6 bg-zinc-950 border border-zinc-800 p-5 space-y-4 flex flex-col justify-between">
            <div class="space-y-2">
              <span class="text-xs font-black uppercase tracking-wider text-cine-alamoGold block font-mono">
                🍔 O Que Servimos na Sua Fileira:
              </span>
              <div class="space-y-2 text-xs">
                <div class="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800">
                  <div>
                    <span class="font-bold text-white">Royale with Cheese Burger</span>
                    <span class="block text-[10px] text-zinc-400">180g Angus, queijo cheddar inglês, cebola caramelizada</span>
                  </div>
                  <span class="font-mono font-bold text-cine-alamoGold">R$ 48,00</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800">
                  <div>
                    <span class="font-bold text-white">Alamo Loaded Queso Dip</span>
                    <span class="block text-[10px] text-zinc-400">Fondue de queijo picante com tortilhas de milho quentes</span>
                  </div>
                  <span class="font-mono font-bold text-cine-alamoGold">R$ 38,00</span>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
              <span class="text-xs font-mono text-zinc-400">Sessão 35mm às 19:30</span>
              <button onclick="openSeatSelection('Interestelar: Edição Especial', '19:30', 'Sala 35mm Alamo', 42.00)" class="px-5 py-2.5 bg-cine-alamoGold text-black font-black uppercase text-xs tracking-wider hover:bg-white transition active:scale-[0.97]">
                COMPRAR INGRESSO + MESA
              </button>
            </div>
          </div>
        </div>

        <!-- HORIZONTAL SCHEDULE MATRIX TABLE (ALAMO SIGNATURE) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black uppercase text-white font-headline tracking-wide flex items-center gap-2">
              <i data-lucide="clock" class="w-4 h-4 text-cine-alamoGold"></i> Grade Horária de Exibição (Hoje, Sex 06/Nov)
            </h3>
            <span class="text-xs font-mono text-zinc-400">Clique no horário para abrir o mapa de assentos</span>
          </div>

          <div class="overflow-x-auto border-2 border-zinc-800 bg-[#090909]">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-zinc-900 border-b-2 border-zinc-700 text-zinc-300 font-mono uppercase tracking-wider text-[11px]">
                  <th class="p-3 w-1/3">Filme em Cartaz</th>
                  <th class="p-3 w-1/5">Sala 1 (Dine-In Garçom)</th>
                  <th class="p-3 w-1/5">Sala 2 (Película 35mm)</th>
                  <th class="p-3 w-1/5">Sala 3 (Comfort Recliner)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800 font-mono">
                <!-- Row 1 -->
                <tr class="hover:bg-zinc-900/60 transition">
                  <td class="p-3">
                    <strong class="text-white text-sm block font-headline">INTERESTELAR</strong>
                    <span class="text-zinc-400 text-[11px]">169 min • 12 anos • Sci-Fi</span>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Interestelar', '14:30', 'Sala 1 Dine-In', 42.00)" class="px-3 py-1.5 bg-zinc-800 hover:bg-cine-alamoGold hover:text-black text-zinc-200 font-bold border border-zinc-700 transition active:scale-[0.97]">
                      14:30
                    </button>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala 2 Película 35mm', 48.00)" class="px-3 py-1.5 bg-cine-alamoGold text-black font-black border border-cine-alamoGold shadow-sm transition active:scale-[0.97]">
                      19:30 [Destaque]
                    </button>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Interestelar', '22:15', 'Sala 3 Recliner', 42.00)" class="px-3 py-1.5 bg-zinc-800 hover:bg-cine-alamoGold hover:text-black text-zinc-200 font-bold border border-zinc-700 transition active:scale-[0.97]">
                      22:15
                    </button>
                  </td>
                </tr>

                <!-- Row 2 -->
                <tr class="hover:bg-zinc-900/60 transition">
                  <td class="p-3">
                    <strong class="text-white text-sm block font-headline">DUNA: PARTE 2</strong>
                    <span class="text-zinc-400 text-[11px]">166 min • 14 anos • Aventura</span>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Duna: Parte 2', '16:00', 'Sala 1 Dine-In', 42.00)" class="px-3 py-1.5 bg-zinc-800 hover:bg-cine-alamoGold hover:text-black text-zinc-200 font-bold border border-zinc-700 transition active:scale-[0.97]">
                      16:00
                    </button>
                    <button onclick="openSeatSelection('Duna: Parte 2', '20:00', 'Sala 1 Dine-In', 46.00)" class="ml-2 px-3 py-1.5 bg-cine-alamoGold text-black font-black border border-cine-alamoGold transition active:scale-[0.97]">
                      20:00
                    </button>
                  </td>
                  <td class="p-3">
                    <span class="text-zinc-600 text-[11px]">—</span>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Duna: Parte 2', '21:30', 'Sala 3 Recliner', 42.00)" class="px-3 py-1.5 bg-zinc-800 hover:bg-cine-alamoGold hover:text-black text-zinc-200 font-bold border border-zinc-700 transition active:scale-[0.97]">
                      21:30
                    </button>
                  </td>
                </tr>

                <!-- Row 3 -->
                <tr class="hover:bg-zinc-900/60 transition">
                  <td class="p-3">
                    <strong class="text-white text-sm block font-headline">OPPENHEIMER</strong>
                    <span class="text-zinc-400 text-[11px]">180 min • 16 anos • Drama Biográfico</span>
                  </td>
                  <td class="p-3">
                    <span class="text-zinc-600 text-[11px]">—</span>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Oppenheimer', '18:00', 'Sala 2 Película 35mm', 48.00)" class="px-3 py-1.5 bg-cine-alamoGold text-black font-black border border-cine-alamoGold transition active:scale-[0.97]">
                      18:00
                    </button>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Oppenheimer', '21:00', 'Sala 3 Recliner', 42.00)" class="px-3 py-1.5 bg-zinc-800 hover:bg-cine-alamoGold hover:text-black text-zinc-200 font-bold border border-zinc-700 transition active:scale-[0.97]">
                      21:00
                    </button>
                  </td>
                </tr>

                <!-- Row 4 -->
                <tr class="hover:bg-zinc-900/60 transition">
                  <td class="p-3">
                    <strong class="text-white text-sm block font-headline">POBRES CRIATURAS</strong>
                    <span class="text-zinc-400 text-[11px]">141 min • 18 anos • Comédia Surrealista</span>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Pobres Criaturas', '17:15', 'Sala 1 Dine-In', 42.00)" class="px-3 py-1.5 bg-zinc-800 hover:bg-cine-alamoGold hover:text-black text-zinc-200 font-bold border border-zinc-700 transition active:scale-[0.97]">
                      17:15
                    </button>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Pobres Criaturas', '22:00', 'Sala 2 Película 35mm', 48.00)" class="px-3 py-1.5 bg-zinc-800 hover:bg-cine-alamoGold hover:text-black text-zinc-200 font-bold border border-zinc-700 transition active:scale-[0.97]">
                      22:00
                    </button>
                  </td>
                  <td class="p-3">
                    <span class="text-zinc-600 text-[11px]">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>


      <!-- ================================================================= -->
      <!-- ARQUITETURA 3: EVERYMAN CINEMAS VELVET SALON & HOSPITALITY LOUNGE -->
      <!-- Cores: #EE9CA6 (Rosa Blush), #EFCFD3, #212020 (Espresso), Serifas -->
      <!-- ================================================================= -->
      <div id="layout-cyber-imax" class="space-y-8 hidden">
        
        <!-- Everyman Editorial Header -->
        <div class="border-b border-[#EE9CA6]/30 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 text-xs font-serif italic text-cine-everymanRose tracking-widest">
              <span>EVERYMAN CINEMAS & LOUNGES</span>
              <span>—</span>
              <span>SALÃO DE VELUDO & ALTA HOSPITALIDADE</span>
            </div>
            <h2 class="text-3xl sm:text-5xl font-normal text-white font-serif tracking-tight mt-1">
              O Cinema Reencontra a Elegância
            </h2>
          </div>
          
          <!-- Venue Lounge Selector -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-zinc-400 font-serif italic">Seu Salão:</span>
            <select class="px-3 py-1.5 rounded-lg bg-[#212020] border border-[#EE9CA6]/40 text-xs font-medium text-white focus:outline-none">
              <option>Everyman Jardins — Salão de Veludo Privé</option>
              <option>Everyman Leblon — Rooftop Terrace</option>
              <option>Everyman Curitiba — Batel Lounge</option>
            </select>
          </div>
        </div>

        <!-- Velvet Sofa Box Reservation Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <!-- Everyman Film Card 1 -->
          <div class="rounded-2xl bg-[#212020] border border-[#EE9CA6]/30 p-6 space-y-4 shadow-xl">
            <div class="flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-serif italic text-cine-everymanRose block">Sessão Nobre das 19:30</span>
                <h3 class="text-2xl font-serif text-white">Interestelar</h3>
                <span class="text-xs text-zinc-400 font-sans">169 minutos • Drama Cósmico</span>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#EE9CA6]/20 text-cine-everymanRose text-[10px] font-bold border border-[#EE9CA6]/40">
                SOFÁS DUPLOS
              </span>
            </div>

            <p class="text-xs text-zinc-300 leading-relaxed font-sans">
              Desfrute em sofás de veludo com almofadas de pluma, mesa de mármore lateral e serviço de garçom com vinhos orgânicos e tábuas de queijos antes dos trailers.
            </p>

            <!-- Sofa Pair Visual Selector -->
            <div class="p-3.5 rounded-xl bg-[#1A1818] border border-zinc-800 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i data-lucide="armchair" class="w-5 h-5 text-cine-everymanRose"></i>
                <div>
                  <span class="text-xs font-bold text-white block">Sofá de Veludo para Dois</span>
                  <span class="text-[11px] text-zinc-400">Inclui 2 taças de vinho cortesia</span>
                </div>
              </div>
              <span class="text-sm font-serif font-bold text-cine-everymanRose">R$ 98,00</span>
            </div>

            <div class="pt-2 flex items-center justify-between">
              <button onclick="addConcessionItem('Tábua de Queijos Artesanais Everyman', 52.00)" class="text-xs font-serif italic text-cine-everymanRose hover:underline">
                + Adicionar Tábua de Queijos (R$ 52,00)
              </button>
              <button onclick="openSeatSelection('Interestelar (Everyman Lounge)', '19:30', 'Salão de Veludo Jardins', 49.00)" class="px-5 py-2.5 rounded-xl bg-cine-everymanRose text-[#212020] text-xs font-bold hover:bg-white transition active:scale-[0.97]">
                Reservar Sofá
              </button>
            </div>
          </div>

          <!-- Everyman Film Card 2 -->
          <div class="rounded-2xl bg-[#212020] border border-[#EE9CA6]/30 p-6 space-y-4 shadow-xl">
            <div class="flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-serif italic text-cine-everymanRose block">Sessão Especial das 20:15</span>
                <h3 class="text-2xl font-serif text-white">Pobres Criaturas</h3>
                <span class="text-xs text-zinc-400 font-sans">141 minutos • Comédia de Época</span>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#EE9CA6]/20 text-cine-everymanRose text-[10px] font-bold border border-[#EE9CA6]/40">
                ARMCHAIR KING
              </span>
            </div>

            <p class="text-xs text-zinc-300 leading-relaxed font-sans">
              Poltronas individuais em couro conhaque com descanso reclinável para as pernas, abajur individual e carta de coquetéis clássicos preparados por nosso sommelier.
            </p>

            <!-- Single Recliner Visual Selector -->
            <div class="p-3.5 rounded-xl bg-[#1A1818] border border-zinc-800 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i data-lucide="wine" class="w-5 h-5 text-cine-everymanRose"></i>
                <div>
                  <span class="text-xs font-bold text-white block">Poltrona Individual Velvet King</span>
                  <span class="text-[11px] text-zinc-400">Com apoio de pés reclinável</span>
                </div>
              </div>
              <span class="text-sm font-serif font-bold text-cine-everymanRose">R$ 54,00</span>
            </div>

            <div class="pt-2 flex items-center justify-between">
              <button onclick="addConcessionItem('Espresso Martini Signature Everyman', 42.00)" class="text-xs font-serif italic text-cine-everymanRose hover:underline">
                + Espresso Martini (R$ 42,00)
              </button>
              <button onclick="openSeatSelection('Pobres Criaturas (Everyman Lounge)', '20:15', 'Salão de Veludo Jardins', 54.00)" class="px-5 py-2.5 rounded-xl bg-cine-everymanRose text-[#212020] text-xs font-bold hover:bg-white transition active:scale-[0.97]">
                Reservar Poltrona
              </button>
            </div>
          </div>

        </div>

        <!-- Hospitality Bar & Dining Menu Preview -->
        <div class="rounded-2xl bg-[#1E1B1B] border border-[#EE9CA6]/20 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-serif italic text-cine-everymanRose">Hospitality & Gastro-Club</span>
              <h4 class="text-xl font-serif text-white">A Carta de Salão do Everyman</h4>
            </div>
            <button onclick="openConcessionDrawer()" class="px-4 py-2 rounded-xl border border-[#EE9CA6]/40 text-xs font-serif italic text-cine-everymanRose hover:bg-[#EE9CA6]/10 transition active:scale-[0.97]">
              Explorar Carta de Vinhos Completa →
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
            <div class="p-3 rounded-xl bg-[#212020] border border-zinc-800">
              <strong class="text-white block font-serif text-sm">Buttermilk Fried Chicken</strong>
              <p class="text-zinc-400 text-[11px]">Tiras crocantes com aioli de limão siciliano</p>
              <span class="text-cine-everymanRose font-bold mt-2 block">R$ 44,00</span>
            </div>
            <div class="p-3 rounded-xl bg-[#212020] border border-zinc-800">
              <strong class="text-white block font-serif text-sm">Vinho Tinto Pinot Noir Orgânico</strong>
              <p class="text-zinc-400 text-[11px]">Taça 150ml da Serra Gaúcha</p>
              <span class="text-cine-everymanRose font-bold mt-2 block">R$ 38,00</span>
            </div>
            <div class="p-3 rounded-xl bg-[#212020] border border-zinc-800">
              <strong class="text-white block font-serif text-sm">Sundae de Caramelo & Flor de Sal</strong>
              <p class="text-zinc-400 text-[11px]">Sorvete artesanal com crumble de nozes</p>
              <span class="text-cine-everymanRose font-bold mt-2 block">R$ 32,00</span>
            </div>
          </div>
        </div>

      </div>


      <!-- ================================================================= -->
      <!-- ARQUITETURA 4: AMC THEATRES & CINEMARK STADIUM FORMAT RADAR -->
      <!-- Cores: #CE0E2D (AMC Red), #000000 (Black OLED), Stadium Pills 9999px -->
      <!-- ================================================================= -->
      <div id="layout-cinephile-minimal" class="space-y-8 hidden">
        
        <!-- AMC Format Radar Pill Bar -->
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="radio" class="w-3.5 h-3.5 text-cine-amcRed animate-pulse"></i> Radar de Formatos & Tecnologias
            </span>
            <span class="text-zinc-500">Selecione para filtrar salas com projeção de ponta</span>
          </div>

          <!-- Stadium Pills Filter -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            <button class="px-4 py-2 rounded-full bg-cine-amcRed text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cine-amcRed/30 whitespace-nowrap active:scale-[0.97]">
              ★ TODAS AS SALAS
            </button>
            <button class="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider whitespace-nowrap active:scale-[0.97]">
              IMAX COM LASER
            </button>
            <button class="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider whitespace-nowrap active:scale-[0.97]">
              DOLBY CINEMA 360°
            </button>
            <button class="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider whitespace-nowrap active:scale-[0.97]">
              CINEMARK XD
            </button>
            <button class="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider whitespace-nowrap active:scale-[0.97]">
              D-BOX POLTRONAS 4D
            </button>
            <button class="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider whitespace-nowrap active:scale-[0.97]">
              PRIME VIP LOUNGE
            </button>
          </div>
        </div>

        <!-- Full-Bleed 21:9 Widescreen Hero Banner with Technical HUD -->
        <div class="rounded-2xl bg-black border border-zinc-800 p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between space-y-6 glow-amc">
          <div class="space-y-4 max-w-2xl">
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full bg-cine-amcRed text-white text-[11px] font-black uppercase tracking-wider">
                SALA DOLBY CINEMA N° 1
              </span>
              <span class="text-xs font-mono text-zinc-400">Projeção Laser Duplo 4K Christie</span>
            </div>

            <h2 class="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              DUNA: PARTE 2
            </h2>

            <!-- Technical Spec HUD -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono">
              <div>
                <span class="text-zinc-500 block text-[10px]">TELA</span>
                <span class="text-white font-bold">24m Silver Screen</span>
              </div>
              <div>
                <span class="text-zinc-500 block text-[10px]">SOM</span>
                <span class="text-white font-bold">128 Canais Atmos</span>
              </div>
              <div>
                <span class="text-zinc-500 block text-[10px]">ASSENTO</span>
                <span class="text-white font-bold">AMC Signature Recliner</span>
              </div>
            </div>
          </div>

          <!-- Rapid Showtimes Pill Grid -->
          <div class="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-bold text-zinc-400 font-mono">Hoje:</span>
              <button onclick="openSeatSelection('Duna: Parte 2 (Dolby Cinema)', '15:40', 'Sala Dolby Cinema 1', 50.00)" class="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-bold border border-zinc-700 transition active:scale-[0.97]">
                15:40 <span class="text-zinc-400 text-[10px]">(Dub)</span>
              </button>
              <button onclick="openSeatSelection('Duna: Parte 2 (Dolby Cinema)', '19:15', 'Sala Dolby Cinema 1', 54.00)" class="px-5 py-2 rounded-full bg-cine-amcRed text-white font-mono text-xs font-black shadow-lg shadow-cine-amcRed/40 transition active:scale-[0.97]">
                🔥 19:15 <span class="text-white/80 text-[10px]">(Leg) [Últimos 14]</span>
              </button>
              <button onclick="openSeatSelection('Duna: Parte 2 (Dolby Cinema)', '22:30', 'Sala Dolby Cinema 1', 50.00)" class="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-bold border border-zinc-700 transition active:scale-[0.97]">
                22:30 <span class="text-zinc-400 text-[10px]">(Leg)</span>
              </button>
            </div>

            <button onclick="openSeatSelection('Duna: Parte 2 (Dolby Cinema)', '19:15', 'Sala Dolby Cinema 1', 54.00)" class="px-6 py-2.5 rounded-full bg-white text-black font-black uppercase text-xs tracking-wider hover:bg-cine-amcRed hover:text-white transition active:scale-[0.97]">
              COMPRAR INGRESSO AGORA
            </button>
          </div>
        </div>

        <!-- AMC Snack & Sip Express 1-Click Bar -->
        <div class="rounded-2xl bg-zinc-950 border border-zinc-800 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-cine-amcRed/20 border border-cine-amcRed/40 flex items-center justify-center">
                <i data-lucide="zap" class="w-4 h-4 text-cine-amcRed"></i>
              </div>
              <div>
                <h4 class="text-sm font-bold text-white uppercase tracking-wider font-mono">Snack & Sip Express (Cinemark / AMC)</h4>
                <p class="text-xs text-zinc-400">Compre no app e retire no armário térmico express com QR Code ou peça entrega na poltrona.</p>
              </div>
            </div>
            <button onclick="openConcessionDrawer()" class="text-xs text-cine-amcRed font-mono font-bold hover:underline">
              Ver Todos os Combos →
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <strong class="text-xs text-white block">Combo Mega Pipoca + 2 Refis</strong>
                <span class="text-[11px] text-zinc-400">Balde gigante manteiga real</span>
              </div>
              <button onclick="addConcessionItem('Combo Mega Pipoca + 2 Refis', 49.90)" class="px-3 py-1.5 rounded-full bg-cine-amcRed text-white text-xs font-black active:scale-[0.97]">
                R$ 49,90 +
              </button>
            </div>

            <div class="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <strong class="text-xs text-white block">Kit Doce Cinema</strong>
                <span class="text-[11px] text-zinc-400">Pipoca Doce Caramelo + M&M 120g</span>
              </div>
              <button onclick="addConcessionItem('Kit Doce Cinema', 38.50)" class="px-3 py-1.5 rounded-full bg-cine-amcRed text-white text-xs font-black active:scale-[0.97]">
                R$ 38,50 +
              </button>
            </div>

            <div class="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <strong class="text-xs text-white block">Nachos Supreme Cheddar</strong>
                <span class="text-[11px] text-zinc-400">Molho cheddar quente & jalapeño</span>
              </div>
              <button onclick="addConcessionItem('Nachos Supreme Cheddar', 34.00)" class="px-3 py-1.5 rounded-full bg-cine-amcRed text-white text-xs font-black active:scale-[0.97]">
                R$ 34,00 +
              </button>
            </div>
          </div>
        </div>

      </div>

    </section>

    <!-- ============================================== -->
    <!-- VIEW 2: SEAT SELECTION & LIVE AUDITORIUM MAP   -->
    <!-- ============================================== -->
    <section id="view-seats" class="hidden space-y-6">
      
      <!-- Back Navigation Bar -->
      <div class="flex items-center justify-between pb-4 border-b border-zinc-800">
        <button onclick="switchView('catalog')" class="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 flex items-center gap-2 active:scale-[0.97]">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar à Programação
        </button>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <span id="active-movie" class="text-base font-bold text-white block">Duna: Parte 2</span>
            <span id="active-details" class="text-xs text-zinc-400">Hoje às 19:30 • Sala Laser 1</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 font-mono text-xs font-bold text-cine-sunsetGold">
            ⏱ <span id="seat-timer" class="tabular-nums">10:00</span>
          </div>
        </div>
      </div>

      <!-- Ticket Type Adjuster -->
      <div class="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Modalidades de Ingresso</span>
          <span class="text-[11px] text-zinc-500">Selecione o tipo de cada assento escolhido</span>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <!-- Inteira -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-xs font-bold text-white">Inteira:</span>
            <span id="label-price-inteira" class="text-xs font-mono text-cine-sunsetGold font-bold">R$ 42,00</span>
            <div class="flex items-center gap-1 ml-2">
              <button onclick="adjustTicketType('inteira', -1)" class="w-6 h-6 rounded bg-zinc-800 text-white font-bold text-xs">-</button>
              <span id="count-inteira" class="w-5 text-center font-bold text-xs tabular-nums">0</span>
              <button onclick="adjustTicketType('inteira', 1)" class="w-6 h-6 rounded bg-zinc-800 text-white font-bold text-xs">+</button>
            </div>
          </div>

          <!-- Meia Entrada -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-xs font-bold text-white">Meia:</span>
            <span id="label-price-meia" class="text-xs font-mono text-emerald-400 font-bold">R$ 21,00</span>
            <div class="flex items-center gap-1 ml-2">
              <button onclick="adjustTicketType('meia', -1)" class="w-6 h-6 rounded bg-zinc-800 text-white font-bold text-xs">-</button>
              <span id="count-meia" class="w-5 text-center font-bold text-xs tabular-nums">0</span>
              <button onclick="adjustTicketType('meia', 1)" class="w-6 h-6 rounded bg-zinc-800 text-white font-bold text-xs">+</button>
            </div>
          </div>

          <!-- Clube CineFood -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-xs font-bold text-white">Clube (30% off):</span>
            <span id="label-price-clube" class="text-xs font-mono text-blue-400 font-bold">R$ 29,40</span>
            <div class="flex items-center gap-1 ml-2">
              <button onclick="adjustTicketType('clube', -1)" class="w-6 h-6 rounded bg-zinc-800 text-white font-bold text-xs">-</button>
              <span id="count-clube" class="w-5 text-center font-bold text-xs tabular-nums">0</span>
              <button onclick="adjustTicketType('clube', 1)" class="w-6 h-6 rounded bg-zinc-800 text-white font-bold text-xs">+</button>
            </div>
          </div>
        </div>
      </div>

      <!-- SEAT MAP CANVAS -->
      <div class="p-6 sm:p-8 rounded-3xl bg-[#0B0B12] border-2 border-zinc-800 flex flex-col items-center space-y-8 overflow-x-auto">
        
        <!-- Curved Cinema Screen Indicator -->
        <div class="w-full max-w-lg space-y-2 text-center">
          <div class="h-2 w-full rounded-full bg-gradient-to-r from-transparent via-cine-sunsetAmber to-transparent shadow-lg shadow-cine-sunsetAmber/40"></div>
          <span class="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">TELA CURVA DE ALTA DEFINIÇÃO</span>
        </div>

        <!-- Seats Grid -->
        <div id="grid-seats" role="grid" aria-label="Mapa de Poltronas da Sala" class="flex flex-col gap-3 min-w-[500px]">
          <!-- Injected dynamically by JS -->
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-400 pt-4 border-t border-zinc-800">
          <div class="flex items-center gap-1.5">
            <div class="w-4 h-4 rounded bg-zinc-800 border border-zinc-700"></div>
            <span>Disponível</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-4 h-4 rounded bg-cine-sunsetOrange text-white flex items-center justify-center font-bold text-[9px]">✓</div>
            <span class="text-white font-bold">Selecionado</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-4 h-4 rounded bg-zinc-900 border border-zinc-800 opacity-40"></div>
            <span>Ocupado</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-4 h-4 rounded bg-blue-600/60 border border-blue-400"></div>
            <span>Acessível PCD</span>
          </div>
        </div>
      </div>

      <!-- BOTTOM SELECTION SUMMARY FOOTER -->
      <div class="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-2xl backdrop-blur-md">
        <div>
          <span class="text-xs text-zinc-400 block font-mono">Poltronas Selecionadas:</span>
          <div id="selected-list" class="flex flex-wrap gap-1.5 mt-1 font-bold text-white text-sm">
            Nenhuma poltrona selecionada
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right">
            <span class="text-xs text-zinc-400 block font-mono">Total Parcial:</span>
            <span id="price-total" class="text-xl font-mono font-black text-cine-sunsetGold tabular-nums">R$ 0,00</span>
          </div>

          <button id="btn-proceed" onclick="openConcessionDrawer()" disabled class="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-[0.97]">
            <span>Adicionar Gastronomia</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

    </section>

  </main>

  <!-- ============================================== -->
  <!-- CONCESSION & IN-SEAT DINING DRAWER (IOS CURVE) -->
  <!-- ============================================== -->
  <div id="drawer-concession" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center hidden" style="transition: opacity 250ms var(--ease-drawer);">
    <div class="w-full max-w-2xl max-h-[85vh] bg-[#12100D] border-t-2 border-cine-sunsetAmber/40 rounded-t-3xl p-6 flex flex-col space-y-6 overflow-hidden shadow-2xl" style="transform-origin: bottom center;">
      
      <!-- Drawer Header -->
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cine-sunsetAmber/20 flex items-center justify-center">
            <i data-lucide="utensils" class="w-5 h-5 text-cine-sunsetGold"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Cardápio de Alta Gastronomia</h3>
            <span class="text-xs text-zinc-400">Servido silenciosamente na sua poltrona antes do filme</span>
          </div>
        </div>
        <button onclick="closeConcessionDrawer()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300">
          ✕
        </button>
      </div>

      <!-- Drawer Items List -->
      <div class="flex-1 overflow-y-auto space-y-3 pr-1">
        
        <!-- Dish 1 -->
        <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <h4 class="text-sm font-bold text-white">Burger Angus Trufado no Brioche</h4>
            <p class="text-xs text-zinc-400">180g Angus, queijo gruyère, maionese trufada e batatas rústicas</p>
            <span class="text-xs font-mono font-bold text-cine-sunsetGold mt-1 block">R$ 48,00</span>
          </div>
          <button onclick="addConcessionItem('Burger Angus Trufado', 48.00)" class="px-3.5 py-1.5 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
            + Adicionar
          </button>
        </div>

        <!-- Dish 2 -->
        <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <h4 class="text-sm font-bold text-white">Pipoca Alamo Fondue de Queijo</h4>
            <p class="text-xs text-zinc-400">Balde grande com manteiga temperada e panela de fondue de queijo</p>
            <span class="text-xs font-mono font-bold text-cine-sunsetGold mt-1 block">R$ 38,00</span>
          </div>
          <button onclick="addConcessionItem('Pipoca Alamo Fondue', 38.00)" class="px-3.5 py-1.5 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
            + Adicionar
          </button>
        </div>

        <!-- Dish 3 -->
        <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <h4 class="text-sm font-bold text-white">Tábua de Queijos da Serra da Canastra</h4>
            <p class="text-xs text-zinc-400">Seleção artesanal com castanhas tostadas e mel de laranjeira</p>
            <span class="text-xs font-mono font-bold text-cine-sunsetGold mt-1 block">R$ 52,00</span>
          </div>
          <button onclick="addConcessionItem('Tábua de Queijos Canastra', 52.00)" class="px-3.5 py-1.5 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
            + Adicionar
          </button>
        </div>

        <!-- Dish 4 -->
        <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <h4 class="text-sm font-bold text-white">Espresso Martini Signature</h4>
            <p class="text-xs text-zinc-400">Café especial extraído na hora, vodka premium e licor de cacau</p>
            <span class="text-xs font-mono font-bold text-cine-sunsetGold mt-1 block">R$ 42,00</span>
          </div>
          <button onclick="addConcessionItem('Espresso Martini Signature', 42.00)" class="px-3.5 py-1.5 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
            + Adicionar
          </button>
        </div>

      </div>

      <!-- Drawer Footer with Total & Checkout -->
      <div class="pt-4 border-t border-zinc-800 flex items-center justify-between gap-4">
        <div>
          <span class="text-xs text-zinc-400 font-mono block">Subtotal Gastronomia:</span>
          <span id="drawer-total" class="text-xl font-mono font-black text-cine-sunsetGold tabular-nums">R$ 0,00</span>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="closeConcessionDrawer()" class="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold active:scale-[0.97]">
            Pular Gastronomia
          </button>
          <button onclick="openCheckoutModal()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white text-xs font-black uppercase tracking-wider shadow-lg active:scale-[0.97] flex items-center gap-2">
            <span>Avançar para Pagamento</span>
            <i data-lucide="check" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

    </div>
  </div>

  <!-- ============================================== -->
  <!-- CHECKOUT MODAL (PIX & CARTÃO 1-CLICK)          -->
  <!-- ============================================== -->
  <div id="modal-checkout" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 hidden">
    <div class="w-full max-w-md bg-[#12100D] border-2 border-cine-sunsetAmber/40 rounded-3xl p-6 space-y-6 shadow-2xl" style="transform: scale(0.98);">
      
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <i data-lucide="shield-check" class="w-5 h-5 text-emerald-400"></i> Checkout Seguro
        </h3>
        <button onclick="closeCheckoutModal()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300">
          ✕
        </button>
      </div>

      <!-- Order Summary Breakdown -->
      <div class="space-y-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
        <div class="flex items-center justify-between text-zinc-400">
          <span>Ingressos:</span>
          <span id="checkout-tickets-subtotal" class="text-white font-bold tabular-nums">R$ 0,00</span>
        </div>
        <div class="flex items-center justify-between text-zinc-400">
          <span>Gastronomia na Poltrona:</span>
          <span id="checkout-concession-subtotal" class="text-cine-sunsetGold font-bold tabular-nums">R$ 0,00</span>
        </div>
        <div class="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm font-bold">
          <span class="text-white">TOTAL FINAL:</span>
          <span id="checkout-total-price" class="text-cine-sunsetAmber text-lg font-black tabular-nums">R$ 0,00</span>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="space-y-3">
        <span class="text-xs font-bold text-zinc-400 block font-mono">Forma de Pagamento:</span>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="setPaymentMethod('pix')" id="tab-pay-pix" class="py-2.5 rounded-xl bg-cine-sunsetOrange text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-cine-sunsetOrange shadow-md active:scale-[0.97]">
            <i data-lucide="qr-code" class="w-4 h-4"></i> PIX Instantâneo
          </button>
          <button onclick="setPaymentMethod('card')" id="tab-pay-card" class="py-2.5 rounded-xl bg-zinc-900 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-800 active:scale-[0.97]">
            <i data-lucide="credit-card" class="w-4 h-4"></i> Cartão / Apple Pay
          </button>
        </div>
      </div>

      <!-- Confirm Button -->
      <button onclick="confirmPaymentAndIssueTicket()" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-black uppercase tracking-wider shadow-lg active:scale-[0.97] flex items-center justify-center gap-2">
        <i data-lucide="lock" class="w-4 h-4"></i> Confirmar & Emitir Ingresso
      </button>

    </div>
  </div>

  <!-- ============================================== -->
  <!-- SONNER TOAST CONTAINER (EMIL KOWALSKI PATTERN) -->
  <!-- ============================================== -->
  <div id="sonner-toaster" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"></div>

  <!-- ============================================== -->
  <!-- APPLICATION CORE LOGIC (JAVASCRIPT)            -->
  <!-- ============================================== -->
  <script>
    // System State
    let currentArchetype = 'solar-sunset';
    let selectedSeats = new Set();
    let currentMovie = 'Duna: Parte 2';
    let currentTime = '19:30';
    let currentRoom = 'Sala Laser 1';
    let currentBasePrice = 42.00;
    let concessionTotal = 0.00;
    let inTheaterMode = false;
    let timerSec = 600;
    let timerInterval = null;

    let ticketCounts = {
      inteira: 0,
      meia: 0,
      clube: 0
    };

    // Dates for Sticky Strip
    const DATES = [
      { day: 'SEX', num: '06', month: 'NOV', occ: '75%' },
      { day: 'SÁB', num: '07', month: 'NOV', occ: '92%' },
      { day: 'DOM', num: '08', month: 'NOV', occ: '88%' },
      { day: 'SEG', num: '09', month: 'NOV', occ: '35%' },
      { day: 'TER', num: '10', month: 'NOV', occ: '42%' },
      { day: 'QUA', num: '11', month: 'NOV', occ: '60%' },
      { day: 'QUI', num: '12', month: 'NOV', occ: '40%' }
    ];

    function initDateStrip() {
      const container = document.getElementById('date-strip-container');
      if (!container) return;
      container.innerHTML = '';

      DATES.forEach((d, idx) => {
        const btn = document.createElement('button');
        const isActive = idx === 0;
        btn.className = `date-pill flex-shrink-0 min-w-[62px] px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center transition active:scale-[0.97] ${
          isActive 
            ? 'bg-gradient-to-br from-cine-sunsetOrange to-cine-sunsetAmber text-white font-bold border-cine-sunsetGold/50 shadow-md shadow-cine-sunsetOrange/30' 
            : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
        }`;
        btn.innerHTML = `
          <span class="text-[9px] font-bold uppercase tracking-wider">${d.day}</span>
          <span class="text-sm font-black leading-none">${d.num}</span>
          <span class="text-[8px] opacity-75">${d.month}</span>
        `;
        btn.onclick = () => {
          document.querySelectorAll('.date-pill').forEach(b => {
            b.className = 'date-pill flex-shrink-0 min-w-[62px] px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center transition active:scale-[0.97] bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 border-zinc-800';
          });
          btn.className = 'date-pill flex-shrink-0 min-w-[62px] px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center transition active:scale-[0.97] bg-gradient-to-br from-cine-sunsetOrange to-cine-sunsetAmber text-white font-bold border-cine-sunsetGold/50 shadow-md shadow-cine-sunsetOrange/30';
          toast.show(`Data alterada para ${d.day} ${d.num}/${d.month}`, { type: 'info' });
        };
        container.appendChild(btn);
      });
    }

    // Archetype Switcher
    function setArchetype(arch) {
      currentArchetype = arch;
      document.body.setAttribute('data-archetype', arch);
      localStorage.setItem('cinefood-archetype', arch);

      const lSunset = document.getElementById('layout-solar-sunset');
      const lBoutique = document.getElementById('layout-boutique-gold');
      const lCyber = document.getElementById('layout-cyber-imax');
      const lCinephile = document.getElementById('layout-cinephile-minimal');

      if (lSunset) lSunset.classList.toggle('hidden', arch !== 'solar-sunset');
      if (lBoutique) lBoutique.classList.toggle('hidden', arch !== 'boutique-gold');
      if (lCyber) lCyber.classList.toggle('hidden', arch !== 'cyber-imax');
      if (lCinephile) lCinephile.classList.toggle('hidden', arch !== 'cinephile-minimal');

      // Update switcher buttons
      const btnSunset = document.getElementById('btn-arch-sunset');
      const btnBoutique = document.getElementById('btn-arch-boutique');
      const btnCyber = document.getElementById('btn-arch-cyber');
      const btnCinephile = document.getElementById('btn-arch-cinephile');

      [btnSunset, btnBoutique, btnCyber, btnCinephile].forEach(b => {
        if (!b) return;
        b.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white active:scale-[0.97]';
      });

      if (arch === 'solar-sunset' && btnSunset) {
        btnSunset.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white shadow-md shadow-cine-sunsetOrange/30 active:scale-[0.97]';
        toast.show('Ativado: Solar Sunset Bento Grid (#FF4D00 / #1B1B3A)', { type: 'success' });
      } else if (arch === 'boutique-gold' && btnBoutique) {
        btnBoutique.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-amber-500 text-black shadow-md active:scale-[0.97]';
        toast.show('Ativado: Alamo Drafthouse Cine-Gazette (Timeline Matrix & Quinas 0px)', { type: 'info' });
      } else if (arch === 'cyber-imax' && btnCyber) {
        btnCyber.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-rose-300 text-black shadow-md active:scale-[0.97]';
        toast.show('Ativado: Everyman Cinemas Velvet Salon (Sofás Duplos & Baskerville)', { type: 'info' });
      } else if (arch === 'cinephile-minimal' && btnCinephile) {
        btnCinephile.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-red-600 text-white shadow-md active:scale-[0.97]';
        toast.show('Ativado: AMC & Cinemark Stadium (Format Radar & Widescreen 21:9)', { type: 'info' });
      }

      if (window.lucide) lucide.createIcons();
    }

    // Switch View between Catalog and Seat Map
    function switchView(view) {
      const vCatalog = document.getElementById('view-catalog-movie');
      const vSeats = document.getElementById('view-seats');

      if (view === 'seats') {
        vCatalog.classList.add('hidden');
        vSeats.classList.remove('hidden');
        initSeatGrid();
        startTimer();
      } else {
        vCatalog.classList.remove('hidden');
        vSeats.classList.add('hidden');
        clearInterval(timerInterval);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Open Seat Selection with Movie Context
    function openSeatSelection(title, time, room, price) {
      currentMovie = title;
      currentTime = time;
      currentRoom = room;
      currentBasePrice = price;

      document.getElementById('active-movie').textContent = title;
      document.getElementById('active-details').textContent = `Hoje às ${time} • ${room}`;
      
      // Update price labels
      document.getElementById('label-price-inteira').textContent = `R$ ${price.toFixed(2).replace('.', ',')}`;
      document.getElementById('label-price-meia').textContent = `R$ ${(price / 2).toFixed(2).replace('.', ',')}`;
      document.getElementById('label-price-clube').textContent = `R$ ${(price * 0.7).toFixed(2).replace('.', ',')}`;

      selectedSeats.clear();
      ticketCounts = { inteira: 0, meia: 0, clube: 0 };
      updateTicketCountLabels();
      updateSummary();

      switchView('seats');
      toast.show(`Sessão selecionada: ${title} às ${time}`, { type: 'info' });
    }

    // Generate Dynamic Seat Grid with Love-Seats & Accessible Seats
    const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
    const COLS = 8;
    const OCCUPIED = new Set(['B03', 'B04', 'C05', 'D04', 'D05', 'E02']);
    const ACCESSIBLE = new Set(['A01', 'A08']);

    function initSeatGrid() {
      const container = document.getElementById('grid-seats');
      if (!container) return;
      container.innerHTML = '';

      ROWS.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'flex items-center justify-center gap-2.5 sm:gap-3';

        // Row label left
        const lblL = document.createElement('span');
        lblL.className = 'w-5 text-center text-xs font-mono font-bold text-zinc-500';
        lblL.textContent = row;
        rowEl.appendChild(lblL);

        // Seats in row
        for (let col = 1; col <= COLS; col++) {
          // Corridor aisle gap
          if (col === 5) {
            const gap = document.createElement('div');
            gap.className = 'w-6 sm:w-8';
            rowEl.appendChild(gap);
          }

          const seatId = `${row}0${col}`;
          const isOcc = OCCUPIED.has(seatId);
          const isAcc = ACCESSIBLE.has(seatId);
          const isSweetSpot = (row === 'D' || row === 'E') && (col >= 3 && col <= 6);

          const btn = document.createElement('button');
          btn.setAttribute('data-seat-id', seatId);
          btn.className = `seat-btn w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-mono text-[11px] font-bold border transition ${
            isOcc 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed' 
              : isAcc
                ? 'bg-blue-600/30 border-blue-400 text-blue-200 hover:bg-blue-600/50'
                : isSweetSpot
                  ? 'bg-zinc-900 border-cine-sunsetAmber/40 text-cine-sunsetGold hover:border-cine-sunsetGold shadow-sm'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
          }`;
          btn.textContent = col;
          btn.disabled = isOcc;

          btn.onclick = () => toggleSeat(seatId, btn);
          rowEl.appendChild(btn);
        }

        // Row label right
        const lblR = document.createElement('span');
        lblR.className = 'w-5 text-center text-xs font-mono font-bold text-zinc-500';
        lblR.textContent = row;
        rowEl.appendChild(lblR);

        container.appendChild(rowEl);
      });
    }

    // Toggle Seat
    function toggleSeat(seatId, btn) {
      if (selectedSeats.has(seatId)) {
        selectedSeats.delete(seatId);
        btn.classList.remove('bg-cine-sunsetOrange', 'border-cine-sunsetGold', 'text-white', 'shadow-lg');
        btn.classList.add('bg-zinc-800/80', 'text-zinc-300');
        rebalanceTickets();
      } else {
        if (selectedSeats.size >= 8) {
          toast.show('Limite de 8 poltronas por reserva atingido', { type: 'error' });
          return;
        }
        selectedSeats.add(seatId);
        btn.classList.remove('bg-zinc-800/80', 'text-zinc-300');
        btn.classList.add('bg-cine-sunsetOrange', 'border-cine-sunsetGold', 'text-white', 'shadow-lg');
        ticketCounts.inteira += 1;
        updateTicketCountLabels();
        toast.show(`Poltrona ${seatId} reservada`, { type: 'success' });
      }
      updateSummary();
    }

    // Rebalance ticket modal counts when a seat is unselected
    function rebalanceTickets() {
      const total = selectedSeats.size;
      let sum = ticketCounts.inteira + ticketCounts.meia + ticketCounts.clube;
      if (sum > total) {
        if (ticketCounts.inteira > 0) ticketCounts.inteira--;
        else if (ticketCounts.meia > 0) ticketCounts.meia--;
        else if (ticketCounts.clube > 0) ticketCounts.clube--;
        updateTicketCountLabels();
      }
    }

    function adjustTicketType(type, delta) {
      const currentAssigned = ticketCounts.inteira + ticketCounts.meia + ticketCounts.clube;
      const totalSeats = selectedSeats.size;

      if (delta > 0 && currentAssigned >= totalSeats) {
        toast.show('Selecione mais poltronas no mapa para adicionar ingressos', { type: 'error' });
        return;
      }
      if (delta < 0 && ticketCounts[type] <= 0) return;

      ticketCounts[type] += delta;
      updateTicketCountLabels();
      updateSummary();
    }

    function updateTicketCountLabels() {
      document.getElementById('count-inteira').textContent = ticketCounts.inteira;
      document.getElementById('count-meia').textContent = ticketCounts.meia;
      document.getElementById('count-clube').textContent = ticketCounts.clube;
    }

    function calculateTicketsTotal() {
      const pInteira = currentBasePrice;
      const pMeia = currentBasePrice / 2;
      const pClube = currentBasePrice * 0.7;
      return (ticketCounts.inteira * pInteira) + (ticketCounts.meia * pMeia) + (ticketCounts.clube * pClube);
    }

    function updateSummary() {
      const listEl = document.getElementById('selected-list');
      const proceedBtn = document.getElementById('btn-proceed');
      const totalTickets = calculateTicketsTotal();
      const grandTotal = totalTickets + concessionTotal;

      document.getElementById('price-total').textContent = `R$ ${grandTotal.toFixed(2).replace('.', ',')}`;

      if (selectedSeats.size === 0) {
        listEl.textContent = 'Nenhuma poltrona selecionada';
        proceedBtn.disabled = true;
        proceedBtn.className = 'px-6 py-3 rounded-xl bg-zinc-800 text-zinc-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-not-allowed';
      } else {
        listEl.innerHTML = Array.from(selectedSeats).map(s => 
          `<span class="px-2 py-0.5 rounded-lg bg-cine-sunsetOrange/20 border border-cine-sunsetOrange text-cine-sunsetGold text-xs font-mono font-bold">${s}</span>`
        ).join(' ');

        proceedBtn.disabled = false;
        proceedBtn.className = 'px-6 py-3 rounded-xl bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.97]';
      }
    }

    // Reservation Timer
    function startTimer() {
      clearInterval(timerInterval);
      timerSec = 600;
      updateTimer();
      timerInterval = setInterval(() => {
        timerSec--;
        if (timerSec <= 0) {
          clearInterval(timerInterval);
          toast.show('Tempo de reserva esgotado. Poltronas liberadas.', { type: 'error' });
          switchView('catalog');
        } else {
          updateTimer();
        }
      }, 1000);
    }

    function updateTimer() {
      const min = Math.floor(timerSec / 60);
      const sec = timerSec % 60;
      const timerEl = document.getElementById('seat-timer');
      if (timerEl) {
        timerEl.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      }
    }

    // Concession Drawer
    function openConcessionDrawer() {
      const drawer = document.getElementById('drawer-concession');
      drawer.classList.remove('hidden');
      updateDrawerTotal();
      if (window.lucide) lucide.createIcons();
    }

    function closeConcessionDrawer() {
      document.getElementById('drawer-concession').classList.add('hidden');
    }

    function addConcessionItem(name, price) {
      concessionTotal += price;
      updateDrawerTotal();
      updateSummary();
      toast.show(`+ ${name} (R$ ${price.toFixed(2).replace('.', ',')}) adicionado ao pedido!`, { type: 'success' });
    }

    function updateDrawerTotal() {
      document.getElementById('drawer-total').textContent = `R$ ${concessionTotal.toFixed(2).replace('.', ',')}`;
    }

    // Checkout Modal
    function openCheckoutModal() {
      closeConcessionDrawer();
      const modal = document.getElementById('modal-checkout');
      modal.classList.remove('hidden');

      const ticketsTotal = calculateTicketsTotal();
      const grandTotal = ticketsTotal + concessionTotal;

      document.getElementById('checkout-tickets-subtotal').textContent = `R$ ${ticketsTotal.toFixed(2).replace('.', ',')}`;
      document.getElementById('checkout-concession-subtotal').textContent = `R$ ${concessionTotal.toFixed(2).replace('.', ',')}`;
      document.getElementById('checkout-total-price').textContent = `R$ ${grandTotal.toFixed(2).replace('.', ',')}`;
    }

    function closeCheckoutModal() {
      document.getElementById('modal-checkout').classList.add('hidden');
    }

    function setPaymentMethod(method) {
      const bPix = document.getElementById('tab-pay-pix');
      const bCard = document.getElementById('tab-pay-card');

      if (method === 'pix') {
        bPix.className = 'py-2.5 rounded-xl bg-cine-sunsetOrange text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-cine-sunsetOrange shadow-md active:scale-[0.97]';
        bCard.className = 'py-2.5 rounded-xl bg-zinc-900 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-800 active:scale-[0.97]';
      } else {
        bCard.className = 'py-2.5 rounded-xl bg-cine-sunsetOrange text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-cine-sunsetOrange shadow-md active:scale-[0.97]';
        bPix.className = 'py-2.5 rounded-xl bg-zinc-900 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-800 active:scale-[0.97]';
      }
    }

    function confirmPaymentAndIssueTicket() {
      closeCheckoutModal();
      clearInterval(timerInterval);
      toast.show('🎉 Pagamento aprovado! Seu ingresso e pedido foram emitidos.', { type: 'success' });
      setTimeout(() => {
        toast.show(`📱 Poltronas [${Array.from(selectedSeats).join(', ')}] confirmadas para ${currentMovie}!`, { type: 'info' });
        switchView('catalog');
      }, 1200);
    }

    // In-Theater Silent Mode Toggle
    function toggleTheaterMode() {
      inTheaterMode = !inTheaterMode;
      const banner = document.getElementById('banner-theater-mode');
      const btn = document.getElementById('btn-theater-mode');

      if (inTheaterMode) {
        document.body.style.backgroundColor = '#000000';
        banner.classList.remove('hidden');
        btn.classList.add('bg-cine-sunsetGold', 'text-black');
        toast.show('Modo Sala Escura (OLED 0 cd/m²) ativado', { type: 'info' });
      } else {
        document.body.style.backgroundColor = '#0B0B12';
        banner.classList.add('hidden');
        btn.classList.remove('bg-cine-sunsetGold', 'text-black');
        toast.show('Modo Sala Escura desativado', { type: 'info' });
      }
    }

    function quickRepeatLastOrder() {
      toast.show('🔁 Pedido anterior (Pipoca Trufada + Chopp) repetido e enviado à cozinha!', { type: 'success' });
    }

    function setDualEntry(mode) {
      const bMovie = document.getElementById('entry-by-movie');
      const bCinema = document.getElementById('entry-by-cinema');

      if (mode === 'movie') {
        bMovie.className = 'px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-bold shadow-sm flex items-center gap-1.5 transition';
        bCinema.className = 'px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white flex items-center gap-1.5 transition';
        toast.show('Modo de Descoberta: Por Filme', { type: 'info' });
      } else {
        bCinema.className = 'px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-bold shadow-sm flex items-center gap-1.5 transition';
        bMovie.className = 'px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white flex items-center gap-1.5 transition';
        toast.show('Modo de Descoberta: Por Complexo / Shopping', { type: 'info' });
      }
    }

    // Accessible Sonner Toast System
    const toast = {
      show: (message, options = {}) => {
        const toaster = document.getElementById('sonner-toaster');
        if (!toaster) return;

        const el = document.createElement('div');
        const type = options.type || 'info';
        
        let bgBorder = 'bg-zinc-900/95 border-zinc-700 text-white';
        let icon = 'info';
        if (type === 'success') {
          bgBorder = 'bg-zinc-950/95 border-emerald-500/50 text-white';
          icon = 'check-circle';
        } else if (type === 'error') {
          bgBorder = 'bg-zinc-950/95 border-red-500/50 text-white';
          icon = 'alert-triangle';
        }

        el.className = `p-3.5 rounded-2xl border ${bgBorder} shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-medium pointer-events-auto transition duration-300`;
        el.style.transform = 'translateY(10px) scale(0.95)';
        el.style.opacity = '0';

        el.innerHTML = `
          <i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0 ${type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : 'text-cine-sunsetAmber'}"></i>
          <span class="flex-1">${message}</span>
        `;

        toaster.appendChild(el);
        if (window.lucide) lucide.createIcons();

        // Animate in
        requestAnimationFrame(() => {
          el.style.transform = 'translateY(0) scale(1)';
          el.style.opacity = '1';
        });

        // Auto dismiss
        setTimeout(() => {
          el.style.transform = 'translateY(10px) scale(0.95)';
          el.style.opacity = '0';
          setTimeout(() => el.remove(), 250);
        }, options.duration || 3200);
      }
    };

    // Live Countdown for Bento Marquee
    function startBentoCountdown() {
      let sec = 42 * 60 + 18;
      setInterval(() => {
        sec--;
        if (sec <= 0) sec = 45 * 60;
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const countEl = document.getElementById('bento-countdown');
        if (countEl) {
          countEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      }, 1000);
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
      initDateStrip();
      const savedArch = localStorage.getItem('cinefood-archetype') || 'solar-sunset';
      setArchetype(savedArch);
      startBentoCountdown();
      if (window.lucide) lucide.createIcons();
    });
  </script>
</body>
</html>"""

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html_code)

print(f"File successfully created: {output_path} ({len(html_code)} bytes)")
