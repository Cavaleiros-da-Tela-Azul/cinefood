import os
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

print("Building world-class cinema prototype with verified real artwork and 4 radical layouts...")

html_content = """<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>CineFood — Multiplex & Gastronomia na Poltrona</title>
  
  <!-- Google Fonts: Oswald, Plus Jakarta Sans, Space Grotesk, Cormorant Garamond, JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400;1,600&family=JetBrains+Mono:wght@400;600;800&family=Oswald:wght@500;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700;800&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            cine: {
              // Paleta Solar Sunset Oficial do Usuário
              sunsetOrange: '#FF4D00',
              sunsetAmber: '#FF9F1C',
              sunsetGold: '#FFD166',
              sunsetIndigo: '#1B1B3A',
              sunsetVoid: '#0B0B12',
              
              // Alamo Drafthouse Tokens
              alamoGold: '#F5B324',
              alamoDark: '#090909',
              alamoCard: '#141414',
              
              // Everyman Cinemas Tokens
              everymanRose: '#EE9CA6',
              everymanBlush: '#EFCFD3',
              everymanEspresso: '#212020',
              everymanCard: '#181616',
              
              // AMC & Cinemark Tokens
              amcRed: '#CE0E2D',
              cinemarkDark: '#000000',
              cinemarkCard: '#121212',
              
              // Auxiliares
              surfaceDark: '#12100D',
              surfaceMuted: '#1E1E24',
              borderDark: '#2A2A32'
            }
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            bento: ['"Space Grotesk"', 'sans-serif'],
            serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
            headline: ['"Oswald"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          }
        }
      }
    }
  </script>

  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
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

    /* Tabular Nums para preços e relógios sem tremulação */
    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }

    /* Micro-interação tátil de botão de Emil Kowalski */
    button, [role="button"], .interactive-press {
      transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out), border-color 160ms var(--ease-out);
    }
    button:active, [role="button"]:active, .interactive-press:active {
      transform: scale(0.97);
    }

    /* Foco acessível */
    :focus-visible {
      outline: 2px solid #FF9F1C !important;
      outline-offset: 2px !important;
    }

    /* Scrollbars discretos */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #0B0B12;
    }
    ::-webkit-scrollbar-thumb {
      background: #27272A;
      border-radius: 9999px;
    }

    /* Transição suave do mapa de poltronas */
    .seat-btn {
      transition: transform 140ms var(--ease-out), background-color 140ms var(--ease-out);
    }
    .seat-btn:hover:not(:disabled) {
      transform: translateY(-2px);
    }
  </style>
</head>
<body data-archetype="solar-sunset" class="min-h-screen flex flex-col bg-[#0B0B12]">

  <!-- ==================================================== -->
  <!-- TOP BENCHMARK SWITCHER: 4 RADICAL REAL-WORLD LAYOUTS -->
  <!-- ==================================================== -->
  <aside id="benchmark-bar" class="bg-black border-b border-zinc-800 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-50 sticky top-0">
    <div class="flex items-center gap-2.5">
      <div class="w-2.5 h-2.5 rounded-full bg-cine-sunsetOrange animate-pulse shadow-md shadow-cine-sunsetOrange"></div>
      <span class="font-extrabold uppercase tracking-widest text-[11px] text-white flex items-center gap-1.5">
        <i data-lucide="layers" class="w-3.5 h-3.5 text-cine-sunsetAmber"></i> Escolha a Direção de Design:
      </span>
      <span class="text-zinc-400 text-[11px] hidden lg:inline">Alterne entre 4 conceitos macro com pôsteres e gastronomia real:</span>
    </div>

    <!-- 4 Real Layout Buttons -->
    <div class="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 overflow-x-auto max-w-full">
      <button onclick="setArchetype('solar-sunset')" id="btn-arch-sunset" class="px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white shadow-md active:scale-[0.97]" title="Opção 1: Paleta Solar Sunset (#FF4D00, #FF9F1C, #FFD166, #1B1B3A, #0B0B12) em Bento Grid com Rail de Cartazes">
        <i data-lucide="sun" class="w-3.5 h-3.5 text-cine-sunsetGold"></i>
        <span>1. Solar Sunset (Festival)</span>
      </button>

      <button onclick="setArchetype('everyman-velvet')" id="btn-arch-everyman" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white active:scale-[0.97]" title="Opção 2: Everyman Boutique Club (Sofás de Veludo, Serifa Baskerville, Vinhos Orgânicos e Rosa Blush #EE9CA6)">
        <i data-lucide="armchair" class="w-3.5 h-3.5 text-rose-300"></i>
        <span>2. Everyman Velvet Lounge</span>
      </button>

      <button onclick="setArchetype('alamo-drafthouse')" id="btn-arch-alamo" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white active:scale-[0.97]" title="Opção 3: Alamo Drafthouse Cinephile (Quinas 0px, Ouro #F5B324, Tabela Horária e Cozinha na Fileira)">
        <i data-lucide="beer" class="w-3.5 h-3.5 text-amber-400"></i>
        <span>3. Alamo Drafthouse Dine-In</span>
      </button>

      <button onclick="setArchetype('amc-cinemark')" id="btn-arch-amc" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white active:scale-[0.97]" title="Opção 4: AMC & Cinemark Stadium Megaplex (Radar IMAX/Dolby/XD, Widescreen 21:9, Vermelho #CE0E2D, Stadium Pills)">
        <i data-lucide="tv" class="w-3.5 h-3.5 text-red-500"></i>
        <span>4. AMC / Cinemark Stadium</span>
      </button>
    </div>
  </aside>

  <!-- ============================================== -->
  <!-- MAIN APP TOPBAR (SOLID, ZERO TRANSPARENCY BUG) -->
  <!-- ============================================== -->
  <header class="bg-[#0B0B12] border-b border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
    <div class="flex items-center gap-6">
      <!-- BESPOKE BRAND LOGOMARK -->
      <div class="flex items-center gap-3 cursor-pointer group" onclick="switchView('catalog');">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cine-sunsetOrange via-cine-sunsetAmber to-cine-sunsetGold flex items-center justify-center shadow-lg shadow-cine-sunsetOrange/30 group-hover:scale-105 transition duration-200">
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

      <!-- SEARCH / FILTER INPUT -->
      <div class="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 w-72">
        <i data-lucide="search" class="w-4 h-4 text-zinc-500"></i>
        <input type="text" placeholder="Buscar filmes, pratos, salas..." class="bg-transparent border-none outline-none text-xs text-white placeholder-zinc-500 w-full" onkeyup="filterMovies(this.value)">
      </div>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="flex items-center gap-3">
      <!-- Cardápio Button -->
      <button onclick="openConcessionDrawer()" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cine-sunsetOrange/20 to-cine-sunsetAmber/20 hover:from-cine-sunsetOrange/30 hover:to-cine-sunsetAmber/30 border border-cine-sunsetOrange/40 text-xs text-cine-sunsetGold font-bold flex items-center gap-2 transition active:scale-[0.97]">
        <i data-lucide="utensils" class="w-4 h-4 text-cine-sunsetAmber"></i>
        <span class="hidden sm:inline">Cardápio da Poltrona</span>
      </button>

      <!-- Cart Button with Live Badge -->
      <button onclick="openConcessionDrawer()" class="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-[0.97]" title="Carrinho Gastronômico">
        <i data-lucide="shopping-bag" class="w-4 h-4 text-cine-sunsetGold"></i>
        <span id="badge-cart-count" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cine-sunsetOrange text-white text-[9px] font-black flex items-center justify-center hidden">0</span>
      </button>

      <!-- User Avatar -->
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cine-sunsetOrange to-cine-sunsetAmber text-white font-bold text-xs flex items-center justify-center shadow-md">
        GA
      </div>
    </div>
  </header>

  <!-- STICKY DATE-STRIP -->
  <nav aria-label="Seleção de Datas de Exibição" class="sticky top-[45px] z-30 bg-[#0B0B12] border-b border-zinc-800 px-4 sm:px-8 py-2">
    <div class="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto date-strip-scroll" id="date-strip-container">
      <!-- Date Pills dynamically populated -->
    </div>
  </nav>

  <!-- ============================================== -->
  <!-- MAIN WORKSPACE                                 -->
  <!-- ============================================== -->
  <main id="main-content" class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-10">

    <!-- VIEW 1: CATALOG VIEW -->
    <section id="view-catalog-movie">

      <!-- ===================================================================== -->
      <!-- ARQUITETURA 1: SOLAR SUNSET (FESTIVAL CINE-BISTRÔ & BENTO RAIL)       -->
      <!-- Cores: #FF4D00, #FF9F1C, #FFD166, #1B1B3A, #0B0B12                  -->
      <!-- ===================================================================== -->
      <div id="layout-solar-sunset" class="space-y-10">

        <!-- HERO CINEMATOGRÁFICO DE IMPACTO COM BACKDROP REAL DE DUNA 2 -->
        <div class="rounded-3xl bg-[#1B1B3A] border-2 border-cine-sunsetAmber/40 relative overflow-hidden shadow-2xl flex flex-col justify-end min-h-[440px] sm:min-h-[500px] p-6 sm:p-10">
          <!-- Real Backdrop Image with Dark Scrim -->
          <img src="https://image.tmdb.org/t/p/w1280/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" alt="Duna: Parte 2 Backdrop" class="absolute inset-0 w-full h-full object-cover object-center">
          <div class="absolute inset-0 bg-gradient-to-t from-[#0B0B12] via-[#0B0B12]/70 to-transparent"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-[#0B0B12] via-[#0B0B12]/60 to-transparent"></div>

          <!-- Content overlay -->
          <div class="relative z-10 space-y-4 max-w-3xl">
            <div class="flex flex-wrap items-center gap-2.5">
              <span class="px-3 py-1 rounded-full bg-cine-sunsetOrange text-white font-black text-xs uppercase tracking-wider shadow-lg">
                ★ Estreia da Semana
              </span>
              <span class="px-2.5 py-1 rounded-full bg-[#1B1B3A] text-cine-sunsetGold border border-cine-sunsetGold/40 font-mono text-xs font-bold">
                IMAX Dual Laser 4K
              </span>
              <span class="px-2.5 py-1 rounded-full bg-zinc-900/90 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                Rotten 93% • IMDb 8.6
              </span>
              <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40">
                14 ANOS
              </span>
            </div>

            <h1 class="text-4xl sm:text-6xl font-black text-white font-bento tracking-tight leading-none drop-shadow-md">
              DUNA: PARTE 2
            </h1>

            <p class="text-sm sm:text-base text-zinc-200 line-clamp-3 max-w-2xl leading-relaxed drop-shadow">
              Paul Atreides se une a Chani e aos Fremen em sua busca por vingança contra os conspiradores que destruíram sua família. Sessão imersiva com áudio calibrado Dolby Atmos e serviço de alta gastronomia à sua poltrona.
            </p>

            <!-- Curated Gastronomy Callout inside Hero -->
            <div class="p-3.5 rounded-2xl bg-[#1B1B3A]/90 border border-cine-sunsetGold/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-xl">
              <div class="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=120&q=80" alt="Burger" class="w-12 h-12 rounded-xl object-cover border border-cine-sunsetAmber/50">
                <div>
                  <span class="text-xs font-bold text-cine-sunsetGold block uppercase">Harmonização Recomendada:</span>
                  <span class="text-xs text-white font-medium">Burger Angus Trufado no Brioche + Chopp IPA Artesanal</span>
                </div>
              </div>
              <button onclick="addConcessionItem('Combo Duna (Burger Trufado + Chopp IPA)', 54.00)" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white text-xs font-black shadow-md active:scale-[0.97] whitespace-nowrap">
                + R$ 54,00 no Assento
              </button>
            </div>

            <!-- Showtime booking buttons -->
            <div class="pt-2 flex flex-wrap items-center gap-3">
              <span class="text-xs font-mono font-bold text-zinc-300">Sessões Hoje (Sala Laser 1):</span>
              <button onclick="openSeatSelection('Duna: Parte 2', '16:00', 'Sala Laser 1 IMAX', 44.00)" class="px-4 py-2 rounded-xl bg-[#1B1B3A] hover:bg-cine-sunsetOrange border border-cine-sunsetAmber/40 text-xs font-bold text-white transition active:scale-[0.97]">
                16:00 <span class="text-cine-sunsetGold text-[10px]">DUB</span>
              </button>
              <button onclick="openSeatSelection('Duna: Parte 2', '19:30', 'Sala Laser 1 IMAX', 48.00)" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white text-xs font-black shadow-lg shadow-cine-sunsetOrange/40 ring-2 ring-cine-sunsetGold/60 transition active:scale-[0.97]">
                🔥 19:30 <span class="text-white text-[10px]">LEG [Últimas Poltronas]</span>
              </button>
              <button onclick="openSeatSelection('Duna: Parte 2', '22:15', 'Sala Laser 1 IMAX', 44.00)" class="px-4 py-2 rounded-xl bg-[#1B1B3A] hover:bg-cine-sunsetOrange border border-cine-sunsetAmber/40 text-xs font-bold text-white transition active:scale-[0.97]">
                22:15 <span class="text-cine-sunsetGold text-[10px]">LEG</span>
              </button>
            </div>
          </div>
        </div>

        <!-- EM ALTA: RAIL HORIZONTAL DE CARTAZES REAIS COM POSTER 2:3 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl sm:text-2xl font-black text-white font-bento tracking-tight flex items-center gap-2">
                <i data-lucide="flame" class="w-5 h-5 text-cine-sunsetOrange"></i> Em Exibição Esta Semana
              </h2>
              <span class="text-xs text-zinc-400">Selecione o filme para ver sinopse, formato e horários</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-cine-sunsetGold font-mono font-bold">6 Grandes Produções</span>
            </div>
          </div>

          <!-- Cards Grid (2:3 Movie Posters with Real Artwork) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

            <!-- Movie 1: Duna 2 -->
            <div class="rounded-2xl bg-[#1B1B3A] border border-cine-sunsetAmber/30 overflow-hidden group hover:border-cine-sunsetOrange transition flex flex-col justify-between">
              <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                <img src="https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg" alt="Duna 2" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-cine-sunsetOrange text-white text-[9px] font-black uppercase">IMAX</span>
                <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[9px] font-bold">14</span>
              </div>
              <div class="p-3 space-y-2">
                <h3 class="text-xs font-bold text-white truncate">Duna: Parte 2</h3>
                <span class="text-[10px] text-zinc-400 block">166 min • Sci-Fi / Épico</span>
                <div class="flex flex-col gap-1 pt-1">
                  <button onclick="openSeatSelection('Duna: Parte 2', '19:30', 'Sala Laser 1', 48.00)" class="w-full py-1.5 rounded-lg bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-[11px] font-bold active:scale-[0.97]">
                    19:30 • R$ 48
                  </button>
                </div>
              </div>
            </div>

            <!-- Movie 2: Interestelar -->
            <div class="rounded-2xl bg-[#1B1B3A] border border-zinc-800 overflow-hidden group hover:border-cine-sunsetOrange transition flex flex-col justify-between">
              <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                <img src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" alt="Interestelar" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black uppercase">35mm</span>
                <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[9px] font-bold">12</span>
              </div>
              <div class="p-3 space-y-2">
                <h3 class="text-xs font-bold text-white truncate">Interestelar</h3>
                <span class="text-[10px] text-zinc-400 block">169 min • Ficção Cósmica</span>
                <div class="flex flex-col gap-1 pt-1">
                  <button onclick="openSeatSelection('Interestelar', '20:15', 'Sala 2 Película', 42.00)" class="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-cine-sunsetOrange hover:text-white text-zinc-200 text-[11px] font-bold active:scale-[0.97]">
                    20:15 • R$ 42
                  </button>
                </div>
              </div>
            </div>

            <!-- Movie 3: Oppenheimer -->
            <div class="rounded-2xl bg-[#1B1B3A] border border-zinc-800 overflow-hidden group hover:border-cine-sunsetOrange transition flex flex-col justify-between">
              <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                <img src="https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" alt="Oppenheimer" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-600 text-white text-[9px] font-black uppercase">70mm</span>
                <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[9px] font-bold">16</span>
              </div>
              <div class="p-3 space-y-2">
                <h3 class="text-xs font-bold text-white truncate">Oppenheimer</h3>
                <span class="text-[10px] text-zinc-400 block">180 min • Drama Histórico</span>
                <div class="flex flex-col gap-1 pt-1">
                  <button onclick="openSeatSelection('Oppenheimer', '18:00', 'Sala 3 Recliner', 46.00)" class="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-cine-sunsetOrange hover:text-white text-zinc-200 text-[11px] font-bold active:scale-[0.97]">
                    18:00 • R$ 46
                  </button>
                </div>
              </div>
            </div>

            <!-- Movie 4: Pobres Criaturas -->
            <div class="rounded-2xl bg-[#1B1B3A] border border-zinc-800 overflow-hidden group hover:border-cine-sunsetOrange transition flex flex-col justify-between">
              <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                <img src="https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg" alt="Pobres Criaturas" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600 text-white text-[9px] font-black uppercase">CULT</span>
                <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[9px] font-bold">18</span>
              </div>
              <div class="p-3 space-y-2">
                <h3 class="text-xs font-bold text-white truncate">Pobres Criaturas</h3>
                <span class="text-[10px] text-zinc-400 block">141 min • Fantasia / Comédia</span>
                <div class="flex flex-col gap-1 pt-1">
                  <button onclick="openSeatSelection('Pobres Criaturas', '21:30', 'Sala 4 Lounge', 42.00)" class="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-cine-sunsetOrange hover:text-white text-zinc-200 text-[11px] font-bold active:scale-[0.97]">
                    21:30 • R$ 42
                  </button>
                </div>
              </div>
            </div>

            <!-- Movie 5: Vidas Passadas -->
            <div class="rounded-2xl bg-[#1B1B3A] border border-zinc-800 overflow-hidden group hover:border-cine-sunsetOrange transition flex flex-col justify-between">
              <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                <img src="https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg" alt="Vidas Passadas" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-teal-600 text-white text-[9px] font-black uppercase">INDIE</span>
                <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[9px] font-bold">12</span>
              </div>
              <div class="p-3 space-y-2">
                <h3 class="text-xs font-bold text-white truncate">Vidas Passadas</h3>
                <span class="text-[10px] text-zinc-400 block">106 min • Romance / Drama</span>
                <div class="flex flex-col gap-1 pt-1">
                  <button onclick="openSeatSelection('Vidas Passadas', '17:00', 'Sala 5 Boutique', 38.00)" class="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-cine-sunsetOrange hover:text-white text-zinc-200 text-[11px] font-bold active:scale-[0.97]">
                    17:00 • R$ 38
                  </button>
                </div>
              </div>
            </div>

            <!-- Movie 6: Gladiador 2 -->
            <div class="rounded-2xl bg-[#1B1B3A] border border-zinc-800 overflow-hidden group hover:border-cine-sunsetOrange transition flex flex-col justify-between">
              <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                <img src="https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg" alt="Gladiador 2" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black uppercase">AÇÃO</span>
                <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[9px] font-bold">16</span>
              </div>
              <div class="p-3 space-y-2">
                <h3 class="text-xs font-bold text-white truncate">Gladiador 2</h3>
                <span class="text-[10px] text-zinc-400 block">148 min • Ação Épica</span>
                <div class="flex flex-col gap-1 pt-1">
                  <button onclick="openSeatSelection('Gladiador 2', '22:00', 'Sala Laser 1', 48.00)" class="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-cine-sunsetOrange hover:text-white text-zinc-200 text-[11px] font-bold active:scale-[0.97]">
                    22:00 • R$ 48
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- GASTRONOMIA SOLAR NA POLTRONA (FOTOS REAIS DE ALTA QUALIDADE) -->
        <div class="rounded-3xl bg-[#1B1B3A] border-2 border-cine-sunsetAmber/30 p-6 sm:p-8 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full bg-cine-sunsetAmber/20 text-cine-sunsetGold text-[10px] font-black uppercase tracking-wider border border-cine-sunsetAmber/40">
                  Cozinha & Bar de Autor
                </span>
                <span class="text-xs text-zinc-400 font-mono">• Garçom entrega durante os trailers</span>
              </div>
              <h2 class="text-2xl font-black text-white font-bento tracking-tight mt-1">
                Gastronomia de Poltrona & Coquetelaria
              </h2>
            </div>
            <button onclick="openConcessionDrawer()" class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-cine-sunsetGold flex items-center gap-2 active:scale-[0.97]">
              <span>Ver Cardápio Completo (18 Itens)</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- 4 Real Food Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <!-- Food 1: Burger -->
            <div class="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-between group hover:border-cine-sunsetAmber/50 transition">
              <div class="h-40 overflow-hidden bg-zinc-950">
                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80" alt="Burger Angus" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
              </div>
              <div class="p-4 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-bold text-white">Smash Burger Angus</h3>
                  <span class="text-xs font-mono font-bold text-cine-sunsetGold whitespace-nowrap">R$ 44,00</span>
                </div>
                <p class="text-[11px] text-zinc-400 line-clamp-2">Pão brioche tostado, queijo cheddar inglês, cebola caramelizada e fritas rústicas.</p>
                <button onclick="addConcessionItem('Smash Burger Angus no Brioche', 44.00)" class="w-full py-2 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
                  + Adicionar ao Assento
                </button>
              </div>
            </div>

            <!-- Food 2: Pipoca Trufada -->
            <div class="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-between group hover:border-cine-sunsetAmber/50 transition">
              <div class="h-40 overflow-hidden bg-zinc-950">
                <img src="https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80" alt="Pipoca Trufada" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
              </div>
              <div class="p-4 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-bold text-white">Pipoca Trufada de Balde</h3>
                  <span class="text-xs font-mono font-bold text-cine-sunsetGold whitespace-nowrap">R$ 36,00</span>
                </div>
                <p class="text-[11px] text-zinc-400 line-clamp-2">Milho mushroom gigante, manteiga clarificada, azeite de trufas brancas e flor de sal.</p>
                <button onclick="addConcessionItem('Pipoca Trufada de Balde', 36.00)" class="w-full py-2 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
                  + Adicionar ao Assento
                </button>
              </div>
            </div>

            <!-- Food 3: Cocktail -->
            <div class="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-between group hover:border-cine-sunsetAmber/50 transition">
              <div class="h-40 overflow-hidden bg-zinc-950">
                <img src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80" alt="Sunset Cocktail" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
              </div>
              <div class="p-4 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-bold text-white">Sunset Tangerine Spritz</h3>
                  <span class="text-xs font-mono font-bold text-cine-sunsetGold whitespace-nowrap">R$ 38,00</span>
                </div>
                <p class="text-[11px] text-zinc-400 line-clamp-2">Gin botânico nacional, redução de tangerina fresca, espumante brut e ramo de alecrim.</p>
                <button onclick="addConcessionItem('Sunset Tangerine Spritz', 38.00)" class="w-full py-2 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
                  + Adicionar ao Assento
                </button>
              </div>
            </div>

            <!-- Food 4: Nachos Supreme -->
            <div class="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-between group hover:border-cine-sunsetAmber/50 transition">
              <div class="h-40 overflow-hidden bg-zinc-950">
                <img src="https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80" alt="Nachos Supreme" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
              </div>
              <div class="p-4 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-bold text-white">Nachos Dip de Queijo Quente</h3>
                  <span class="text-xs font-mono font-bold text-cine-sunsetGold whitespace-nowrap">R$ 34,00</span>
                </div>
                <p class="text-[11px] text-zinc-400 line-clamp-2">Tortilhas artesanais de milho crocantes com fondue de queijo cheddar picante e guacamole.</p>
                <button onclick="addConcessionItem('Nachos Dip de Queijo Quente', 34.00)" class="w-full py-2 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
                  + Adicionar ao Assento
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>


      <!-- ===================================================================== -->
      <!-- ARQUITETURA 2: EVERYMAN BOUTIQUE VELVET LOUNGE (LUXO HOSPITALIDADE)   -->
      <!-- Cores: #EE9CA6 (Rosa Blush), #212020 (Espresso), Serifas Nobres       -->
      <!-- ===================================================================== -->
      <div id="layout-everyman-velvet" class="space-y-10 hidden">
        
        <!-- Everyman Editorial Header Banner -->
        <div class="rounded-3xl bg-[#212020] border border-[#EE9CA6]/30 p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="space-y-4 max-w-xl text-left">
            <span class="text-xs font-serif italic text-cine-everymanRose tracking-widest uppercase block">
              Everyman Cinemas & Private Lounges
            </span>
            <h1 class="text-3xl sm:text-5xl font-serif text-white tracking-tight leading-tight">
              O Cinema Reencontra o Conforto dos Sofás de Veludo
            </h1>
            <p class="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
              Substituímos poltronas comuns por sofás aveludados para casais, mesinhas individuais de mármore e atendimento de sommelier com vinhos naturais e petiscos quentes entregues antes do início da projeção.
            </p>
            <div class="flex items-center gap-3 pt-2">
              <span class="text-xs text-zinc-400 font-serif italic">Salão Ativo:</span>
              <select class="px-3.5 py-2 rounded-xl bg-[#181616] border border-[#EE9CA6]/40 text-xs font-medium text-white focus:outline-none">
                <option>Everyman Jardins — Salão de Veludo Privé</option>
                <option>Everyman Leblon — Terraço e Rooftop</option>
                <option>Everyman Batel — Cinema Club</option>
              </select>
            </div>
          </div>

          <!-- Real Image of Luxury Cinema Salon -->
          <div class="w-full md:w-80 h-64 rounded-2xl overflow-hidden border-2 border-[#EE9CA6]/40 shadow-2xl flex-shrink-0">
            <img src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80" alt="Luxury Velvet Cinema Salon" class="w-full h-full object-cover">
          </div>
        </div>

        <!-- SESSÕES EM DESTAQUE COM RESERVA DE SOFÁ DUPLO -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <!-- Card 1: Interestelar -->
          <div class="rounded-3xl bg-[#212020] border border-[#EE9CA6]/30 p-6 flex flex-col sm:flex-row gap-5 shadow-xl">
            <div class="w-full sm:w-44 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-950 flex-shrink-0">
              <img src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" alt="Interestelar" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span class="text-xs font-serif italic text-cine-everymanRose block">Sessão das 19:30 • Película Analógica</span>
                <h3 class="text-2xl font-serif text-white">Interestelar</h3>
                <p class="text-xs text-zinc-300 font-sans mt-1 line-clamp-2">Exibição comemorativa com mesa de degustação e serviço de garçom silencioso.</p>
              </div>

              <!-- Sofa Pair Selector -->
              <div class="p-3 rounded-xl bg-[#181616] border border-[#EE9CA6]/20 flex items-center justify-between">
                <div>
                  <strong class="text-xs text-white block">Sofá de Veludo para Dois</strong>
                  <span class="text-[10px] text-zinc-400">Inclui 2 taças de vinho cortesia</span>
                </div>
                <span class="text-sm font-serif font-bold text-cine-everymanRose">R$ 98,00</span>
              </div>

              <div class="flex items-center justify-between pt-1">
                <button onclick="addConcessionItem('Vinho Tinto Pinot Noir (Taça)', 38.00)" class="text-xs font-serif italic text-cine-everymanRose hover:underline">
                  + Vinho Pinot Noir (R$ 38)
                </button>
                <button onclick="openSeatSelection('Interestelar (Everyman Lounge)', '19:30', 'Salão de Veludo Jardins', 49.00)" class="px-4 py-2 rounded-xl bg-cine-everymanRose text-[#212020] text-xs font-bold hover:bg-white transition active:scale-[0.97]">
                  Reservar Sofá
                </button>
              </div>
            </div>
          </div>

          <!-- Card 2: Pobres Criaturas -->
          <div class="rounded-3xl bg-[#212020] border border-[#EE9CA6]/30 p-6 flex flex-col sm:flex-row gap-5 shadow-xl">
            <div class="w-full sm:w-44 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-950 flex-shrink-0">
              <img src="https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg" alt="Pobres Criaturas" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span class="text-xs font-serif italic text-cine-everymanRose block">Sessão das 21:00 • Salão Champagne</span>
                <h3 class="text-2xl font-serif text-white">Pobres Criaturas</h3>
                <p class="text-xs text-zinc-300 font-sans mt-1 line-clamp-2">Comédia de época vencedora de 4 Oscars exibida em poltronas reclináveis de couro conhaque.</p>
              </div>

              <!-- Single Recliner Selector -->
              <div class="p-3 rounded-xl bg-[#181616] border border-[#EE9CA6]/20 flex items-center justify-between">
                <div>
                  <strong class="text-xs text-white block">Poltrona Individual Velvet King</strong>
                  <span class="text-[10px] text-zinc-400">Com abajur e descanso de pés</span>
                </div>
                <span class="text-sm font-serif font-bold text-cine-everymanRose">R$ 54,00</span>
              </div>

              <div class="flex items-center justify-between pt-1">
                <button onclick="addConcessionItem('Espresso Martini Signature', 42.00)" class="text-xs font-serif italic text-cine-everymanRose hover:underline">
                  + Espresso Martini (R$ 42)
                </button>
                <button onclick="openSeatSelection('Pobres Criaturas (Everyman Lounge)', '21:00', 'Salão Champagne', 54.00)" class="px-4 py-2 rounded-xl bg-cine-everymanRose text-[#212020] text-xs font-bold hover:bg-white transition active:scale-[0.97]">
                  Reservar Poltrona
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>


      <!-- ===================================================================== -->
      <!-- ARQUITETURA 3: ALAMO DRAFTHOUSE CINE-GAZETTE (MATRIZ HORÁRIA & DINE-IN) -->
      <!-- Cores: #F5B324 (Ouro Alamo), #090909 (Black OLED), Quinas 0px        -->
      <!-- ===================================================================== -->
      <div id="layout-alamo-drafthouse" class="space-y-8 hidden">
        
        <!-- Alamo Broadsheet Header -->
        <div class="border-b-4 border-cine-alamoGold pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 text-xs font-mono text-cine-alamoGold font-bold uppercase tracking-widest">
              <span>ALAMO DRAFTHOUSE CINEMA</span>
              <span>•</span>
              <span class="text-zinc-400">PROGRAMAÇÃO OFICIAL & DINE-IN SCRATCH KITCHEN</span>
            </div>
            <h1 class="text-3xl sm:text-5xl font-black text-white font-headline uppercase tracking-tight mt-1">
              GAZETA DE SESSÕES & COZINHA DE POLTRONA
            </h1>
          </div>
          <div class="text-right text-xs text-zinc-400 hidden sm:block">
            <span class="block text-cine-alamoGold font-black uppercase font-mono">CHAME O GARÇOM COM A BANDEIRA DE PAPEL</span>
            <span class="text-[11px]">Silêncio absoluto durante o filme</span>
          </div>
        </div>

        <!-- 50/50 Split Showcase -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#090909] border-2 border-cine-alamoGold p-6 rounded-none shadow-2xl">
          
          <!-- Movie Poster & Trivia -->
          <div class="lg:col-span-7 flex flex-col sm:flex-row gap-5">
            <div class="w-full sm:w-48 aspect-[2/3] bg-black border border-zinc-700 flex-shrink-0">
              <img src="https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" alt="Oppenheimer" class="w-full h-full object-cover">
            </div>
            <div class="space-y-3">
              <span class="px-2 py-0.5 bg-cine-alamoGold text-black font-black uppercase text-[10px] font-mono">
                SESSÃO ESPECIAL 70MM
              </span>
              <h2 class="text-2xl sm:text-3xl font-black text-white font-headline uppercase">
                OPPENHEIMER (PROJEÇÃO 70MM)
              </h2>
              <p class="text-xs text-zinc-300 font-mono leading-relaxed">
                Cópia rara em película de 70mm com som estéreo analógico. A história do cientista que liderou o Projeto Manhattan e mudou o curso da civilização.
              </p>
              <div class="p-3 bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
                <strong class="text-cine-alamoGold block">RECOMENDAÇÃO DO CHEF ALAMO:</strong>
                Burgers grelhados na brasa e chopps artesanais servidos diretamente no apoio da sua poltrona.
              </div>
            </div>
          </div>

          <!-- Quick Food Order Card -->
          <div class="lg:col-span-5 bg-zinc-950 border border-zinc-800 p-4 flex flex-col justify-between space-y-3">
            <span class="text-xs font-black uppercase tracking-wider text-cine-alamoGold font-mono block">
              🍺 Destaques da Cozinha Alamo:
            </span>
            <div class="space-y-2">
              <div class="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800">
                <span class="text-xs font-bold text-white font-mono">Royale with Cheese Burger (180g)</span>
                <span class="text-xs font-mono font-bold text-cine-alamoGold">R$ 48,00</span>
              </div>
              <div class="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800">
                <span class="text-xs font-bold text-white font-mono">Loaded Queso Dip & Tortilhas</span>
                <span class="text-xs font-mono font-bold text-cine-alamoGold">R$ 38,00</span>
              </div>
            </div>
            <button onclick="openSeatSelection('Oppenheimer (70mm Alamo)', '18:30', 'Sala 1 Película', 48.00)" class="w-full py-2.5 bg-cine-alamoGold text-black font-black uppercase text-xs font-mono hover:bg-white transition active:scale-[0.97]">
              COMPRAR INGRESSO SESSÃO 18:30
            </button>
          </div>
        </div>

        <!-- HORIZONTAL SCHEDULE MATRIX TABLE (ALAMO EXCLUSIVE) -->
        <div class="space-y-3">
          <h3 class="text-lg font-black uppercase text-white font-headline tracking-wide flex items-center gap-2">
            <i data-lucide="calendar" class="w-4 h-4 text-cine-alamoGold"></i> Tabela Matriz de Horários por Sala
          </h3>

          <div class="overflow-x-auto border-2 border-zinc-800 bg-[#090909]">
            <table class="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr class="bg-zinc-900 border-b-2 border-zinc-700 text-zinc-300 uppercase tracking-wider text-[11px]">
                  <th class="p-3 w-1/3">Filme em Cartaz</th>
                  <th class="p-3 w-1/5">Sala 1 (Dine-In Garçom)</th>
                  <th class="p-3 w-1/5">Sala 2 (Película 35mm)</th>
                  <th class="p-3 w-1/5">Sala 3 (70mm Master)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800">
                <tr class="hover:bg-zinc-900/60 transition">
                  <td class="p-3">
                    <strong class="text-white text-sm block font-headline">DUNA: PARTE 2</strong>
                    <span class="text-zinc-500 text-[10px]">166 min • 14 anos</span>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Duna: Parte 2', '16:00', 'Sala 1 Dine-In', 44.00)" class="px-2.5 py-1 bg-zinc-800 hover:bg-cine-alamoGold hover:text-black text-white font-bold transition active:scale-[0.97]">
                      16:00
                    </button>
                    <button onclick="openSeatSelection('Duna: Parte 2', '19:45', 'Sala 1 Dine-In', 48.00)" class="ml-1.5 px-2.5 py-1 bg-cine-alamoGold text-black font-black transition active:scale-[0.97]">
                      19:45 [Lotando]
                    </button>
                  </td>
                  <td class="p-3"><span class="text-zinc-600">—</span></td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Duna: Parte 2 (70mm)', '21:30', 'Sala 3 70mm', 52.00)" class="px-2.5 py-1 bg-zinc-800 hover:bg-cine-alamoGold hover:text-black text-white font-bold transition active:scale-[0.97]">
                      21:30
                    </button>
                  </td>
                </tr>
                <tr class="hover:bg-zinc-900/60 transition">
                  <td class="p-3">
                    <strong class="text-white text-sm block font-headline">INTERESTELAR</strong>
                    <span class="text-zinc-500 text-[10px]">169 min • 12 anos</span>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Interestelar', '15:00', 'Sala 1 Dine-In', 42.00)" class="px-2.5 py-1 bg-zinc-800 hover:bg-cine-alamoGold hover:text-black text-white font-bold transition active:scale-[0.97]">
                      15:00
                    </button>
                  </td>
                  <td class="p-3">
                    <button onclick="openSeatSelection('Interestelar (35mm)', '20:15', 'Sala 2 35mm', 46.00)" class="px-2.5 py-1 bg-cine-alamoGold text-black font-black transition active:scale-[0.97]">
                      20:15 [Destaque]
                    </button>
                  </td>
                  <td class="p-3"><span class="text-zinc-600">—</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>


      <!-- ===================================================================== -->
      <!-- ARQUITETURA 4: AMC THEATRES & CINEMARK STADIUM (RADAR FORMATOS & HUD) -->
      <!-- Cores: #CE0E2D (Vermelho AMC), #000000 (OLED), Stadium Pills 9999px   -->
      <!-- ===================================================================== -->
      <div id="layout-amc-cinemark" class="space-y-8 hidden">
        
        <!-- Format Radar Filter Bar -->
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="radio" class="w-3.5 h-3.5 text-cine-amcRed animate-pulse"></i> Radar de Formatos & Tecnologias Especiais
            </span>
            <span class="text-zinc-500">Selecione para filtrar salas com calibração acústica certificada</span>
          </div>

          <!-- Stadium Pills Filter -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            <button class="px-5 py-2 rounded-full bg-cine-amcRed text-white text-xs font-black uppercase tracking-wider shadow-lg active:scale-[0.97] whitespace-nowrap">
              ★ TODAS AS SALAS
            </button>
            <button class="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider active:scale-[0.97] whitespace-nowrap">
              IMAX COM LASER
            </button>
            <button class="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider active:scale-[0.97] whitespace-nowrap">
              DOLBY CINEMA 360°
            </button>
            <button class="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider active:scale-[0.97] whitespace-nowrap">
              CINEMARK XD
            </button>
            <button class="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider active:scale-[0.97] whitespace-nowrap">
              D-BOX POLTRONAS 4D
            </button>
          </div>
        </div>

        <!-- 21:9 Widescreen Panorama Hero with Technical HUD -->
        <div class="rounded-3xl bg-black border border-zinc-800 p-6 sm:p-10 relative overflow-hidden flex flex-col justify-end min-h-[400px] shadow-2xl">
          <img src="https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg" alt="Interestelar IMAX" class="absolute inset-0 w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>

          <div class="relative z-10 space-y-4 max-w-2xl">
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full bg-cine-amcRed text-white text-[11px] font-black uppercase tracking-wider">
                SALA DOLBY CINEMA N° 1
              </span>
              <span class="text-xs font-mono text-zinc-300">Laser Duplo 4K Christie • 128 Canais</span>
            </div>

            <h2 class="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              INTERESTELAR: EXPERIÊNCIA DOLBY
            </h2>

            <!-- Technical HUD Grid -->
            <div class="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-xs font-mono max-w-md">
              <div>
                <span class="text-zinc-500 block text-[10px]">TELA</span>
                <span class="text-white font-bold">24m Silver</span>
              </div>
              <div>
                <span class="text-zinc-500 block text-[10px]">ÁUDIO</span>
                <span class="text-white font-bold">Dolby Atmos</span>
              </div>
              <div>
                <span class="text-zinc-500 block text-[10px]">POLTRONA</span>
                <span class="text-white font-bold">Recliner VIP</span>
              </div>
            </div>

            <!-- Booking buttons -->
            <div class="pt-2 flex flex-wrap items-center gap-3">
              <button onclick="openSeatSelection('Interestelar (Dolby Cinema)', '19:15', 'Sala Dolby 1', 54.00)" class="px-6 py-3 rounded-full bg-cine-amcRed text-white text-xs font-black uppercase tracking-wider shadow-lg active:scale-[0.97]">
                COMPRAR INGRESSO • 19:15
              </button>
              <button onclick="openSeatSelection('Interestelar (Dolby Cinema)', '22:30', 'Sala Dolby 1', 50.00)" class="px-5 py-3 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider active:scale-[0.97]">
                22:30 (Legendado)
              </button>
            </div>
          </div>
        </div>

        <!-- AMC Snack & Sip Express 1-Click -->
        <div class="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-white uppercase font-mono tracking-wider">
                🍿 Snack Bar Express (Cinemark / AMC)
              </h3>
              <p class="text-xs text-zinc-400">Compre no app e retire no armário térmico express sem filas com QR Code.</p>
            </div>
            <button onclick="openConcessionDrawer()" class="text-xs text-cine-amcRed font-mono font-bold hover:underline">
              Ver Todos os Combos →
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <strong class="text-xs text-white block">Combo Mega Pipoca + 2 Refis</strong>
                <span class="text-[11px] text-zinc-400">Balde gigante refil ilimitado</span>
              </div>
              <button onclick="addConcessionItem('Combo Mega Pipoca + 2 Refis', 49.90)" class="px-3.5 py-1.5 rounded-full bg-cine-amcRed text-white text-xs font-black active:scale-[0.97]">
                R$ 49,90 +
              </button>
            </div>

            <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <strong class="text-xs text-white block">Kit Doce Cinema</strong>
                <span class="text-[11px] text-zinc-400">Pipoca Doce Caramelo + M&M 120g</span>
              </div>
              <button onclick="addConcessionItem('Kit Doce Cinema', 38.50)" class="px-3.5 py-1.5 rounded-full bg-cine-amcRed text-white text-xs font-black active:scale-[0.97]">
                R$ 38,50 +
              </button>
            </div>

            <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <strong class="text-xs text-white block">Nachos Supreme Cheddar</strong>
                <span class="text-[11px] text-zinc-400">Cheddar quente cremoso e jalapeño</span>
              </div>
              <button onclick="addConcessionItem('Nachos Supreme Cheddar', 34.00)" class="px-3.5 py-1.5 rounded-full bg-cine-amcRed text-white text-xs font-black active:scale-[0.97]">
                R$ 34,00 +
              </button>
            </div>
          </div>
        </div>

      </div>

    </section>

    <!-- ============================================== -->
    <!-- VIEW 2: MAPA DE POLTRONAS DA SALA              -->
    <!-- ============================================== -->
    <section id="view-seats" class="hidden space-y-6">
      
      <!-- Back Navigation Bar -->
      <div class="flex items-center justify-between pb-4 border-b border-zinc-800">
        <button onclick="switchView('catalog')" class="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-2 active:scale-[0.97]">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar à Programação
        </button>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <span id="active-movie" class="text-base font-bold text-white block">Duna: Parte 2</span>
            <span id="active-details" class="text-xs text-zinc-400">Hoje às 19:30 • Sala Laser 1</span>
          </div>
          <div class="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 font-mono text-xs font-bold text-cine-sunsetGold">
            ⏱ <span id="seat-timer" class="tabular-nums">10:00</span>
          </div>
        </div>
      </div>

      <!-- Ticket Type Adjuster -->
      <div class="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold text-zinc-200 uppercase tracking-wider block">Modalidades de Ingresso</span>
          <span class="text-[11px] text-zinc-400">Selecione o tipo de ingresso para cada assento selecionado</span>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Inteira -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-xs font-bold text-white">Inteira:</span>
            <span id="label-price-inteira" class="text-xs font-mono text-cine-sunsetGold font-bold">R$ 48,00</span>
            <div class="flex items-center gap-1 ml-2">
              <button onclick="adjustTicketType('inteira', -1)" class="w-6 h-6 rounded bg-zinc-800 text-white font-bold text-xs">-</button>
              <span id="count-inteira" class="w-5 text-center font-bold text-xs tabular-nums">0</span>
              <button onclick="adjustTicketType('inteira', 1)" class="w-6 h-6 rounded bg-zinc-800 text-white font-bold text-xs">+</button>
            </div>
          </div>

          <!-- Meia Entrada -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-xs font-bold text-white">Meia:</span>
            <span id="label-price-meia" class="text-xs font-mono text-emerald-400 font-bold">R$ 24,00</span>
            <div class="flex items-center gap-1 ml-2">
              <button onclick="adjustTicketType('meia', -1)" class="w-6 h-6 rounded bg-zinc-800 text-white font-bold text-xs">-</button>
              <span id="count-meia" class="w-5 text-center font-bold text-xs tabular-nums">0</span>
              <button onclick="adjustTicketType('meia', 1)" class="w-6 h-6 rounded bg-zinc-800 text-white font-bold text-xs">+</button>
            </div>
          </div>

          <!-- Clube CineFood -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-xs font-bold text-white">Clube (30% off):</span>
            <span id="label-price-clube" class="text-xs font-mono text-blue-400 font-bold">R$ 33,60</span>
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
        
        <!-- Screen indicator -->
        <div class="w-full max-w-lg space-y-2 text-center">
          <div class="h-2.5 w-full rounded-full bg-gradient-to-r from-transparent via-cine-sunsetAmber to-transparent shadow-lg shadow-cine-sunsetAmber/50"></div>
          <span class="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">TELA CURVA DE ALTA DEFINIÇÃO</span>
        </div>

        <!-- Seats Grid -->
        <div id="grid-seats" role="grid" aria-label="Mapa de Assentos" class="flex flex-col gap-3 min-w-[500px]">
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
            <div class="w-4 h-4 rounded bg-blue-600/30 border border-blue-400"></div>
            <span>Acessível PCD</span>
          </div>
        </div>
      </div>

      <!-- Bottom Selection Bar -->
      <div class="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-2xl">
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

          <button id="btn-proceed" onclick="openConcessionDrawer()" disabled class="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-not-allowed">
            <span>Adicionar Gastronomia</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

    </section>

  </main>

  <!-- ============================================== -->
  <!-- CONCESSION DRAWER WITH REAL GASTRONOMY PHOTOS  -->
  <!-- ============================================== -->
  <div id="drawer-concession" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center hidden">
    <div class="w-full max-w-2xl max-h-[85vh] bg-[#12100D] border-t-2 border-cine-sunsetAmber/40 rounded-t-3xl p-6 flex flex-col space-y-6 overflow-hidden shadow-2xl">
      
      <!-- Drawer Header -->
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cine-sunsetAmber/20 flex items-center justify-center">
            <i data-lucide="utensils" class="w-5 h-5 text-cine-sunsetGold"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Cardápio de Alta Gastronomia</h3>
            <span class="text-xs text-zinc-400">Servido diretamente na sua poltrona durante os trailers</span>
          </div>
        </div>
        <button onclick="closeConcessionDrawer()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300">
          ✕
        </button>
      </div>

      <!-- Drawer Food Items with Real Photos -->
      <div class="flex-1 overflow-y-auto space-y-3 pr-1">
        
        <!-- Item 1: Burger -->
        <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
          <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=140&q=80" alt="Burger" class="w-16 h-16 rounded-xl object-cover flex-shrink-0">
          <div class="flex-1">
            <h4 class="text-sm font-bold text-white">Smash Burger Angus Trufado</h4>
            <p class="text-xs text-zinc-400">180g Angus, queijo gruyère, maionese trufada e batatas rústicas</p>
            <span class="text-xs font-mono font-bold text-cine-sunsetGold mt-1 block">R$ 48,00</span>
          </div>
          <button onclick="addConcessionItem('Smash Burger Angus Trufado', 48.00)" class="px-3.5 py-1.5 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
            + Adicionar
          </button>
        </div>

        <!-- Item 2: Pipoca -->
        <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
          <img src="https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=140&q=80" alt="Pipoca" class="w-16 h-16 rounded-xl object-cover flex-shrink-0">
          <div class="flex-1">
            <h4 class="text-sm font-bold text-white">Pipoca Trufada com Flor de Sal</h4>
            <p class="text-xs text-zinc-400">Balde grande com manteiga clarificada e queijo pecorino</p>
            <span class="text-xs font-mono font-bold text-cine-sunsetGold mt-1 block">R$ 36,00</span>
          </div>
          <button onclick="addConcessionItem('Pipoca Trufada Flor de Sal', 36.00)" class="px-3.5 py-1.5 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
            + Adicionar
          </button>
        </div>

        <!-- Item 3: Cocktail -->
        <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
          <img src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=140&q=80" alt="Cocktail" class="w-16 h-16 rounded-xl object-cover flex-shrink-0">
          <div class="flex-1">
            <h4 class="text-sm font-bold text-white">Sunset Tangerine Spritz 300ml</h4>
            <p class="text-xs text-zinc-400">Gin botânico, redução de tangerina, espumante e alecrim</p>
            <span class="text-xs font-mono font-bold text-cine-sunsetGold mt-1 block">R$ 38,00</span>
          </div>
          <button onclick="addConcessionItem('Sunset Tangerine Spritz', 38.00)" class="px-3.5 py-1.5 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
            + Adicionar
          </button>
        </div>

        <!-- Item 4: Nachos -->
        <div class="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
          <img src="https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=140&q=80" alt="Nachos" class="w-16 h-16 rounded-xl object-cover flex-shrink-0">
          <div class="flex-1">
            <h4 class="text-sm font-bold text-white">Nachos Supreme Dip de Cheddar</h4>
            <p class="text-xs text-zinc-400">Tortilhas quentes com fondue de cheddar cremoso e jalapeño</p>
            <span class="text-xs font-mono font-bold text-cine-sunsetGold mt-1 block">R$ 34,00</span>
          </div>
          <button onclick="addConcessionItem('Nachos Supreme Dip de Cheddar', 34.00)" class="px-3.5 py-1.5 rounded-xl bg-cine-sunsetOrange hover:bg-cine-sunsetAmber text-white text-xs font-bold active:scale-[0.97]">
            + Adicionar
          </button>
        </div>

      </div>

      <!-- Drawer Footer with Subtotal -->
      <div class="pt-4 border-t border-zinc-800 flex items-center justify-between gap-4">
        <div>
          <span class="text-xs text-zinc-400 font-mono block">Subtotal Gastronomia:</span>
          <span id="drawer-total" class="text-xl font-mono font-black text-cine-sunsetGold tabular-nums">R$ 0,00</span>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="closeConcessionDrawer()" class="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold active:scale-[0.97]">
            Continuar Navegando
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
  <!-- CHECKOUT MODAL                                 -->
  <!-- ============================================== -->
  <div id="modal-checkout" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 hidden">
    <div class="w-full max-w-md bg-[#12100D] border-2 border-cine-sunsetAmber/40 rounded-3xl p-6 space-y-6 shadow-2xl">
      
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <i data-lucide="shield-check" class="w-5 h-5 text-emerald-400"></i> Checkout do Ingresso & Pedido
        </h3>
        <button onclick="closeCheckoutModal()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300">
          ✕
        </button>
      </div>

      <!-- Breakdown -->
      <div class="space-y-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
        <div class="flex items-center justify-between text-zinc-400">
          <span>Ingressos:</span>
          <span id="checkout-tickets-subtotal" class="text-white font-bold tabular-nums">R$ 0,00</span>
        </div>
        <div class="flex items-center justify-between text-zinc-400">
          <span>Gastronomia de Poltrona:</span>
          <span id="checkout-concession-subtotal" class="text-cine-sunsetGold font-bold tabular-nums">R$ 0,00</span>
        </div>
        <div class="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm font-bold">
          <span class="text-white">TOTAL FINAL:</span>
          <span id="checkout-total-price" class="text-cine-sunsetAmber text-lg font-black tabular-nums">R$ 0,00</span>
        </div>
      </div>

      <!-- Payment selector -->
      <div class="space-y-2">
        <span class="text-xs font-bold text-zinc-400 block font-mono">Forma de Pagamento:</span>
        <div class="grid grid-cols-2 gap-2">
          <button class="py-2.5 rounded-xl bg-cine-sunsetOrange text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md">
            <i data-lucide="qr-code" class="w-4 h-4"></i> PIX Instantâneo
          </button>
          <button class="py-2.5 rounded-xl bg-zinc-900 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-800">
            <i data-lucide="credit-card" class="w-4 h-4"></i> Cartão / Apple Pay
          </button>
        </div>
      </div>

      <button onclick="confirmPaymentAndIssueTicket()" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-black uppercase tracking-wider shadow-lg active:scale-[0.97] flex items-center justify-center gap-2">
        <i data-lucide="lock" class="w-4 h-4"></i> Confirmar & Emitir Ingresso
      </button>
    </div>
  </div>

  <!-- ============================================== -->
  <!-- SONNER TOASTER CONTAINER                       -->
  <!-- ============================================== -->
  <div id="sonner-toaster" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"></div>

  <!-- ============================================== -->
  <!-- JAVASCRIPT LOGIC                               -->
  <!-- ============================================== -->
  <script>
    let currentArchetype = 'solar-sunset';
    let selectedSeats = new Set();
    let currentMovie = 'Duna: Parte 2';
    let currentTime = '19:30';
    let currentRoom = 'Sala Laser 1';
    let currentBasePrice = 48.00;
    let concessionTotal = 0.00;
    let concessionItems = [];
    let timerSec = 600;
    let timerInterval = null;

    let ticketCounts = { inteira: 0, meia: 0, clube: 0 };

    const DATES = [
      { day: 'SEX', num: '06', month: 'NOV' },
      { day: 'SÁB', num: '07', month: 'NOV' },
      { day: 'DOM', num: '08', month: 'NOV' },
      { day: 'SEG', num: '09', month: 'NOV' },
      { day: 'TER', num: '10', month: 'NOV' },
      { day: 'QUA', num: '11', month: 'NOV' },
      { day: 'QUI', num: '12', month: 'NOV' }
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
            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
        }`;
        btn.innerHTML = `
          <span class="text-[9px] font-bold uppercase tracking-wider">${d.day}</span>
          <span class="text-sm font-black leading-none">${d.num}</span>
          <span class="text-[8px] opacity-75">${d.month}</span>
        `;
        btn.onclick = () => {
          document.querySelectorAll('.date-pill').forEach(b => {
            b.className = 'date-pill flex-shrink-0 min-w-[62px] px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center transition active:scale-[0.97] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800';
          });
          btn.className = 'date-pill flex-shrink-0 min-w-[62px] px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center transition active:scale-[0.97] bg-gradient-to-br from-cine-sunsetOrange to-cine-sunsetAmber text-white font-bold border-cine-sunsetGold/50 shadow-md shadow-cine-sunsetOrange/30';
          toast.show(`Data alterada para ${d.day} ${d.num}/${d.month}`, { type: 'info' });
        };
        container.appendChild(btn);
      });
    }

    // Switch between the 4 complete cinema layouts
    function setArchetype(arch) {
      currentArchetype = arch;
      document.body.setAttribute('data-archetype', arch);
      localStorage.setItem('cinefood-archetype', arch);

      const lSunset = document.getElementById('layout-solar-sunset');
      const lEveryman = document.getElementById('layout-everyman-velvet');
      const lAlamo = document.getElementById('layout-alamo-drafthouse');
      const lAmc = document.getElementById('layout-amc-cinemark');

      if (lSunset) lSunset.classList.toggle('hidden', arch !== 'solar-sunset');
      if (lEveryman) lEveryman.classList.toggle('hidden', arch !== 'everyman-velvet');
      if (lAlamo) lAlamo.classList.toggle('hidden', arch !== 'alamo-drafthouse');
      if (lAmc) lAmc.classList.toggle('hidden', arch !== 'amc-cinemark');

      const btnSunset = document.getElementById('btn-arch-sunset');
      const btnEveryman = document.getElementById('btn-arch-everyman');
      const btnAlamo = document.getElementById('btn-arch-alamo');
      const btnAmc = document.getElementById('btn-arch-amc');

      [btnSunset, btnEveryman, btnAlamo, btnAmc].forEach(b => {
        if (!b) return;
        b.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white active:scale-[0.97]';
      });

      if (arch === 'solar-sunset' && btnSunset) {
        btnSunset.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white shadow-md active:scale-[0.97]';
        toast.show('Layout Ativo: 1. Solar Sunset (Bento Rail & Paleta Oficial)', { type: 'success' });
      } else if (arch === 'everyman-velvet' && btnEveryman) {
        btnEveryman.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-rose-300 text-black shadow-md active:scale-[0.97]';
        toast.show('Layout Ativo: 2. Everyman Velvet Lounge (Boutique Club & Sofás)', { type: 'info' });
      } else if (arch === 'alamo-drafthouse' && btnAlamo) {
        btnAlamo.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-amber-500 text-black shadow-md active:scale-[0.97]';
        toast.show('Layout Ativo: 3. Alamo Drafthouse Cine-Gazette (Quinas 0px & Tabela)', { type: 'info' });
      } else if (arch === 'amc-cinemark' && btnAmc) {
        btnAmc.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-red-600 text-white shadow-md active:scale-[0.97]';
        toast.show('Layout Ativo: 4. AMC & Cinemark Megaplex (Radar IMAX/Dolby/XD)', { type: 'info' });
      }

      if (window.lucide) lucide.createIcons();
    }

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

    function openSeatSelection(title, time, room, price) {
      currentMovie = title;
      currentTime = time;
      currentRoom = room;
      currentBasePrice = price;

      document.getElementById('active-movie').textContent = title;
      document.getElementById('active-details').textContent = `Hoje às ${time} • ${room}`;
      
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

        const lblL = document.createElement('span');
        lblL.className = 'w-5 text-center text-xs font-mono font-bold text-zinc-500';
        lblL.textContent = row;
        rowEl.appendChild(lblL);

        for (let col = 1; col <= COLS; col++) {
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
                  ? 'bg-zinc-900 border-cine-sunsetAmber/40 text-cine-sunsetGold hover:border-cine-sunsetGold'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
          }`;
          btn.textContent = col;
          btn.disabled = isOcc;

          btn.onclick = () => toggleSeat(seatId, btn);
          rowEl.appendChild(btn);
        }

        const lblR = document.createElement('span');
        lblR.className = 'w-5 text-center text-xs font-mono font-bold text-zinc-500';
        lblR.textContent = row;
        rowEl.appendChild(lblR);

        container.appendChild(rowEl);
      });
    }

    function toggleSeat(seatId, btn) {
      if (selectedSeats.has(seatId)) {
        selectedSeats.delete(seatId);
        btn.classList.remove('bg-cine-sunsetOrange', 'border-cine-sunsetGold', 'text-white', 'shadow-lg');
        btn.classList.add('bg-zinc-800', 'text-zinc-300');
        rebalanceTickets();
      } else {
        if (selectedSeats.size >= 8) {
          toast.show('Limite máximo de 8 poltronas atingido', { type: 'error' });
          return;
        }
        selectedSeats.add(seatId);
        btn.classList.remove('bg-zinc-800', 'text-zinc-300');
        btn.classList.add('bg-cine-sunsetOrange', 'border-cine-sunsetGold', 'text-white', 'shadow-lg');
        ticketCounts.inteira += 1;
        updateTicketCountLabels();
        toast.show(`Poltrona ${seatId} reservada`, { type: 'success' });
      }
      updateSummary();
    }

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
        proceedBtn.className = 'px-6 py-3 rounded-xl bg-gradient-to-r from-cine-sunsetOrange to-cine-sunsetAmber text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-[0.97]';
      }
    }

    function startTimer() {
      clearInterval(timerInterval);
      timerSec = 600;
      updateTimer();
      timerInterval = setInterval(() => {
        timerSec--;
        if (timerSec <= 0) {
          clearInterval(timerInterval);
          toast.show('Tempo de reserva expirou. As poltronas foram liberadas.', { type: 'error' });
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

    function openConcessionDrawer() {
      document.getElementById('drawer-concession').classList.remove('hidden');
      updateDrawerTotal();
      if (window.lucide) lucide.createIcons();
    }

    function closeConcessionDrawer() {
      document.getElementById('drawer-concession').classList.add('hidden');
    }

    function addConcessionItem(name, price) {
      concessionTotal += price;
      concessionItems.push({ name, price });
      updateDrawerTotal();
      updateSummary();

      const badge = document.getElementById('badge-cart-count');
      if (badge) {
        badge.textContent = concessionItems.length;
        badge.classList.remove('hidden');
      }

      toast.show(`+ ${name} (R$ ${price.toFixed(2).replace('.', ',')}) adicionado ao pedido!`, { type: 'success' });
    }

    function updateDrawerTotal() {
      document.getElementById('drawer-total').textContent = `R$ ${concessionTotal.toFixed(2).replace('.', ',')}`;
    }

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

    function confirmPaymentAndIssueTicket() {
      closeCheckoutModal();
      clearInterval(timerInterval);
      toast.show('🎉 Pagamento aprovado com sucesso!', { type: 'success' });
      setTimeout(() => {
        toast.show(`📱 Poltronas [${Array.from(selectedSeats).join(', ')}] confirmadas para ${currentMovie}!`, { type: 'info' });
        switchView('catalog');
      }, 1200);
    }

    const toast = {
      show: (message, options = {}) => {
        const toaster = document.getElementById('sonner-toaster');
        if (!toaster) return;

        const el = document.createElement('div');
        const type = options.type || 'info';
        
        let bgBorder = 'bg-zinc-900 border-zinc-700 text-white';
        let icon = 'info';
        if (type === 'success') {
          bgBorder = 'bg-zinc-950 border-emerald-500/60 text-white';
          icon = 'check-circle';
        } else if (type === 'error') {
          bgBorder = 'bg-zinc-950 border-red-500/60 text-white';
          icon = 'alert-triangle';
        }

        el.className = `p-3.5 rounded-2xl border ${bgBorder} shadow-2xl flex items-center gap-3 text-xs font-medium pointer-events-auto transition duration-300`;
        el.style.transform = 'translateY(10px) scale(0.95)';
        el.style.opacity = '0';

        el.innerHTML = `
          <i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0 ${type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : 'text-cine-sunsetAmber'}"></i>
          <span class="flex-1">${message}</span>
        `;

        toaster.appendChild(el);
        if (window.lucide) lucide.createIcons();

        requestAnimationFrame(() => {
          el.style.transform = 'translateY(0) scale(1)';
          el.style.opacity = '1';
        });

        setTimeout(() => {
          el.style.transform = 'translateY(10px) scale(0.95)';
          el.style.opacity = '0';
          setTimeout(() => el.remove(), 250);
        }, options.duration || 3200);
      }
    };

    function filterMovies(query) {
      const q = query.toLowerCase().trim();
      document.querySelectorAll('#layout-solar-sunset .grid > div').forEach(card => {
        const title = card.querySelector('h3');
        if (title) {
          const match = title.textContent.toLowerCase().includes(q);
          card.style.display = match ? 'flex' : 'none';
        }
      });
    }

    document.addEventListener('DOMContentLoaded', () => {
      initDateStrip();
      const savedArch = localStorage.getItem('cinefood-archetype') || 'solar-sunset';
      setArchetype(savedArch);
      if (window.lucide) lucide.createIcons();
    });
  </script>
</body>
</html>"""

output_path = 'cinefood/docs/prototipo/index.html'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"Generated world-class prototype at {output_path} ({len(html_content)} bytes)")
