# -*- coding: utf-8 -*-
"""
Script to inject Archetype 4 (Solar Sunset Cinema) using the exact hex palette:
#FF4D00 (Intense Electric Orange)
#FF9F1C (Bright Amber / Citrus)
#FFD166 (Warm Sunburst Popcorn Butter)
#1B1B3A (Deep Twilight Indigo Slate)
#0B0B12 (Abyssal Obsidian Canvas)

AND apply Emil Kowalski's Design Engineering & Mobile Native craft rules across all 4 versions:
- Replace alert() with Sonner-style accessible in-page toast notifications
- Add hardware-accelerated button press feedback (active:scale-[0.97])
- Eliminate tap highlight flash (-webkit-tap-highlight-color: transparent)
- Set touch-action: manipulation to eliminate 300ms tap lag
- Add font-variant-numeric: tabular-nums to eliminate clock/price jitter
- Enforce custom easing cubic-bezier(0.23, 1, 0.32, 1) under 250ms
- Cap body line length at max-w-[65ch]
- Support prefers-reduced-motion
"""

import os
import re

LAYOUT_SOLAR_SUNSET = """
      <!-- ==================================================== -->
      <!-- ARQUÉTIPO 4: SOLAR SUNSET CINEMA (PALETA OFICIAL DO USUÁRIO) -->
      <!-- Cores: #FF4D00, #FF9F1C, #FFD166, #1B1B3A, #0B0B12 -->
      <!-- ==================================================== -->
      <div id="layout-solar-sunset" class="space-y-12 hidden">

        <!-- DUAL-STAGE SUNSET MARQUEE HERO -->
        <div class="relative rounded-3xl overflow-hidden border border-[#FF9F1C]/40 bg-[#1B1B3A] shadow-2xl p-6 lg:p-10">
          
          <!-- Background Ambient Sunset Glow -->
          <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#FF4D00]/25 via-[#FF9F1C]/15 to-transparent blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-[#1B1B3A] via-[#FF4D00]/10 to-transparent blur-3xl pointer-events-none"></div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            <!-- Left Col (5 cols): Dynamic Neon Sunset Poster Frame -->
            <div class="lg:col-span-5 space-y-4">
              <div class="relative rounded-2xl overflow-hidden p-2 bg-gradient-to-b from-[#FF4D00] via-[#FF9F1C] to-[#1B1B3A] shadow-2xl group">
                <div class="aspect-[2/3] rounded-xl overflow-hidden relative bg-[#0B0B12]">
                  <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" alt="Poster Interestelar Sunset" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-gradient-to-t from-[#0B0B12] via-transparent to-transparent"></div>
                  
                  <span class="absolute top-3 left-3 px-3 py-1 rounded-md bg-[#FF4D00] text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                    <i data-lucide="sun" class="w-3.5 h-3.5 text-[#FFD166]"></i> Sunset Session
                  </span>
                  
                  <span class="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#0B0B12]/85 backdrop-blur-md text-[#FFD166] border border-[#FF9F1C]/50 text-[11px] font-mono font-bold tabular-nums">
                    169 MIN
                  </span>

                  <div class="absolute bottom-3 left-3 right-3 text-white">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="w-6 h-6 rounded bg-[#FFD166] text-[#0B0B12] font-black text-xs flex items-center justify-center font-mono">12</span>
                      <span class="text-xs text-[#FFD166] font-bold">★ 4.9 • Odisseia Sunset</span>
                    </div>
                    <p class="text-xs text-zinc-300 font-medium">«Experiência cinematográfica radiante com som imersivo de última geração.»</p>
                  </div>
                </div>
              </div>

              <!-- Sunset Happy Hour Bar Callout -->
              <div class="p-3.5 rounded-xl bg-[#0B0B12]/80 border border-[#FF9F1C]/30 flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#FF9F1C] flex items-center justify-center text-white shrink-0 shadow-md">
                  <i data-lucide="martini" class="w-4 h-4 text-[#FFD166]"></i>
                </div>
                <div class="text-xs">
                  <span class="font-bold text-[#FFD166] block">Sunset Bar & Kitchen Integrado:</span>
                  <span class="text-zinc-300 text-[11px]">Coquetéis autorais servidos na poltrona durante a Golden Hour com aperitivos quentes.</span>
                </div>
              </div>
            </div>

            <!-- Right Col (7 cols): Sunset Typography, Rails & Showtime Selectors -->
            <div class="lg:col-span-7 space-y-6">
              
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-3 py-1 rounded-full bg-[#FF4D00]/20 text-[#FFD166] text-xs font-bold border border-[#FF4D00]/40 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse"></span>
                    SALA SUNSET 01 • DINE-IN CLUB
                  </span>
                  <span class="text-xs text-zinc-400">•</span>
                  <span class="text-xs text-zinc-300 font-medium">Christopher Nolan</span>
                  <span class="text-xs text-zinc-400">•</span>
                  <span class="px-2 py-0.5 rounded bg-[#FF9F1C]/20 text-[#FF9F1C] border border-[#FF9F1C]/30 text-xs font-mono font-bold">70mm Laser</span>
                </div>

                <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight uppercase font-sans">
                  Interestelar: <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] via-[#FF9F1C] to-[#FFD166]">Edição Sunset 10 Anos</span>
                </h1>

                <p class="text-sm text-zinc-300 leading-relaxed font-sans max-w-[65ch]">
                  Mergulhe no épico espacial mais comovente do cinema moderno em um ambiente com poltronas aveludadas reclináveis, serviço bistrô na poltrona e carta de drinks exclusiva servida durante a sessão.
                </p>
              </div>

              <!-- Sunset Experience Highlights -->
              <div class="grid grid-cols-3 gap-3 pt-1 border-t border-white/10">
                <div class="p-3 rounded-xl bg-[#0B0B12]/60 border border-[#FF9F1C]/20 text-center">
                  <span class="block text-lg">🛋️</span>
                  <span class="text-xs font-bold text-[#FFD166] block mt-0.5">Poltrona Sunset</span>
                  <span class="text-[10px] text-zinc-400">Reclinável c/ luz quente</span>
                </div>
                <div class="p-3 rounded-xl bg-[#0B0B12]/60 border border-[#FF9F1C]/20 text-center">
                  <span class="block text-lg">🍹</span>
                  <span class="text-xs font-bold text-[#FFD166] block mt-0.5">Welcome Drink</span>
                  <span class="text-[10px] text-zinc-400">Sunset Spritz na entrada</span>
                </div>
                <div class="p-3 rounded-xl bg-[#0B0B12]/60 border border-[#FF9F1C]/20 text-center">
                  <span class="block text-lg">⚡</span>
                  <span class="text-xs font-bold text-[#FFD166] block mt-0.5">Runner Silencioso</span>
                  <span class="text-[10px] text-zinc-400">Zero luz na sala</span>
                </div>
              </div>

              <!-- Sunset Showtime Pills with Time-of-Day Badges -->
              <div class="space-y-2.5 pt-2">
                <span class="text-xs font-bold text-[#FFD166] uppercase tracking-wider block">
                  Escolha seu Momento de Exibição:
                </span>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <button onclick="openSeatSelection('Interestelar', '16:30', 'Sala Sunset 01', 42.00)" class="p-3 rounded-xl bg-[#0B0B12]/80 hover:bg-[#FF4D00] hover:text-white border border-[#FF9F1C]/30 text-left transition group active:scale-[0.97]">
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-sm font-black text-[#FFD166] group-hover:text-white tabular-nums">16:30</span>
                      <span class="text-[9px] bg-[#FF9F1C]/20 group-hover:bg-white/20 text-[#FF9F1C] group-hover:text-white px-1.5 py-0.5 rounded font-bold uppercase">Golden Hour</span>
                    </div>
                    <span class="text-[10px] text-zinc-400 group-hover:text-white font-medium block mt-1">Sessão Vespertina</span>
                    <span class="text-xs font-mono font-bold text-white block mt-0.5 tabular-nums">R$ 42,00</span>
                  </button>

                  <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala Sunset 01', 48.00)" class="p-3 rounded-xl bg-gradient-to-br from-[#FF4D00] to-[#FF9F1C] text-[#0B0B12] border border-[#FFD166] text-left transition shadow-lg shadow-[#FF4D00]/30 active:scale-[0.97]">
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-sm font-black text-[#0B0B12] tabular-nums">19:30</span>
                      <span class="text-[9px] font-black bg-[#0B0B12] text-[#FFD166] px-1.5 py-0.5 rounded uppercase">Sunset Prime</span>
                    </div>
                    <span class="text-[10px] text-[#0B0B12] font-black uppercase block mt-1">Dine-In Completo</span>
                    <span class="text-xs font-mono font-black text-[#0B0B12] block mt-0.5 tabular-nums">R$ 48,00</span>
                  </button>

                  <button onclick="openSeatSelection('Interestelar', '22:15', 'Sala Sunset 01', 42.00)" class="p-3 rounded-xl bg-[#0B0B12]/80 hover:bg-[#FF4D00] hover:text-white border border-[#FF9F1C]/30 text-left transition group active:scale-[0.97]">
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-sm font-black text-[#FFD166] group-hover:text-white tabular-nums">22:15</span>
                      <span class="text-[9px] bg-white/10 group-hover:bg-white/20 text-zinc-300 group-hover:text-white px-1.5 py-0.5 rounded font-bold uppercase">Midnight</span>
                    </div>
                    <span class="text-[10px] text-zinc-400 group-hover:text-white font-medium block mt-1">Sessão Corujão</span>
                    <span class="text-xs font-mono font-bold text-white block mt-0.5 tabular-nums">R$ 42,00</span>
                  </button>

                </div>
              </div>

              <!-- Direct Action Buttons -->
              <div class="pt-2 flex flex-wrap items-center gap-4">
                <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala Sunset 01', 48.00)" class="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF4D00] via-[#FF9F1C] to-[#FFD166] hover:brightness-110 text-[#0B0B12] font-black text-sm flex items-center gap-2.5 transition shadow-xl shadow-[#FF4D00]/25 active:scale-[0.97]">
                  <i data-lucide="armchair" class="w-4 h-4 text-[#0B0B12]"></i> Reservar Poltrona Sunset (R$ 48)
                </button>
                <button onclick="openConcessionDrawer()" class="px-4 py-3 rounded-xl bg-[#0B0B12]/80 hover:bg-[#0B0B12] text-[#FFD166] border border-[#FF9F1C]/40 text-xs font-bold flex items-center gap-2 transition active:scale-[0.97]">
                  <i data-lucide="utensils-crossed" class="w-4 h-4 text-[#FF4D00]"></i> Cardápio de Poltrona
                </button>
              </div>

            </div>

          </div>

        </div>

        <!-- SUNSET DINE-IN BAR & KITCHEN SHOWCASE -->
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-[#FF9F1C]/30 pb-3">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-widest text-[#FF4D00] block font-bold">ALTA GASTRONOMIA DE POLTRONA</span>
              <h2 class="text-2xl font-black text-white font-sans uppercase">Sunset Bar & Kitchen</h2>
            </div>
            <button onclick="openConcessionDrawer()" class="text-xs text-[#FFD166] hover:text-[#FF9F1C] font-bold flex items-center gap-1 active:scale-[0.97]">
              Explorar Cardápio Completo ➔
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Food 1: Flame Smash Burger -->
            <div class="p-4 rounded-2xl bg-[#1B1B3A] border border-[#FF9F1C]/30 flex flex-col justify-between hover:border-[#FF4D00] transition group">
              <div class="space-y-3">
                <div class="w-full h-36 rounded-xl bg-[#0B0B12] overflow-hidden relative border border-white/5">
                  <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80" alt="Flame Burger" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#FF4D00] text-white font-bold text-[9px] uppercase shadow-sm">Flame-Grilled</span>
                </div>
                <h3 class="font-bold text-white text-sm">Flame Smash Burger Duplo</h3>
                <p class="text-xs text-zinc-300 leading-relaxed font-sans max-w-[65ch]">Dois smash patties na chapa quente, queijo cheddar artesanal derretido e maionese de páprica defumada no brioche.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-[#FF9F1C]/20 flex items-center justify-between">
                <span class="font-mono font-black text-[#FFD166] text-sm tabular-nums">R$ 38,00</span>
                <button onclick="addConcessionItem('Flame Smash Burger Duplo', 38.00)" class="px-3 py-1.5 rounded-lg bg-[#FF4D00] hover:bg-[#FF9F1C] text-white text-xs font-bold transition active:scale-[0.97]">
                  + Adicionar
                </button>
              </div>
            </div>

            <!-- Food 2: Pipoca Sunset Butter -->
            <div class="p-4 rounded-2xl bg-[#1B1B3A] border border-[#FF9F1C]/30 flex flex-col justify-between hover:border-[#FF4D00] transition group">
              <div class="space-y-3">
                <div class="w-full h-36 rounded-xl bg-[#0B0B12] overflow-hidden relative border border-white/5">
                  <img src="https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=500&q=80" alt="Pipoca Sunset" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#FF9F1C] text-[#0B0B12] font-black text-[9px] uppercase shadow-sm">Golden Butter</span>
                </div>
                <h3 class="font-bold text-white text-sm">Pipoca Sunset Caramel & Butter</h3>
                <p class="text-xs text-zinc-300 leading-relaxed font-sans max-w-[65ch]">Pipoca artesanal caramelizada com infusão de manteiga ghee, fava de baunilha e leve toque de flor de sal.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-[#FF9F1C]/20 flex items-center justify-between">
                <span class="font-mono font-black text-[#FFD166] text-sm tabular-nums">R$ 29,00</span>
                <button onclick="addConcessionItem('Pipoca Sunset Butter', 29.00)" class="px-3 py-1.5 rounded-lg bg-[#FF4D00] hover:bg-[#FF9F1C] text-white text-xs font-bold transition active:scale-[0.97]">
                  + Adicionar
                </button>
              </div>
            </div>

            <!-- Food 3: Sunset Spritz Cocktail -->
            <div class="p-4 rounded-2xl bg-[#1B1B3A] border border-[#FF9F1C]/30 flex flex-col justify-between hover:border-[#FF4D00] transition group">
              <div class="space-y-3">
                <div class="w-full h-36 rounded-xl bg-[#0B0B12] overflow-hidden relative border border-white/5">
                  <img src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=500&q=80" alt="Sunset Spritz" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#FFD166] text-[#0B0B12] font-black text-[9px] uppercase shadow-sm">Signature Drink</span>
                </div>
                <h3 class="font-bold text-white text-sm">Cocktail Sunset Spritz (Laranja)</h3>
                <p class="text-xs text-zinc-300 leading-relaxed font-sans max-w-[65ch]">Aperitivo cítrico com espumante brut, redução de laranja sanguínea e água com gás em copo térmico soft-touch.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-[#FF9F1C]/20 flex items-center justify-between">
                <span class="font-mono font-black text-[#FFD166] text-sm tabular-nums">R$ 32,00</span>
                <button onclick="addConcessionItem('Sunset Spritz Cocktail', 32.00)" class="px-3 py-1.5 rounded-lg bg-[#FF4D00] hover:bg-[#FF9F1C] text-white text-xs font-bold transition active:scale-[0.97]">
                  + Adicionar
                </button>
              </div>
            </div>

            <!-- Food 4: Pipoca Trufada c/ Queijo -->
            <div class="p-4 rounded-2xl bg-[#1B1B3A] border border-[#FF9F1C]/30 flex flex-col justify-between hover:border-[#FF4D00] transition group">
              <div class="space-y-3">
                <div class="w-full h-36 rounded-xl bg-[#0B0B12] overflow-hidden relative border border-white/5">
                  <img src="https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=500&q=80" alt="Pipoca Trufada" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#FF4D00] text-white font-bold text-[9px] uppercase shadow-sm">Chef Reserve</span>
                </div>
                <h3 class="font-bold text-white text-sm">Pipoca Trufada c/ Grana Padano</h3>
                <p class="text-xs text-zinc-300 leading-relaxed font-sans max-w-[65ch]">Azeite trufado branco nobre, raspas de queijo Grana Padano e pimenta preta moída na hora em cerâmica acústica.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-[#FF9F1C]/20 flex items-center justify-between">
                <span class="font-mono font-black text-[#FFD166] text-sm tabular-nums">R$ 28,00</span>
                <button onclick="addConcessionItem('Pipoca Trufada Grana Padano', 28.00)" class="px-3 py-1.5 rounded-lg bg-[#FF4D00] hover:bg-[#FF9F1C] text-white text-xs font-bold transition active:scale-[0.97]">
                  + Adicionar
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- SUNSET PROGRAMAÇÃO EM CARTAZ (CARDS POLIDOS COM EMIL DESIGN RULES) -->
        <div class="space-y-6">
          <div class="border-b border-[#FF9F1C]/30 pb-3 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-widest text-[#FF4D00] block font-bold">EM CARTAZ // SUNSET FESTIVAL</span>
              <h2 class="text-2xl font-black text-white font-sans uppercase">Sessões Disponíveis Hoje</h2>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

            <!-- Movie 1: Duna 2 -->
            <div class="p-5 rounded-2xl bg-[#1B1B3A] border border-[#FF9F1C]/30 hover:border-[#FF4D00] transition flex flex-col sm:flex-row gap-5 items-center">
              <div class="w-full sm:w-32 aspect-[2/3] rounded-xl overflow-hidden shrink-0 bg-[#0B0B12] relative border border-white/10">
                <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80" alt="Duna 2" class="w-full h-full object-cover">
                <span class="absolute top-2 left-2 w-6 h-6 rounded bg-orange-500 text-white font-mono text-[10px] font-black flex items-center justify-center">14</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-[#FFD166]">Denis Villeneuve</span>
                  <span class="text-xs text-zinc-500">•</span>
                  <span class="text-xs text-zinc-300 font-mono tabular-nums">166 min</span>
                  <span class="text-xs text-zinc-500">•</span>
                  <span class="text-xs text-[#FF9F1C] font-bold">★ 4.9</span>
                </div>
                <h3 class="text-xl font-bold text-white">Duna: Parte 2</h3>
                <p class="text-xs text-zinc-300 line-clamp-2 max-w-[65ch]">Paul Atreides lidera os Fremen pelas dunas de Arrakis em uma odisseia épica visual.</p>
                <div class="flex flex-wrap gap-2 pt-1">
                  <button onclick="openSeatSelection('Duna: Parte 2', '16:00', 'Sala Sunset 02', 44.00)" class="px-3 py-1.5 rounded-lg bg-[#0B0B12]/80 hover:bg-[#FF4D00] hover:text-white border border-[#FF9F1C]/40 text-xs font-mono font-bold text-white transition active:scale-[0.97] tabular-nums">
                    16:00 (DUB) • R$ 44
                  </button>
                  <button onclick="openSeatSelection('Duna: Parte 2', '19:45', 'Sala Sunset 02', 46.00)" class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF4D00] to-[#FF9F1C] text-[#0B0B12] text-xs font-mono font-black transition active:scale-[0.97] tabular-nums shadow-sm">
                    19:45 (VIP LEG) • R$ 46
                  </button>
                </div>
              </div>
            </div>

            <!-- Movie 2: Gladiador II -->
            <div class="p-5 rounded-2xl bg-[#1B1B3A] border border-[#FF9F1C]/30 hover:border-[#FF4D00] transition flex flex-col sm:flex-row gap-5 items-center">
              <div class="w-full sm:w-32 aspect-[2/3] rounded-xl overflow-hidden shrink-0 bg-[#0B0B12] relative border border-white/10">
                <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80" alt="Gladiador II" class="w-full h-full object-cover">
                <span class="absolute top-2 left-2 w-6 h-6 rounded bg-red-600 text-white font-mono text-[10px] font-black flex items-center justify-center">16</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-[#FFD166]">Ridley Scott</span>
                  <span class="text-xs text-zinc-500">•</span>
                  <span class="text-xs text-zinc-300 font-mono tabular-nums">148 min</span>
                  <span class="text-xs text-zinc-500">•</span>
                  <span class="text-xs text-[#FF9F1C] font-bold">★ 4.8</span>
                </div>
                <h3 class="text-xl font-bold text-white">Gladiador II</h3>
                <p class="text-xs text-zinc-300 line-clamp-2 max-w-[65ch]">A arena imperial de Roma ressurge em som estrondoso e projeção laser ultrawide.</p>
                <div class="flex flex-wrap gap-2 pt-1">
                  <button onclick="openSeatSelection('Gladiador II', '17:00', 'Sala Sunset 01', 46.00)" class="px-3 py-1.5 rounded-lg bg-[#0B0B12]/80 hover:bg-[#FF4D00] hover:text-white border border-[#FF9F1C]/40 text-xs font-mono font-bold text-white transition active:scale-[0.97] tabular-nums">
                    17:00 (LEG) • R$ 46
                  </button>
                  <button onclick="openSeatSelection('Gladiador II', '20:45', 'Sala Sunset 01', 48.00)" class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF4D00] to-[#FF9F1C] text-[#0B0B12] text-xs font-mono font-black transition active:scale-[0.97] tabular-nums shadow-sm">
                    20:45 (VIP LEG) • R$ 48
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
"""

def update_index_html():
    target_path = os.path.abspath('cinefood/docs/prototipo/index.html')
    with open(target_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update CSS styles for Emil Kowalski Craft Rules & Archetype 4
    craft_css = """
    /* ==================================================== */
    /* EMIL KOWALSKI DESIGN ENGINEERING & CRAFT FOUNDATIONS  */
    /* ==================================================== */
    :root {
      --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
      --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
      --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
      
      /* Padrão Inicial */
      --md-sys-color-primary: #FF4D00;
      --md-sys-color-on-primary: #0B0B12;
      --md-sys-color-surface: #0B0B12;
      --md-sys-color-surface-container: #1B1B3A;
      --md-sys-color-surface-container-high: #26264D;
      --md-sys-color-secondary: #FF9F1C;
      --md-sys-color-outline: #3D3D6B;
      --md-sys-font-display: 'Space Grotesk', sans-serif;
      --md-sys-font-body: 'Plus Jakarta Sans', sans-serif;
      font-family: var(--md-sys-font-body);
    }

    /* Mobile Native: zero tap delay & eliminate iOS/Android gray tap flash */
    html {
      -webkit-tap-highlight-color: transparent !important;
      touch-action: manipulation;
      overscroll-behavior-y: none;
    }

    /* Button and Interactive Press Feedback (Active 0.97) */
    button, a[role="button"], .interactive-press {
      user-select: none;
      -webkit-user-select: none;
      transition: transform 140ms var(--ease-out), opacity 140ms ease-out, background-color 140ms ease-out, border-color 140ms ease-out;
    }
    button:active, a[role="button"]:active, .interactive-press:active {
      transform: scale(0.97) !important;
    }

    /* Tabular numbers for clocks, countdowns, prices and percentages */
    .tabular-nums, .font-mono, [data-tabular] {
      font-variant-numeric: tabular-nums !important;
    }

    /* Cap body line lengths for reading comfort */
    .prose-readable {
      max-width: 65ch;
    }

    /* Respect prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* ARQUÉTIPO 1: BOUTIQUE & GOLDEN AGE (EVERYMAN & CURZON) */
    body[data-archetype="boutique-gold"] {
      --md-sys-color-primary: #EAB308;
      --md-sys-color-on-primary: #1C1917;
      --md-sys-color-surface: #12100D;
      --md-sys-color-surface-container: #1C1917;
      --md-sys-color-surface-container-high: #292524;
      --md-sys-color-secondary: #E8A2A8;
      --md-sys-color-outline: #44403C;
      --md-sys-font-display: 'Playfair Display', serif;
      --md-sys-font-body: 'Plus Jakarta Sans', sans-serif;
    }

    /* ARQUÉTIPO 2: CYBER IMAX MULTIPLEX (TECNOLOGIA & ESPETÁCULO) */
    body[data-archetype="cyber-imax"] {
      --md-sys-color-primary: #00F0FF;
      --md-sys-color-on-primary: #030712;
      --md-sys-color-surface: #070A11;
      --md-sys-color-surface-container: #0F172A;
      --md-sys-color-surface-container-high: #1E293B;
      --md-sys-color-secondary: #FF0055;
      --md-sys-color-outline: #334155;
      --md-sys-font-display: 'Space Grotesk', sans-serif;
      --md-sys-font-body: 'Inter', sans-serif;
    }

    /* ARQUÉTIPO 3: CINÉPHILE STUDIO MINIMAL (LETTERBOXD & MUBI) */
    body[data-archetype="cinephile-minimal"] {
      --md-sys-color-primary: #00E054;
      --md-sys-color-on-primary: #090A0C;
      --md-sys-color-surface: #141416;
      --md-sys-color-surface-container: #1F1F23;
      --md-sys-color-surface-container-high: #2A2A2E;
      --md-sys-color-secondary: #F59E0B;
      --md-sys-color-outline: #323238;
      --md-sys-font-display: 'Oswald', sans-serif;
      --md-sys-font-body: 'Work Sans', sans-serif;
    }

    /* ARQUÉTIPO 4: SOLAR SUNSET CINEMA (PALETA OFICIAL DO USUÁRIO) */
    body[data-archetype="solar-sunset"] {
      --md-sys-color-primary: #FF4D00;
      --md-sys-color-on-primary: #0B0B12;
      --md-sys-color-surface: #0B0B12;
      --md-sys-color-surface-container: #1B1B3A;
      --md-sys-color-surface-container-high: #26264D;
      --md-sys-color-secondary: #FF9F1C;
      --md-sys-color-tertiary: #FFD166;
      --md-sys-color-outline: #3D3D6B;
      --md-sys-font-display: 'Space Grotesk', sans-serif;
      --md-sys-font-body: 'Plus Jakarta Sans', sans-serif;
    }
"""
    # Replace style block
    pattern_css = re.compile(r'/\* ==================================================== \*/\s*/\* MATERIAL 3 DESIGN SYSTEM TOKENS.*?(?=\.font-marquee)', re.DOTALL)
    if pattern_css.search(html):
        html = pattern_css.sub(craft_css + "\n    ", html)
        print("Updated style block with Emil Kowalski Craft & Archetype 4 tokens!")
    else:
        print("Could not find style block to replace, skipping...")

    # 2. Update Archetype Bar to include Option 4
    old_arch_buttons = """      <button onclick="setArchetype('cinephile-minimal')" id="btn-arch-cinephile" class="px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white" title="Letterboxd & MUBI: Carvão neutro, alta densidade e verde de contraste">
        <span>🎬</span> 3. Cinéphile Minimal
      </button>
    </div>"""

    new_arch_buttons = """      <button onclick="setArchetype('cinephile-minimal')" id="btn-arch-cinephile" class="px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white" title="Letterboxd & MUBI: Carvão neutro, alta densidade e verde de contraste">
        <span>🎬</span> 3. Cinéphile Minimal
      </button>
      <button onclick="setArchetype('solar-sunset')" id="btn-arch-sunset" class="px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white" title="Solar Sunset: #FF4D00, #FF9F1C, #FFD166, #1B1B3A, #0B0B12">
        <span>🌅</span> 4. Solar Sunset
      </button>
    </div>"""

    if old_arch_buttons in html:
        html = html.replace(old_arch_buttons, new_arch_buttons)
        print("Updated #m3-archetype-bar with 4th button!")

    # 3. Add Layout 4 inside <section id="view-catalog-movie">
    if '<div id="layout-solar-sunset"' not in html:
        cinephile_end = '<!-- ARQUÉTIPO 3: CINÉPHILE STUDIO MINIMAL (LETTERBOXD & MUBI) -->'
        # Let's find </section> for view-catalog-movie
        pos_movie_sec = html.find('</section>\n\n    <!-- ============================================== -->\n    <!-- VIEW 1B: CATALOG BY CINEMA COMPLEX')
        if pos_movie_sec != -1:
            html = html[:pos_movie_sec] + LAYOUT_SOLAR_SUNSET + "\n    " + html[pos_movie_sec:]
            print("Injected LAYOUT_SOLAR_SUNSET inside view-catalog-movie!")
        else:
            print("WARNING: Could not find end of view-catalog-movie, using regex...")
            pattern_sec = re.compile(r'(<div id="layout-cinephile-minimal".*?</div>\s*)\n\s*(</section>)', re.DOTALL)
            html = pattern_sec.sub(r'\1\n' + LAYOUT_SOLAR_SUNSET + r'\n    \2', html)
            print("Regex injected LAYOUT_SOLAR_SUNSET successfully!")

    # 4. Add Sonner Toaster container right before </body>
    toaster_html = """  <!-- SONNER ACCESSIBLE IN-PAGE TOASTER CONTAINER (EMIL KOWALSKI CRAFT) -->
  <div id="sonner-toaster" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"></div>
"""
    if 'id="sonner-toaster"' not in html:
        html = html.replace('</body>', toaster_html + '</body>')
        print("Added #sonner-toaster container!")

    # 5. Update setArchetype function to handle 4 archetypes
    pattern_func = re.compile(r'function setArchetype\(arch\)\s*\{.*?\n    \}\n\n    function switchView', re.DOTALL)
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

    // SONNER-COMPATIBLE LIGHTWEIGHT TOAST SYSTEM
    const toast = {
      show(title, description, icon = 'check-circle') {
        const container = document.getElementById('sonner-toaster');
        if (!container) return;
        const toastEl = document.createElement('div');
        toastEl.className = 'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[#14141A] border border-white/10 text-white shadow-2xl transition-all duration-200 transform translate-y-3 opacity-0';
        toastEl.style.transitionTimingFunction = 'cubic-bezier(0.23, 1, 0.32, 1)';
        toastEl.innerHTML = `
          <div class="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF4D00] to-[#FF9F1C] text-white flex items-center justify-center shrink-0 mt-0.5">
            <i data-lucide="${icon}" class="w-3.5 h-3.5"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold text-white">${title}</div>
            ${description ? `<div class="text-[11px] text-zinc-400 mt-0.5">${description}</div>` : ''}
          </div>
          <button onclick="this.parentElement.remove()" class="text-zinc-500 hover:text-white text-xs leading-none p-1">✕</button>
        `;
        container.appendChild(toastEl);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => {
          toastEl.classList.remove('translate-y-3', 'opacity-0');
          toastEl.classList.add('translate-y-0', 'opacity-100');
        });
        setTimeout(() => {
          toastEl.classList.add('translate-y-2', 'opacity-0');
          setTimeout(() => toastEl.remove(), 250);
        }, 3500);
      }
    };"""

    if pattern_func.search(html):
        html = pattern_func.sub(new_func + "\n\n    function switchView", html)
        print("Updated setArchetype and injected toast system!")
    else:
        print("WARNING: Could not regex replace setArchetype")

    # 6. Replace annoying alert(...) with toast.show(...)
    html = html.replace("alert('[1-Tap Silent Reorder • Protocolo In-Theater]\\n\\nItem \"Pipoca Trufada c/ Parmesão\" (R$ 28,00) repetido com sucesso!\\nO Runner fará a entrega furtiva na sua poltrona sem acender luzes nem emitir ruído.');", "toast.show('1-Tap Silent Reorder', 'Pipoca Trufada (R$ 28,00) repetida! Entrega na poltrona ativa.', 'repeat');")
    html = html.replace("alert(`Item \"${name}\" adicionado e vinculado à sua poltrona!`);", "toast.show('Item Adicionado!', `${name} foi vinculado à sua poltrona.`, 'utensils');")

    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print("SUCCESS: 4 layouts and Emil Kowalski craft skills integrated into index.html!")

if __name__ == '__main__':
    update_index_html()
