# -*- coding: utf-8 -*-
"""
Script to inject 4 radically distinct, non-cliché architectural layouts into cinefood/docs/prototipo/index.html:

1. 🏛️ Boutique Gold: "L'Éditeur & Playbill"
   - Multi-column editorial print broadsheet (A24 / Criterion / Cahiers du Cinéma).
   - Critical essay, director colophon, vintage tear-off ticket stubs, luxury restaurant menu card with dotted lines.

2. ⚡ Cyber IMAX: "Mission Control: Room-First Matrix"
   - Terminal radar split-screen (CGV Starium / Airport flight command).
   - Architectural CAD blueprints of theater rooms with live seat heatmaps and flight departure timeline board.

3. 🎬 Cinéphile Minimal: "Fullscreen Cinema Canvas & Coverflow"
   - Immersive horizontal coverflow deck (Apple TV+ / MUBI).
   - Zero vertical scroll fatigue, floating frosted-glass dock, instant session pills and inline food drawer.

4. 🌅 Solar Sunset: "Asymmetric Sunset Bento Grid"
   - Strict palette: #FF4D00, #FF9F1C, #FFD166, #1B1B3A, #0B0B12.
   - Modern 12-column asymmetric Bento Box with Neon Marquee, Golden Hour countdown ring, 35mm film reel strip and boarding-pass stub.

Emil Kowalski craft skills enforced across all 4 layouts:
- Sonner toasts
- active:scale-[0.97]
- -webkit-tap-highlight-color: transparent
- touch-action: manipulation
- tabular-nums
- max-w-[65ch]
- custom easing cubic-bezier(0.23, 1, 0.32, 1)
"""

import os
import re

# =========================================================================
# LAYOUT 1: L'ÉDITEUR & PLAYBILL (EDITORIAL BROADSHEET)
# =========================================================================
LAYOUT_BOUTIQUE_GOLD = """
      <!-- ==================================================== -->
      <!-- ARQUÉTIPO 1: L'ÉDITEUR & PLAYBILL (REVISTA EDITORIAL & GUIA CRÍTICO) -->
      <!-- ==================================================== -->
      <div id="layout-boutique-gold" class="space-y-10">

        <!-- Broadsheet Header Banner -->
        <div class="border-b-2 border-amber-500/40 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 text-xs font-serif text-amber-400">
              <span class="uppercase tracking-widest font-black">CINEFOOD SALON D'OR</span>
              <span>•</span>
              <span class="italic text-zinc-400">CADERNO DE CRÍTICA & PROGRAMAÇÃO Nº 42</span>
              <span>•</span>
              <span class="text-zinc-500 font-mono">ED. NOVEMBRO 2026</span>
            </div>
            <h1 class="text-3xl sm:text-5xl font-black text-amber-100 font-luxury tracking-tight mt-1">
              Gazeta Cinematográfica & Guia de Salão
            </h1>
          </div>
          <div class="text-right font-serif text-xs text-zinc-400 hidden sm:block">
            <span class="block text-amber-300 font-bold">Salas de Veludo & Alta Cozinha</span>
            <span>Serviço silencioso à poltrona durante a projeção</span>
          </div>
        </div>

        <!-- 3-Column Asymmetric Print Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <!-- COLUMN 1 (3 cols): O ENSAIO CRÍTICO & COLOFÃO TÉCNICO -->
          <div class="lg:col-span-3 space-y-6 lg:border-r border-amber-900/40 lg:pr-6">
            
            <div class="space-y-3">
              <span class="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-black block">ENSAIO DO CURADOR</span>
              <h2 class="text-lg font-serif font-black text-white leading-tight">
                «O retorno do épico analógico como liturgia coletiva»
              </h2>
              <p class="text-xs text-zinc-300 leading-relaxed font-serif italic text-justify">
                Dez anos após sua estreia, Interestelar transcende a ficção científica para se consolidar como uma meditação sobre a mortalidade e o amor. Em película 70mm, a granulação da luz confere uma organicidade que o cinema digital jamais alcançou.
              </p>
              <div class="text-[11px] text-amber-300/90 font-serif pt-1">
                — Mateus Valente, <span class="text-zinc-400">Curador-Chefe CineFood</span>
              </div>
            </div>

            <!-- Colofão Técnico (Book Colophon Style) -->
            <div class="p-4 rounded-xl bg-[#181410] border border-amber-500/25 space-y-2 font-mono text-[11px]">
              <span class="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-serif">COLOFÃO DA CÓPIA:</span>
              <div class="flex justify-between text-zinc-400 border-b border-zinc-800 pb-1">
                <span>Bitola de Projeção</span>
                <span class="text-amber-200 font-bold">70mm 5-Perf</span>
              </div>
              <div class="flex justify-between text-zinc-400 border-b border-zinc-800 pb-1">
                <span>Formato de Tela</span>
                <span class="text-amber-200 font-bold">1.43:1 Expandido</span>
              </div>
              <div class="flex justify-between text-zinc-400 border-b border-zinc-800 pb-1">
                <span>Calibração Sonora</span>
                <span class="text-amber-200 font-bold">Dolby Atmos 7.1</span>
              </div>
              <div class="flex justify-between text-zinc-400">
                <span>Trilha Sonora</span>
                <span class="text-amber-200 font-bold">Hans Zimmer (Órgão)</span>
              </div>
            </div>

            <!-- Sommelier Wax Seal Callout -->
            <div class="p-4 rounded-xl bg-gradient-to-br from-[#251B12] to-[#16120D] border border-amber-600/30 space-y-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-serif font-black">🍷</span>
                <span class="font-serif font-bold text-amber-200 text-xs">Adegas do Salão:</span>
              </div>
              <p class="text-[11px] text-zinc-300 font-serif leading-relaxed">
                Harmonização recomendada: <strong>Pinot Noir Reserva</strong> mantido a 16°C em taça antivibração, servido junto aos mini brioches trufados.
              </p>
            </div>

          </div>

          <!-- COLUMN 2 (5 cols): O PALCO, CARTAZ EMOLDURADO & TALÕES RETRÔ -->
          <div class="lg:col-span-5 space-y-6">
            
            <!-- Framed Velvet Poster -->
            <div class="relative rounded-2xl overflow-hidden p-2 bg-gradient-to-b from-[#2A2016] via-[#17130F] to-black ring-1 ring-amber-500/40 shadow-2xl">
              <div class="aspect-[2/3] rounded-xl overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" alt="Interestelar" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div class="absolute bottom-4 left-4 right-4 text-white">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded bg-amber-500 text-black font-serif text-[10px] font-black uppercase">Obra Principal</span>
                    <span class="text-xs text-amber-300 font-serif font-bold">★ 5 Estrelas no Salão</span>
                  </div>
                  <h2 class="text-2xl font-black font-serif text-amber-50">Interestelar: Edição Especial 10 Anos</h2>
                  <p class="text-xs text-zinc-300 font-serif italic mt-0.5">Dir. Christopher Nolan • 169 minutos de projeção</p>
                </div>
              </div>
            </div>

            <!-- VINTAGE TEAR-OFF TICKET STUBS (TALÕES DE INGRESSO DESTACÁVEIS) -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-serif font-bold text-amber-300 uppercase tracking-wider">
                  Talões de Ingresso Disponíveis Hoje:
                </span>
                <span class="text-[10px] text-zinc-500 font-mono">Clique para destacar & reservar</span>
              </div>

              <!-- Ticket Stub 1: Matinê -->
              <div onclick="openSeatSelection('Interestelar', '16:30', 'Salão Boutique 01', 42.00)" class="cursor-pointer p-4 rounded-xl bg-[#1A1612] hover:bg-[#251E17] border border-amber-500/30 flex items-center justify-between gap-4 transition active:scale-[0.97] group border-dashed">
                <div class="space-y-0.5">
                  <span class="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">TALÃO DE SALÃO // MATINÊ</span>
                  <div class="text-base font-serif font-black text-amber-200 group-hover:text-amber-400">16:30 • Poltrona Individual Prime</div>
                  <div class="text-[11px] text-zinc-400 font-serif">Sala 01 com abajur bistrô individual</div>
                </div>
                <div class="text-right shrink-0 border-l border-amber-900/40 pl-4 font-mono">
                  <span class="text-sm font-black text-amber-400 block tabular-nums">R$ 42,00</span>
                  <span class="text-[9px] text-zinc-500 uppercase">Destacar ➔</span>
                </div>
              </div>

              <!-- Ticket Stub 2: Gala (Featured) -->
              <div onclick="openSeatSelection('Interestelar', '19:30', 'Salão Boutique 01', 48.00)" class="cursor-pointer p-4 rounded-xl bg-gradient-to-r from-amber-600/90 to-amber-700/90 hover:from-amber-500 hover:to-amber-600 text-black flex items-center justify-between gap-4 transition active:scale-[0.97] shadow-xl shadow-amber-600/25 ring-2 ring-amber-300 border-dashed">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-[9px] font-black bg-black text-amber-300 px-1.5 py-0.5 rounded uppercase">SESSÃO DE GALA</span>
                    <span class="text-[10px] font-bold text-black uppercase tracking-wider">Recomendada</span>
                  </div>
                  <div class="text-base font-serif font-black text-black">19:30 • Sofá Namoradeira c/ Welcome Drink</div>
                  <div class="text-[11px] text-black/80 font-serif font-medium">Sofá duplo de veludo + Taça de espumante</div>
                </div>
                <div class="text-right shrink-0 border-l border-black/30 pl-4 font-mono">
                  <span class="text-base font-black text-black block tabular-nums">R$ 48,00</span>
                  <span class="text-[9px] text-black font-extrabold uppercase">Reservar ★</span>
                </div>
              </div>

              <!-- Ticket Stub 3: Sessão Noturna -->
              <div onclick="openSeatSelection('Interestelar', '22:15', 'Salão Boutique 01', 42.00)" class="cursor-pointer p-4 rounded-xl bg-[#1A1612] hover:bg-[#251E17] border border-amber-500/30 flex items-center justify-between gap-4 transition active:scale-[0.97] group border-dashed">
                <div class="space-y-0.5">
                  <span class="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">TALÃO DE SALÃO // NOTURNO</span>
                  <div class="text-base font-serif font-black text-amber-200 group-hover:text-amber-400">22:15 • Lounge Veludo Silencioso</div>
                  <div class="text-[11px] text-zinc-400 font-serif">Sessão intimista com serviço de vinhos</div>
                </div>
                <div class="text-right shrink-0 border-l border-amber-900/40 pl-4 font-mono">
                  <span class="text-sm font-black text-amber-400 block tabular-nums">R$ 42,00</span>
                  <span class="text-[9px] text-zinc-500 uppercase">Destacar ➔</span>
                </div>
              </div>

            </div>

          </div>

          <!-- COLUMN 3 (4 cols): O MENU DEGUSTAÇÃO & PRATOS DO CHEF -->
          <div class="lg:col-span-4 space-y-6 lg:border-l border-amber-900/40 lg:pl-6">
            
            <div class="p-5 rounded-2xl bg-[#17130F] border border-amber-500/30 space-y-4">
              <div class="border-b border-amber-900/40 pb-3 text-center">
                <span class="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">CARTE DE VINS & GASTRONOMIE</span>
                <h3 class="text-xl font-serif font-black text-amber-100">Menu Degustação à Poltrona</h3>
                <p class="text-[11px] text-zinc-400 font-serif italic mt-0.5">Servido em cerâmica acústica sem ruído</p>
              </div>

              <div class="space-y-3 font-serif text-xs">
                
                <!-- Item 1 -->
                <div class="space-y-1">
                  <div class="flex items-baseline justify-between">
                    <span class="font-bold text-white text-sm">Duo Mini Smash Burgers</span>
                    <span class="font-mono font-bold text-amber-400 tabular-nums">R$ 38,00</span>
                  </div>
                  <p class="text-[11px] text-zinc-400 font-sans leading-relaxed">Brioche tostado, queijo cheddar inglês e maionese defumada.</p>
                  <button onclick="addConcessionItem('Duo Mini Smash Burgers', 38.00)" class="text-[11px] font-sans font-bold text-amber-400 hover:text-amber-300 transition active:scale-[0.97]">
                    + Incluir na Minha Poltrona
                  </button>
                </div>

                <div class="border-b border-zinc-800"></div>

                <!-- Item 2 -->
                <div class="space-y-1">
                  <div class="flex items-baseline justify-between">
                    <span class="font-bold text-white text-sm">Pipoca Trufada c/ Parmesão</span>
                    <span class="font-mono font-bold text-amber-400 tabular-nums">R$ 28,00</span>
                  </div>
                  <p class="text-[11px] text-zinc-400 font-sans leading-relaxed">Azeite de trufas brancas e lascas de Parmigiano Reggiano.</p>
                  <button onclick="addConcessionItem('Pipoca Trufada c/ Parmesão', 28.00)" class="text-[11px] font-sans font-bold text-amber-400 hover:text-amber-300 transition active:scale-[0.97]">
                    + Incluir na Minha Poltrona
                  </button>
                </div>

                <div class="border-b border-zinc-800"></div>

                <!-- Item 3 -->
                <div class="space-y-1">
                  <div class="flex items-baseline justify-between">
                    <span class="font-bold text-white text-sm">Taça Pinot Noir Gran Reserva</span>
                    <span class="font-mono font-bold text-amber-400 tabular-nums">R$ 36,00</span>
                  </div>
                  <p class="text-[11px] text-zinc-400 font-sans leading-relaxed">Vinho fino aromático servido em taça antivibração.</p>
                  <button onclick="addConcessionItem('Taça Pinot Noir Reserva', 36.00)" class="text-[11px] font-sans font-bold text-amber-400 hover:text-amber-300 transition active:scale-[0.97]">
                    + Incluir na Minha Poltrona
                  </button>
                </div>

                <div class="border-b border-zinc-800"></div>

                <!-- Item 4 -->
                <div class="space-y-1">
                  <div class="flex items-baseline justify-between">
                    <span class="font-bold text-white text-sm">Pipoca Ninho & Nutella Quente</span>
                    <span class="font-mono font-bold text-amber-400 tabular-nums">R$ 29,00</span>
                  </div>
                  <p class="text-[11px] text-zinc-400 font-sans leading-relaxed">Pipoca artesanal caramelizada com pó de leite ninho nobre.</p>
                  <button onclick="addConcessionItem('Pipoca Ninho & Nutella', 29.00)" class="text-[11px] font-sans font-bold text-amber-400 hover:text-amber-300 transition active:scale-[0.97]">
                    + Incluir na Minha Poltrona
                  </button>
                </div>

              </div>

              <div class="pt-2">
                <button onclick="openConcessionDrawer()" class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-serif font-black text-xs transition active:scale-[0.97] shadow-md">
                  Consultar Cardápio de Salão Completo
                </button>
              </div>
            </div>

            <!-- Outras Obras em Cartaz no Salão -->
            <div class="space-y-3">
              <span class="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">OUTRAS OBRAS NO REPERTÓRIO:</span>
              
              <div onclick="openSeatSelection('Duna: Parte 2', '19:45', 'Salão Boutique 02', 46.00)" class="p-3 rounded-xl bg-[#1A1612] hover:bg-[#251E17] border border-amber-500/20 cursor-pointer transition active:scale-[0.97]">
                <div class="flex items-center justify-between">
                  <span class="font-serif font-bold text-white text-xs">Duna: Parte 2</span>
                  <span class="font-mono text-amber-400 text-xs">19:45 • R$ 46</span>
                </div>
                <span class="text-[10px] text-zinc-400 font-serif block">Dir. Denis Villeneuve • Salão 02</span>
              </div>

              <div onclick="openSeatSelection('Gladiador II', '20:45', 'Salão Boutique 01', 48.00)" class="p-3 rounded-xl bg-[#1A1612] hover:bg-[#251E17] border border-amber-500/20 cursor-pointer transition active:scale-[0.97]">
                <div class="flex items-center justify-between">
                  <span class="font-serif font-bold text-white text-xs">Gladiador II</span>
                  <span class="font-mono text-amber-400 text-xs">20:45 • R$ 48</span>
                </div>
                <span class="text-[10px] text-zinc-400 font-serif block">Dir. Ridley Scott • Salão 01</span>
              </div>
            </div>

          </div>

        </div>

      </div>
"""

# =========================================================================
# LAYOUT 2: MISSION CONTROL (ROOM-FIRST RADAR & DEPARTURE MATRIX)
# =========================================================================
LAYOUT_CYBER_IMAX = """
      <!-- ==================================================== -->
      <!-- ARQUÉTIPO 2: MISSION CONTROL (RADAR DE SALAS & PAINEL DE DISPARO) -->
      <!-- ==================================================== -->
      <div id="layout-cyber-imax" class="space-y-8 hidden">

        <!-- TOP MISSION CONTROL TELEMETRY BAR -->
        <div class="p-3.5 rounded-2xl bg-[#0B1120] border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-[0_0_30px_rgba(0,240,255,0.1)]">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1.5 text-cyan-400 font-black">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              RADAR OPERACIONAL CINEFOOD // HUD v4.5
            </span>
            <span class="text-zinc-600">|</span>
            <span class="text-zinc-400 hidden sm:inline">STATUS DO SISTEMA:</span>
            <span class="text-emerald-400 font-bold hidden sm:inline">PROJEÇÃO LASER DUAL OK</span>
          </div>

          <div class="flex items-center gap-3">
            <span class="px-2.5 py-0.5 rounded bg-black/60 border border-cyan-500/30 text-cyan-300 tabular-nums">
              PRESSÃO SONORA: 104.8 dB
            </span>
            <span class="px-2.5 py-0.5 rounded bg-black/60 border border-cyan-500/30 text-zinc-300 tabular-nums">
              CLIMA DA SALA: 20.2°C
            </span>
            <span class="px-2.5 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 font-bold tabular-nums">
              PRÓXIMO DISPARO: 14m 32s
            </span>
          </div>
        </div>

        <!-- SPLIT RADAR WORKSTATION: LEFT = ROOM BLUEPRINTS, RIGHT = TIMELINE DEPARTURE -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <!-- LEFT PANE (5 cols): ARCHITECTURAL ROOM BLUEPRINTS WITH HEATMAPS -->
          <div class="lg:col-span-5 space-y-4">
            <div class="flex items-center justify-between border-b border-cyan-900/40 pb-2">
              <span class="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i> PLANTA-BAIXA DAS SALAS (HEATMAP AO VIVO)
              </span>
            </div>

            <!-- Room Blueprint 1: Sala 01 IMAX GT -->
            <div class="p-4 rounded-2xl bg-[#090E1A] border-2 border-cyan-500/50 space-y-3 relative overflow-hidden shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black border border-cyan-500/40">SALA 01</span>
                  <span class="font-mono text-xs font-black text-white ml-2">IMAX DUAL LASER GT</span>
                </div>
                <span class="font-mono text-xs text-red-400 font-black animate-pulse">84% LOTADA</span>
              </div>

              <!-- Visual Heatmap Simulation of Screen & Seats -->
              <div class="p-3 rounded-xl bg-black/70 border border-zinc-800 space-y-2">
                <div class="h-1.5 w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-sm shadow-cyan-400"></div>
                <span class="text-[9px] font-mono text-zinc-500 text-center block uppercase tracking-widest">TELA GIGANTE 28 METROS</span>
                
                <!-- Dot matrix seat occupancy -->
                <div class="grid grid-cols-12 gap-1 pt-1">
                  <!-- Row dots -->
                  <div class="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-cyan-400"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-cyan-400"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-cyan-400"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-cyan-400"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
                  <div class="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
                </div>

                <div class="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1">
                  <span class="text-cyan-300 font-bold">🎯 Sweet Spot Acústico: Fileiras D & E</span>
                  <span class="text-red-400">Restam 6 assentos no centro</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-white font-bold">Interestelar: 10 Anos (70mm)</span>
                <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala 01 IMAX GT', 48.00)" class="px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-black hover:bg-cyan-300 transition active:scale-[0.97]">
                  Ver Assentos ➔
                </button>
              </div>
            </div>

            <!-- Room Blueprint 2: Sala 02 4DX -->
            <div class="p-4 rounded-2xl bg-[#090E1A] border border-fuchsia-500/30 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono text-[10px] font-black border border-fuchsia-500/40">SALA 02</span>
                  <span class="font-mono text-xs font-black text-white ml-2">4DX ULTRA & MOTION</span>
                </div>
                <span class="font-mono text-xs text-amber-400 font-bold">70% LOTADA</span>
              </div>
              <p class="text-xs text-zinc-400 font-mono">Poltronas pneumáticas sincronizadas • Vento, névoa e cheiros ambientais.</p>
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-white font-bold">Gladiador II (4DX)</span>
                <button onclick="openSeatSelection('Gladiador II', '20:30', 'Sala 02 4DX', 52.00)" class="px-3 py-1.5 rounded-lg bg-fuchsia-500 text-black font-black hover:bg-fuchsia-400 transition active:scale-[0.97]">
                  Ver Assentos ➔
                </button>
              </div>
            </div>

            <!-- Room Blueprint 3: Sala 03 Dolby Cinema -->
            <div class="p-4 rounded-2xl bg-[#090E1A] border border-blue-500/30 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-black border border-blue-500/40">SALA 03</span>
                  <span class="font-mono text-xs font-black text-white ml-2">DOLBY CINEMA & VISION</span>
                </div>
                <span class="font-mono text-xs text-emerald-400 font-bold">50% DISPONÍVEL</span>
              </div>
              <p class="text-xs text-zinc-400 font-mono">Contraste de 1.000.000:1 • Projeção Laser Dupla e Som 128 Canais.</p>
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-white font-bold">Duna: Parte 2 (Dolby Atmos)</span>
                <button onclick="openSeatSelection('Duna: Parte 2', '18:30', 'Sala 03 Dolby', 46.00)" class="px-3 py-1.5 rounded-lg bg-blue-500 text-black font-black hover:bg-blue-400 transition active:scale-[0.97]">
                  Ver Assentos ➔
                </button>
              </div>
            </div>

          </div>

          <!-- RIGHT PANE (7 cols): LIVE DEPARTURE MATRIX (AEROPORTO DE CINEMA) -->
          <div class="lg:col-span-7 space-y-4">
            
            <div class="flex items-center justify-between border-b border-cyan-900/40 pb-2">
              <span class="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i> QUADRO DE EMBARQUE & DISPARO DE SESSÕES
              </span>
              <span class="font-mono text-[11px] text-zinc-400">Clique em qualquer horário para comprar</span>
            </div>

            <!-- Departure Table -->
            <div class="space-y-2.5 font-mono">
              
              <!-- Flight Row 1 -->
              <div class="p-3.5 rounded-xl bg-[#0D1526] border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-black text-white tabular-nums px-2.5 py-1 rounded bg-black/60 border border-cyan-500/40">16:30</span>
                  <div>
                    <span class="text-xs font-bold text-cyan-300 block">Interestelar: 10 Anos</span>
                    <span class="text-[10px] text-zinc-400">Sala 01 IMAX GT • Áudio Original Legendado</span>
                  </div>
                </div>
                <div class="flex items-center gap-3 self-end sm:self-auto">
                  <span class="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">STATUS: PRONTA</span>
                  <button onclick="openSeatSelection('Interestelar', '16:30', 'Sala 01 IMAX GT', 46.00)" class="px-3 py-1 rounded bg-[#1A2640] hover:bg-cyan-400 hover:text-black text-xs font-bold transition active:scale-[0.97]">
                    R$ 46,00 ➔
                  </button>
                </div>
              </div>

              <!-- Flight Row 2 (Critical / Fast filling) -->
              <div class="p-3.5 rounded-xl bg-gradient-to-r from-red-950/40 to-[#0D1526] border border-red-500/50 hover:border-cyan-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-black text-red-300 tabular-nums px-2.5 py-1 rounded bg-black/80 border border-red-500/60">19:30</span>
                  <div>
                    <span class="text-xs font-black text-white block">Interestelar: Sessão Primária</span>
                    <span class="text-[10px] text-red-400 font-bold">Sala 01 IMAX GT • Restam 6 poltronas no centro</span>
                  </div>
                </div>
                <div class="flex items-center gap-3 self-end sm:self-auto">
                  <span class="text-[10px] text-red-300 font-bold bg-red-900/60 border border-red-500 px-2 py-0.5 rounded animate-pulse">ESGOTANDO</span>
                  <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala 01 IMAX GT', 48.00)" class="px-3.5 py-1 rounded bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-black hover:brightness-110 transition active:scale-[0.97] shadow-sm">
                    TURBO COMPRA R$ 48 ➔
                  </button>
                </div>
              </div>

              <!-- Flight Row 3 -->
              <div class="p-3.5 rounded-xl bg-[#0D1526] border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-black text-white tabular-nums px-2.5 py-1 rounded bg-black/60 border border-cyan-500/40">18:30</span>
                  <div>
                    <span class="text-xs font-bold text-blue-300 block">Duna: Parte 2</span>
                    <span class="text-[10px] text-zinc-400">Sala 03 Dolby Cinema • Projeção Laser Dupla</span>
                  </div>
                </div>
                <div class="flex items-center gap-3 self-end sm:self-auto">
                  <span class="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">DISPONÍVEL</span>
                  <button onclick="openSeatSelection('Duna: Parte 2', '18:30', 'Sala 03 Dolby', 46.00)" class="px-3 py-1 rounded bg-[#1A2640] hover:bg-cyan-400 hover:text-black text-xs font-bold transition active:scale-[0.97]">
                    R$ 46,00 ➔
                  </button>
                </div>
              </div>

              <!-- Flight Row 4 -->
              <div class="p-3.5 rounded-xl bg-[#0D1526] border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-black text-white tabular-nums px-2.5 py-1 rounded bg-black/60 border border-cyan-500/40">20:30</span>
                  <div>
                    <span class="text-xs font-bold text-fuchsia-300 block">Gladiador II</span>
                    <span class="text-[10px] text-zinc-400">Sala 02 4DX Motion • Imersão Física</span>
                  </div>
                </div>
                <div class="flex items-center gap-3 self-end sm:self-auto">
                  <span class="text-[10px] text-amber-400 font-bold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">75% OCUPADA</span>
                  <button onclick="openSeatSelection('Gladiador II', '20:30', 'Sala 02 4DX', 52.00)" class="px-3 py-1 rounded bg-[#1A2640] hover:bg-cyan-400 hover:text-black text-xs font-bold transition active:scale-[0.97]">
                    R$ 52,00 ➔
                  </button>
                </div>
              </div>

              <!-- Flight Row 5 -->
              <div class="p-3.5 rounded-xl bg-[#0D1526] border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-black text-white tabular-nums px-2.5 py-1 rounded bg-black/60 border border-cyan-500/40">22:45</span>
                  <div>
                    <span class="text-xs font-bold text-zinc-300 block">Interestelar (Corujão da Meia-Noite)</span>
                    <span class="text-[10px] text-zinc-400">Sala 01 IMAX GT • Sessão Noturna</span>
                  </div>
                </div>
                <div class="flex items-center gap-3 self-end sm:self-auto">
                  <span class="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">40% LIVRE</span>
                  <button onclick="openSeatSelection('Interestelar', '22:45', 'Sala 01 IMAX GT', 44.00)" class="px-3 py-1 rounded bg-[#1A2640] hover:bg-cyan-400 hover:text-black text-xs font-bold transition active:scale-[0.97]">
                    R$ 44,00 ➔
                  </button>
                </div>
              </div>

            </div>

            <!-- FAST CONCESSION COMMAND ROW -->
            <div class="p-4 rounded-xl bg-[#080E1C] border border-cyan-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <div class="text-xs font-mono">
                <span class="text-cyan-400 font-bold block">FAST CONCESSION EXPRESS:</span>
                <span class="text-zinc-400 text-[11px]">Vincule balde turbo ou nachos para entrega no seu assento</span>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="addConcessionItem('Balde Mega Laser Metálico', 42.00)" class="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-400 hover:text-black text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition active:scale-[0.97]">
                  + Balde Laser (R$ 42)
                </button>
                <button onclick="addConcessionItem('Cyber Nachos Quentes', 34.00)" class="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-400 hover:text-black text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition active:scale-[0.97]">
                  + Nachos (R$ 34)
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
"""

# =========================================================================
# LAYOUT 3: FULLSCREEN CINEMA CANVAS (COVERFLOW HORIZONTAL DECK)
# =========================================================================
LAYOUT_CINEPHILE_MINIMAL = """
      <!-- ==================================================== -->
      <!-- ARQUÉTIPO 3: FULLSCREEN CINEMA CANVAS (COVERFLOW HORIZONTAL DECK) -->
      <!-- ==================================================== -->
      <div id="layout-cinephile-minimal" class="space-y-6 hidden">

        <!-- IMMERSIVE HORIZONTAL FILM STAGE (COVERFLOW FEELING) -->
        <div class="relative w-full rounded-3xl overflow-hidden bg-[#101014] border border-zinc-800 p-6 lg:p-12 shadow-2xl min-h-[520px] flex flex-col justify-between">
          
          <!-- Background Ambient Photography with subtle blur -->
          <div class="absolute inset-0 bg-cover bg-center opacity-25 filter blur-xl scale-110 pointer-events-none" style="background-image: url('https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80');"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-[#101014] via-[#101014]/60 to-[#101014]/40 pointer-events-none"></div>

          <!-- Top Stage Curator Info -->
          <div class="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-full bg-[#00E054]"></span>
              <span class="font-mono text-xs text-white font-bold uppercase tracking-widest">
                MOSTRA DO CINEMA CONTEMPORÂNEO // LETTERBOXD SELECTION
              </span>
            </div>
            <div class="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <span>Projeção Calibrada DCI-P3</span>
              <span>•</span>
              <span class="text-[#00E054] font-bold">5 Títulos em Cartaz</span>
            </div>
          </div>

          <!-- The Horizontal Poster Carousel Deck -->
          <div class="relative z-10 my-6 flex items-center justify-center gap-4 sm:gap-8 overflow-x-auto py-4">
            
            <!-- Side Poster Left (Duna 2) -->
            <div onclick="openSeatSelection('Duna: Parte 2', '19:45', 'Sala 02 Studio', 44.00)" class="cursor-pointer hidden md:block w-36 aspect-[2/3] rounded-xl overflow-hidden opacity-50 hover:opacity-100 transition transform hover:scale-105 shrink-0 border border-white/10 shadow-lg">
              <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80" alt="Duna 2" class="w-full h-full object-cover">
            </div>

            <!-- CENTER FEATURED POSTER (Interestelar) -->
            <div class="w-48 sm:w-60 aspect-[2/3] rounded-2xl overflow-hidden shrink-0 border-2 border-[#00E054] shadow-2xl relative transform hover:scale-105 transition duration-300">
              <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80" alt="Interestelar" class="w-full h-full object-cover">
              <span class="absolute top-3 left-3 w-7 h-7 rounded bg-amber-500 text-black font-mono font-black text-xs flex items-center justify-center">12</span>
              <span class="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/85 text-[#00E054] font-mono font-black text-xs">★ 4.9</span>
            </div>

            <!-- Side Poster Right (Gladiador II) -->
            <div onclick="openSeatSelection('Gladiador II', '20:45', 'Sala 01 Studio', 44.00)" class="cursor-pointer hidden md:block w-36 aspect-[2/3] rounded-xl overflow-hidden opacity-50 hover:opacity-100 transition transform hover:scale-105 shrink-0 border border-white/10 shadow-lg">
              <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80" alt="Gladiador II" class="w-full h-full object-cover">
            </div>

            <!-- Side Poster Far Right (Coringa 2) -->
            <div onclick="openSeatSelection('Coringa: Delírio a Dois', '21:15', 'Sala 03 Studio', 38.00)" class="cursor-pointer hidden lg:block w-36 aspect-[2/3] rounded-xl overflow-hidden opacity-40 hover:opacity-100 transition transform hover:scale-105 shrink-0 border border-white/10 shadow-lg">
              <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80" alt="Coringa 2" class="w-full h-full object-cover">
            </div>

          </div>

          <!-- Featured Film Metadata & Synopsis directly in the canvas -->
          <div class="relative z-10 text-center max-w-2xl mx-auto space-y-2">
            <h2 class="text-3xl sm:text-4xl font-bold text-white uppercase tracking-tight font-sans">
              Interestelar (Edição Retrospectiva)
            </h2>
            <div class="flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-zinc-400">
              <span>Christopher Nolan</span>
              <span>•</span>
              <span class="tabular-nums">169 min</span>
              <span>•</span>
              <span>Som Dolby 7.1</span>
              <span>•</span>
              <span class="text-[#00E054] font-bold">★ 4.9 (520k avaliações)</span>
            </div>
            <p class="text-xs text-zinc-300 max-w-[65ch] mx-auto leading-relaxed">
              Diante do colapso ecológico da Terra, um piloto é convocado para atravessar um buraco de minhoca perto de Saturno em busca de um novo lar.
            </p>
          </div>

          <!-- FLOATING FROSTED-GLASS CONTROL DOCK (NA BASE DA TELA) -->
          <div class="relative z-10 mt-6 p-3 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/15 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
            <div class="flex items-center gap-1.5 font-mono text-xs">
              <span class="text-zinc-400 uppercase font-bold mr-1">Sessões:</span>
              <button onclick="openSeatSelection('Interestelar', '16:30', 'Sala 01 Studio', 38.00)" class="px-3 py-1.5 rounded-lg bg-[#242429] hover:bg-[#00E054] hover:text-black text-white font-bold transition active:scale-[0.97] tabular-nums">
                16:30 (LEG) • R$ 38
              </button>
              <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala 01 Studio', 42.00)" class="px-3.5 py-1.5 rounded-lg bg-[#00E054] hover:bg-emerald-400 text-black font-black transition active:scale-[0.97] tabular-nums shadow-sm">
                19:30 (VIP LEG) • R$ 42
              </button>
              <button onclick="openSeatSelection('Interestelar', '22:15', 'Sala 01 Studio', 38.00)" class="px-3 py-1.5 rounded-lg bg-[#242429] hover:bg-[#00E054] hover:text-black text-white font-bold transition active:scale-[0.97] tabular-nums">
                22:15 (LEG) • R$ 38
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button onclick="openConcessionDrawer()" class="px-3.5 py-1.5 rounded-lg bg-[#1F1F24] hover:bg-[#2A2A30] text-zinc-200 border border-white/10 text-xs font-mono font-bold transition active:scale-[0.97]">
                🍿 Bomboniere (+ Rápido)
              </button>
              <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala 01 Studio', 42.00)" class="px-4 py-1.5 rounded-lg bg-[#00E054] text-black text-xs font-mono font-black transition active:scale-[0.97] shadow-md">
                🛋️ Escolher Poltrona ➔
              </button>
            </div>
          </div>

        </div>

      </div>
"""

# =========================================================================
# LAYOUT 4: ASYMMETRIC SUNSET BENTO GRID (PALETA DO USUÁRIO)
# =========================================================================
LAYOUT_SOLAR_SUNSET = """
      <!-- ==================================================== -->
      <!-- ARQUÉTIPO 4: ASYMMETRIC SUNSET BENTO GRID -->
      <!-- Paleta Oficial: #FF4D00, #FF9F1C, #FFD166, #1B1B3A, #0B0B12 -->
      <!-- ==================================================== -->
      <div id="layout-solar-sunset" class="space-y-6 hidden">

        <!-- 12-COLUMN ASYMMETRIC BENTO GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <!-- BENTO TILE 1 (8 cols): RETRO NEON MARQUEE HERO -->
          <div class="lg:col-span-8 p-6 lg:p-8 rounded-3xl bg-[#1B1B3A] border-2 border-[#FF9F1C]/40 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-6">
            
            <!-- Neon Ambient Glow -->
            <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#FF4D00]/20 blur-3xl pointer-events-none"></div>

            <div class="space-y-3 relative z-10">
              <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span class="px-3 py-1 rounded-full bg-[#FF4D00] text-white font-black uppercase tracking-wider shadow-md">
                  ★ MARQUEE DA SEMANA
                </span>
                <span class="px-2.5 py-1 rounded bg-[#0B0B12] text-[#FFD166] border border-[#FF9F1C]/30 font-bold">
                  SALA SUNSET 01 DINE-IN
                </span>
                <span class="text-zinc-400">• 169 min • 70mm Laser</span>
              </div>

              <h1 class="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight font-sans">
                INTERESTELAR <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] via-[#FF9F1C] to-[#FFD166]">// 10 ANOS</span>
              </h1>

              <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans max-w-[65ch]">
                A consagração cósmica de Christopher Nolan com mesas bistrô privativas, coquetéis artesanais na poltrona e som imersivo de última geração.
              </p>
            </div>

            <!-- Instant Booking Bar inside Marquee -->
            <div class="relative z-10 p-4 rounded-2xl bg-[#0B0B12]/85 border border-[#FF9F1C]/30 flex flex-wrap items-center justify-between gap-4">
              <div class="space-y-0.5">
                <span class="text-[10px] font-mono text-[#FFD166] uppercase font-bold block">SESSÃO DOURADA (19:30):</span>
                <span class="text-xs text-white font-bold">Sofá Duplo com Welcome Drink Sunset</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-mono text-base font-black text-[#FFD166] tabular-nums">R$ 48,00</span>
                <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala Sunset 01', 48.00)" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#FF9F1C] hover:brightness-110 text-[#0B0B12] font-black text-xs transition active:scale-[0.97] shadow-lg shadow-[#FF4D00]/30">
                  RESERVAR AGORA ➔
                </button>
              </div>
            </div>

          </div>

          <!-- BENTO TILE 2 (4 cols): SUNSET BAR & CHEF'S KITCHEN -->
          <div class="lg:col-span-4 p-6 rounded-3xl bg-[#1B1B3A] border border-[#FF9F1C]/40 shadow-xl flex flex-col justify-between space-y-4">
            
            <div class="space-y-1">
              <span class="text-[10px] font-mono uppercase tracking-widest text-[#FF4D00] font-black block">GASTRONOMIA NA POLTRONA</span>
              <h3 class="text-xl font-black text-white font-sans uppercase">Sunset Bar & Kitchen</h3>
              <p class="text-xs text-zinc-300">Peça na poltrona sem levantar da sessão.</p>
            </div>

            <!-- Food Feature 1 -->
            <div class="p-3 rounded-2xl bg-[#0B0B12] border border-[#FF9F1C]/20 flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&q=80" alt="Burger" class="w-16 h-16 rounded-xl object-cover shrink-0">
              <div class="flex-1 min-w-0">
                <span class="text-xs font-bold text-white block truncate">Flame Smash Burger Duplo</span>
                <span class="text-xs font-mono font-black text-[#FFD166] tabular-nums">R$ 38,00</span>
              </div>
              <button onclick="addConcessionItem('Flame Smash Burger', 38.00)" class="px-2.5 py-1.5 rounded-lg bg-[#FF4D00] text-white text-xs font-bold transition active:scale-[0.97]">
                + Pedir
              </button>
            </div>

            <!-- Food Feature 2 -->
            <div class="p-3 rounded-2xl bg-[#0B0B12] border border-[#FF9F1C]/20 flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=150&q=80" alt="Spritz" class="w-16 h-16 rounded-xl object-cover shrink-0">
              <div class="flex-1 min-w-0">
                <span class="text-xs font-bold text-white block truncate">Sunset Spritz Cocktail</span>
                <span class="text-xs font-mono font-black text-[#FFD166] tabular-nums">R$ 32,00</span>
              </div>
              <button onclick="addConcessionItem('Sunset Spritz Cocktail', 32.00)" class="px-2.5 py-1.5 rounded-lg bg-[#FF4D00] text-white text-xs font-bold transition active:scale-[0.97]">
                + Pedir
              </button>
            </div>

            <button onclick="openConcessionDrawer()" class="w-full py-2 rounded-xl bg-[#0B0B12] hover:bg-black text-[#FFD166] border border-[#FF9F1C]/30 text-xs font-bold transition active:scale-[0.97]">
              Explorar Cardápio de Bebidas & Pratos ➔
            </button>

          </div>

          <!-- BENTO TILE 3 (4 cols): SUNSET GOLDEN HOUR CLOCK -->
          <div class="lg:col-span-4 p-6 rounded-3xl bg-[#1B1B3A] border border-[#FF9F1C]/30 shadow-xl flex flex-col justify-between space-y-4 text-center">
            <span class="text-[10px] font-mono uppercase tracking-widest text-[#FF9F1C] font-black">TEMPORIZADOR REGRESSIVO</span>
            
            <div class="py-2">
              <div class="w-28 h-28 mx-auto rounded-full border-4 border-[#FF4D00] flex flex-col items-center justify-center bg-[#0B0B12] shadow-lg shadow-[#FF4D00]/20">
                <span class="font-mono text-xl font-black text-white tabular-nums">14:32</span>
                <span class="text-[9px] font-mono text-[#FFD166] uppercase">MINUTOS</span>
              </div>
            </div>

            <div class="space-y-1">
              <span class="text-xs font-bold text-white block">Sessão Sunset Golden Hour</span>
              <p class="text-[11px] text-zinc-300">Restam 6 poltronas com mesa bistrô para esta exibição.</p>
            </div>

            <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala Sunset 01', 48.00)" class="w-full py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#FF9F1C] text-white font-bold text-xs transition active:scale-[0.97]">
              Garantir Poltrona Imediatamente
            </button>
          </div>

          <!-- BENTO TILE 4 (8 cols): 35MM CONTINUOUS FILM STRIP REEL -->
          <div class="lg:col-span-8 p-6 rounded-3xl bg-[#1B1B3A] border border-[#FF9F1C]/30 shadow-xl space-y-4">
            
            <div class="flex items-center justify-between border-b border-white/10 pb-2">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-black text-[#FFD166] uppercase tracking-wider">
                  🎞️ ROLO DE PELÍCULA // TÍTULOS ATIVOS HOJE
                </span>
              </div>
              <span class="text-[11px] font-mono text-zinc-400">Arraste para explorar</span>
            </div>

            <!-- Film Reel Sprocket Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <!-- Film Reel 1: Duna 2 -->
              <div class="p-3 rounded-2xl bg-[#0B0B12] border border-[#FF9F1C]/30 flex flex-col justify-between space-y-2 hover:border-[#FF4D00] transition">
                <div class="aspect-[2/3] rounded-xl overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80" alt="Duna 2" class="w-full h-full object-cover">
                  <span class="absolute top-2 left-2 w-5 h-5 rounded bg-orange-500 text-white font-mono text-[9px] font-black flex items-center justify-center">14</span>
                  <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[#FFD166] font-mono text-[9px] font-bold">★ 4.9</span>
                </div>
                <div>
                  <h4 class="font-bold text-white text-xs truncate">Duna: Parte 2</h4>
                  <span class="text-[10px] text-zinc-400 font-mono block">166m • Denis Villeneuve</span>
                </div>
                <button onclick="openSeatSelection('Duna: Parte 2', '19:45', 'Sala Sunset 02', 46.00)" class="w-full py-1.5 rounded-lg bg-[#1B1B3A] hover:bg-[#FF4D00] text-white text-[11px] font-mono font-bold transition active:scale-[0.97] tabular-nums">
                  19:45 • R$ 46
                </button>
              </div>

              <!-- Film Reel 2: Gladiador II -->
              <div class="p-3 rounded-2xl bg-[#0B0B12] border border-[#FF9F1C]/30 flex flex-col justify-between space-y-2 hover:border-[#FF4D00] transition">
                <div class="aspect-[2/3] rounded-xl overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80" alt="Gladiador II" class="w-full h-full object-cover">
                  <span class="absolute top-2 left-2 w-5 h-5 rounded bg-red-600 text-white font-mono text-[9px] font-black flex items-center justify-center">16</span>
                  <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[#FFD166] font-mono text-[9px] font-bold">★ 4.8</span>
                </div>
                <div>
                  <h4 class="font-bold text-white text-xs truncate">Gladiador II</h4>
                  <span class="text-[10px] text-zinc-400 font-mono block">148m • Ridley Scott</span>
                </div>
                <button onclick="openSeatSelection('Gladiador II', '20:45', 'Sala Sunset 01', 48.00)" class="w-full py-1.5 rounded-lg bg-[#1B1B3A] hover:bg-[#FF4D00] text-white text-[11px] font-mono font-bold transition active:scale-[0.97] tabular-nums">
                  20:45 • R$ 48
                </button>
              </div>

              <!-- Film Reel 3: Robô Selvagem -->
              <div class="p-3 rounded-2xl bg-[#0B0B12] border border-[#FF9F1C]/30 flex flex-col justify-between space-y-2 hover:border-[#FF4D00] transition">
                <div class="aspect-[2/3] rounded-xl overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80" alt="Robô Selvagem" class="w-full h-full object-cover">
                  <span class="absolute top-2 left-2 w-5 h-5 rounded bg-emerald-600 text-white font-mono text-[9px] font-black flex items-center justify-center">L</span>
                  <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[#FFD166] font-mono text-[9px] font-bold">★ 4.9</span>
                </div>
                <div>
                  <h4 class="font-bold text-white text-xs truncate">Robô Selvagem</h4>
                  <span class="text-[10px] text-zinc-400 font-mono block">102m • Chris Sanders</span>
                </div>
                <button onclick="openSeatSelection('Robô Selvagem', '17:10', 'Sala Sunset 03', 34.00)" class="w-full py-1.5 rounded-lg bg-[#1B1B3A] hover:bg-[#FF4D00] text-white text-[11px] font-mono font-bold transition active:scale-[0.97] tabular-nums">
                  17:10 • R$ 34
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
"""

def inject():
    target_path = os.path.abspath('cinefood/docs/prototipo/index.html')
    with open(target_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Replace view-catalog-movie section with the 4 radical layouts
    new_catalog_content = f"""<section id="view-catalog-movie">\n{LAYOUT_BOUTIQUE_GOLD}\n{LAYOUT_CYBER_IMAX}\n{LAYOUT_CINEPHILE_MINIMAL}\n{LAYOUT_SOLAR_SUNSET}\n    </section>"""
    
    pattern_catalog = re.compile(r'<section id="view-catalog-movie"[^>]*>.*?</section>', re.DOTALL)
    if pattern_catalog.search(html):
        html = pattern_catalog.sub(new_catalog_content, html)
        print("Injected 4 radical layouts into view-catalog-movie!")
    else:
        print("ERROR: could not find view-catalog-movie section")
        return

    # Update setArchetype function to support all 4
    pattern_func = re.compile(r'function setArchetype\(arch\)\s*\{.*?\n    \}\n\n    // SONNER', re.DOTALL)
    new_func = """function setArchetype(arch) {
      document.body.setAttribute('data-archetype', arch);
      localStorage.setItem('cinefood-archetype', arch);

      const lBoutique = document.getElementById('layout-boutique-gold');
      const lCyber = document.getElementById('layout-cyber-imax');
      const lCinephile = document.getElementById('layout-cinephile-minimal');
      const lSunset = document.getElementById('layout-solar-sunset');

      if (lBoutique && lCyber && lCinephile && lSunset) {
        lBoutique.classList.toggle('hidden', arch !== 'boutique-gold');
        lCyber.classList.toggle('hidden', arch !== 'cyber-imax');
        lCinephile.classList.toggle('hidden', arch !== 'cinephile-minimal');
        lSunset.classList.toggle('hidden', arch !== 'solar-sunset');
      }

      const btnBoutique = document.getElementById('btn-arch-boutique');
      const btnCyber = document.getElementById('btn-arch-cyber');
      const btnCinephile = document.getElementById('btn-arch-cinephile');
      const btnSunset = document.getElementById('btn-arch-sunset');

      const allBtns = [btnBoutique, btnCyber, btnCinephile, btnSunset].filter(Boolean);
      allBtns.forEach(b => {
        b.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white active:scale-[0.97]';
      });

      if (arch === 'boutique-gold' && btnBoutique) {
        btnBoutique.className = 'px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-amber-500 text-black shadow-sm active:scale-[0.97]';
      } else if (arch === 'cyber-imax' && btnCyber) {
        btnCyber.className = 'px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-cyan-400 text-black shadow-sm active:scale-[0.97]';
      } else if (arch === 'cinephile-minimal' && btnCinephile) {
        btnCinephile.className = 'px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-[#00E054] text-black shadow-sm active:scale-[0.97]';
      } else if (arch === 'solar-sunset' && btnSunset) {
        btnSunset.className = 'px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-gradient-to-r from-[#FF4D00] to-[#FF9F1C] text-white shadow-md active:scale-[0.97]';
      }

      if (window.lucide) {
        lucide.createIcons();
      }
    }

    // SONNER"""

    if pattern_func.search(html):
        html = pattern_func.sub(new_func, html)
        print("Updated setArchetype function successfully!")

    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print("SUCCESS: cinefood/docs/prototipo/index.html updated with 4 truly radical layouts!")

if __name__ == '__main__':
    inject()
