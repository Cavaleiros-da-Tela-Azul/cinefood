# -*- coding: utf-8 -*-
"""
Script to inject 3 radically distinct, production-grade layouts into cinefood/docs/prototipo/index.html
1. Boutique & Golden Age (Editorial Asymmetric Magazine, Velvet Sofas, Wine & Dine Tasting Menu)
2. Cyber IMAX Multiplex (Ultra-Panoramic 24:10 Screen HUD, Real-time Departure Board Matrix, Snack Turbo Hub)
3. Cinéphile Studio Minimal (Curator's Filter Header, Ultra-Dense 5-Column Poster Grid, Monospace Bomboniere)
"""

import os
import re

LAYOUT_BOUTIQUE_GOLD = """
      <!-- ==================================================== -->
      <!-- ARQUÉTIPO 1: BOUTIQUE & GOLDEN AGE (EVERYMAN & CURZON) -->
      <!-- ==================================================== -->
      <div id="layout-boutique-gold" class="space-y-12">

        <!-- EDITORIAL ASYMMETRICAL SPLIT MAGAZINE HERO -->
        <div class="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-[#171411] shadow-2xl p-6 lg:p-10">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <!-- Left Col (5 cols): Vintage Velvet Frame Poster + Sommelier Note -->
            <div class="lg:col-span-5 space-y-4">
              <div class="relative rounded-2xl overflow-hidden ring-1 ring-amber-400/40 p-2 bg-gradient-to-b from-[#251E17] to-black shadow-2xl">
                <div class="aspect-[2/3] rounded-xl overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" alt="Poster Interestelar" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  
                  <span class="absolute top-3 left-3 px-3 py-1 rounded-md bg-amber-500 text-black font-serif font-black text-xs uppercase tracking-widest shadow-lg">
                    ★ Sessão de Gala
                  </span>
                  <span class="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/50 text-[11px] font-mono font-bold">
                    169 MIN
                  </span>
                  
                  <div class="absolute bottom-3 left-3 right-3 text-white">
                    <p class="font-serif italic text-xs text-amber-200">«Uma odisseia transcendente que redefine o cinema moderno.»</p>
                    <span class="text-[10px] text-zinc-400 font-sans uppercase tracking-widest mt-0.5 block">— Cahiers du Cinéma ★★★★★</span>
                  </div>
                </div>
              </div>

              <!-- Sommelier Pairing Note -->
              <div class="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/30 flex items-start gap-3">
                <i data-lucide="wine" class="w-5 h-5 text-amber-400 shrink-0 mt-0.5"></i>
                <div class="text-xs">
                  <span class="font-bold text-amber-300 block font-serif">Harmonização Sugerida pelo Sommelier:</span>
                  <span class="text-zinc-300 text-[11px]">Pinot Noir Reserva Especial servido na temperatura ideal + Mini Brioches com queijo brie trufado na sua mesa bistrô.</span>
                </div>
              </div>
            </div>

            <!-- Right Col (7 cols): Editorial Typography, Salon Specs & Showtime Reservation -->
            <div class="lg:col-span-7 space-y-6">
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-serif font-semibold border border-amber-500/30">
                    CineFood Salon Privé • Sala 01
                  </span>
                  <span class="text-xs text-zinc-400">•</span>
                  <span class="text-xs text-zinc-400 font-sans">Dir. Christopher Nolan</span>
                  <span class="text-xs text-zinc-400">•</span>
                  <span class="w-5 h-5 rounded bg-amber-500 text-black font-black text-[10px] flex items-center justify-center font-mono">12</span>
                </div>

                <h1 class="text-3xl sm:text-5xl font-black text-amber-50 font-serif tracking-tight leading-tight">
                  Interestelar: Edição Especial em 70mm
                </h1>

                <p class="text-sm text-zinc-300 leading-relaxed font-sans font-normal">
                  Uma experiência suntuosa no nosso salão boutique. Assista à odisseia espacial com projeção analógica de altíssima fidelidade, poltronas aveludadas individuais e sofás namoradeira com mesinhas bistrô individuais. Garçons runners silenciosos atendem antes do início e no intervalo.
                </p>
              </div>

              <!-- Salon Amenities Strip -->
              <div class="grid grid-cols-3 gap-3 pt-2 border-t border-amber-900/30">
                <div class="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 text-center">
                  <span class="block text-lg">🛋️</span>
                  <span class="text-[11px] font-bold text-amber-200 block mt-0.5 font-serif">Sofás Aveludados</span>
                  <span class="text-[9px] text-zinc-400">Reclináveis c/ abajur</span>
                </div>
                <div class="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 text-center">
                  <span class="block text-lg">🛎️</span>
                  <span class="text-[11px] font-bold text-amber-200 block mt-0.5 font-serif">Runner Silencioso</span>
                  <span class="text-[9px] text-zinc-400">Atendimento discreto</span>
                </div>
                <div class="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 text-center">
                  <span class="block text-lg">🍷</span>
                  <span class="text-[11px] font-bold text-amber-200 block mt-0.5 font-serif">Carta de Vinhos</span>
                  <span class="text-[9px] text-zinc-400">Rótulos selecionados</span>
                </div>
              </div>

              <!-- Showtime Selector Cards -->
              <div class="space-y-2.5 pt-2">
                <span class="text-xs font-serif font-bold text-amber-300 uppercase tracking-wider block">
                  Escolha o Horário & Modalidade do Sofá:
                </span>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button onclick="openSeatSelection('Interestelar', '16:30', 'Salão Boutique 01', 42.00)" class="p-3 rounded-xl bg-[#201A14] hover:bg-amber-500 hover:text-black border border-amber-500/30 text-left transition group">
                    <span class="font-mono text-sm font-black text-amber-300 group-hover:text-black block">16:30</span>
                    <span class="text-[10px] text-zinc-400 group-hover:text-black font-semibold uppercase block">Poltrona Prime</span>
                    <span class="text-[11px] font-mono font-bold text-zinc-200 group-hover:text-black block mt-1">R$ 42,00</span>
                  </button>

                  <button onclick="openSeatSelection('Interestelar', '19:30', 'Salão Boutique 01', 48.00)" class="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-black border border-amber-400 text-left transition shadow-lg shadow-amber-600/30 ring-1 ring-amber-300">
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-sm font-black text-black">19:30</span>
                      <span class="text-[9px] font-extrabold bg-black text-amber-300 px-1.5 py-0.5 rounded">GALA</span>
                    </div>
                    <span class="text-[10px] text-black font-bold uppercase block mt-0.5">Sofá Duplo c/ Drink</span>
                    <span class="text-[11px] font-mono font-black text-black block mt-1">R$ 48,00</span>
                  </button>

                  <button onclick="openSeatSelection('Interestelar', '22:15', 'Salão Boutique 01', 42.00)" class="p-3 rounded-xl bg-[#201A14] hover:bg-amber-500 hover:text-black border border-amber-500/30 text-left transition group">
                    <span class="font-mono text-sm font-black text-amber-300 group-hover:text-black block">22:15</span>
                    <span class="text-[10px] text-zinc-400 group-hover:text-black font-semibold uppercase block">Sessão Noturna</span>
                    <span class="text-[11px] font-mono font-bold text-zinc-200 group-hover:text-black block mt-1">R$ 42,00</span>
                  </button>
                </div>
              </div>

              <!-- Direct Action Button -->
              <div class="pt-2 flex items-center gap-4">
                <button onclick="openSeatSelection('Interestelar', '19:30', 'Salão Boutique 01', 48.00)" class="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-serif font-black text-sm flex items-center gap-2.5 transition shadow-xl shadow-amber-500/20 active:scale-95">
                  <i data-lucide="armchair" class="w-4 h-4"></i> Reservar Sofás & Mesa Bistrô
                </button>
                <button onclick="openConcessionDrawer()" class="px-4 py-3 rounded-xl bg-[#201A14] hover:bg-[#2A231B] text-amber-300 border border-amber-500/30 font-serif text-xs font-semibold flex items-center gap-2 transition">
                  <i data-lucide="book-open" class="w-4 h-4 text-amber-400"></i> Consultar Menu Completo
                </button>
              </div>

            </div>

          </div>
        </div>

        <!-- CHEF'S TASTING LOUNGE & SOMMELIER CAROUSEL -->
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-amber-900/30 pb-3">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-widest text-amber-400 block font-bold">ALTA COZINHA DE POLTRONA</span>
              <h2 class="text-2xl font-black text-white font-serif">Menu Harmonizado CineFood</h2>
            </div>
            <button onclick="openConcessionDrawer()" class="text-xs text-amber-300 hover:text-amber-200 font-serif flex items-center gap-1 font-bold">
              Ver Carta de Vinhos & Pratos ➔
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="p-4 rounded-2xl bg-[#1C1814] border border-amber-500/25 flex flex-col justify-between hover:border-amber-400/60 transition group">
              <div class="space-y-3">
                <div class="w-full h-36 rounded-xl bg-black overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80" alt="Burgers" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-black font-serif font-bold text-[9px] uppercase">Chef Signature</span>
                </div>
                <h3 class="font-serif font-bold text-amber-100 text-sm">Duo Mini Smash Burgers em Brioche</h3>
                <p class="text-xs text-zinc-400 leading-relaxed font-sans">Dois mini burgers em pão brioche dourado, queijo cheddar inglês e maionese defumada sem ruído.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-amber-900/30 flex items-center justify-between">
                <span class="font-mono font-black text-amber-400 text-sm">R$ 38,00</span>
                <button onclick="addConcessionItem('Duo Mini Smash Burgers', 38.00)" class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-300 text-xs font-serif font-bold border border-amber-500/40 transition">
                  + Incluir
                </button>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#1C1814] border border-amber-500/25 flex flex-col justify-between hover:border-amber-400/60 transition group">
              <div class="space-y-3">
                <div class="w-full h-36 rounded-xl bg-black overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=500&q=80" alt="Pipoca Trufada" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-black font-serif font-bold text-[9px] uppercase">Louça Silenciosa</span>
                </div>
                <h3 class="font-serif font-bold text-amber-100 text-sm">Pipoca Trufada c/ Parmesão Reggiano</h3>
                <p class="text-xs text-zinc-400 leading-relaxed font-sans">Azeite de trufas brancas importado, queijo parmesão ralado na hora e servida em cerâmica acústica.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-amber-900/30 flex items-center justify-between">
                <span class="font-mono font-black text-amber-400 text-sm">R$ 28,00</span>
                <button onclick="addConcessionItem('Pipoca Trufada c/ Parmesão', 28.00)" class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-300 text-xs font-serif font-bold border border-amber-500/40 transition">
                  + Incluir
                </button>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#1C1814] border border-amber-500/25 flex flex-col justify-between hover:border-amber-400/60 transition group">
              <div class="space-y-3">
                <div class="w-full h-36 rounded-xl bg-black overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=500&q=80" alt="Vinho Tinto" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-black font-serif font-bold text-[9px] uppercase">Sommelier</span>
                </div>
                <h3 class="font-serif font-bold text-amber-100 text-sm">Taça de Pinot Noir Gran Reserva</h3>
                <p class="text-xs text-zinc-400 leading-relaxed font-sans">Vinho fino aromático, servido em taça de cristal lapidado com suporte antivibração na poltrona.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-amber-900/30 flex items-center justify-between">
                <span class="font-mono font-black text-amber-400 text-sm">R$ 36,00</span>
                <button onclick="addConcessionItem('Taça Pinot Noir Reserva', 36.00)" class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-300 text-xs font-serif font-bold border border-amber-500/40 transition">
                  + Incluir
                </button>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#1C1814] border border-amber-500/25 flex flex-col justify-between hover:border-amber-400/60 transition group">
              <div class="space-y-3">
                <div class="w-full h-36 rounded-xl bg-black overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=500&q=80" alt="Sobremesa" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-black font-serif font-bold text-[9px] uppercase">Confeitaria</span>
                </div>
                <h3 class="font-serif font-bold text-amber-100 text-sm">Pipoca Gourmet Ninho & Nutella</h3>
                <p class="text-xs text-zinc-400 leading-relaxed font-sans">Pipoca artesanal caramelizada com pó de leite ninho nobre e calda quente de avelã italiana.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-amber-900/30 flex items-center justify-between">
                <span class="font-mono font-black text-amber-400 text-sm">R$ 29,00</span>
                <button onclick="addConcessionItem('Pipoca Ninho & Nutella', 29.00)" class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-300 text-xs font-serif font-bold border border-amber-500/40 transition">
                  + Incluir
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- BOUTIQUE SALON REPERTOIRE (EDITORIAL HORIZONTAL FEATURE CARDS) -->
        <div class="space-y-6">
          <div class="border-b border-amber-900/30 pb-3">
            <span class="text-[10px] font-mono uppercase tracking-widest text-amber-400 block font-bold">SALÃO DE PROJEÇÃO</span>
            <h2 class="text-2xl font-black text-white font-serif">Obras em Cartaz nos Salões Boutique</h2>
          </div>

          <div class="space-y-4">

            <!-- Boutique Movie 1: Duna 2 -->
            <div class="p-5 rounded-2xl bg-[#1A1612] border border-amber-500/30 hover:border-amber-400/60 transition flex flex-col md:flex-row gap-6 items-center">
              <div class="w-full md:w-36 aspect-[2/3] rounded-xl overflow-hidden shrink-0 bg-black relative">
                <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80" alt="Duna 2" class="w-full h-full object-cover">
                <span class="absolute top-2 left-2 w-6 h-6 rounded bg-orange-500 text-white font-mono text-[10px] font-black flex items-center justify-center">14</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-serif text-amber-300 font-bold">Denis Villeneuve</span>
                  <span class="text-xs text-zinc-500">•</span>
                  <span class="text-xs text-zinc-400">166 min</span>
                  <span class="text-xs text-zinc-500">•</span>
                  <span class="text-xs text-amber-400 font-bold">★ 4.9 (Crítica Internacional)</span>
                </div>
                <h3 class="text-xl font-bold font-serif text-white">Duna: Parte 2</h3>
                <p class="text-xs text-zinc-300 line-clamp-2 font-sans">
                  A tragédia e glória de Arrakis em som envolvente acústico e projeção de alto contraste. Poltronas duplas com apoio de pés reclinável elétrico.
                </p>
                <div class="text-[11px] text-amber-300/80 font-serif italic">
                  Harmonização: Chá de especiarias gelado artesanal + Mini folhados de queijo de cabra.
                </div>
              </div>
              <div class="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
                <button onclick="openSeatSelection('Duna: Parte 2', '16:00', 'Salão Boutique 02', 44.00)" class="px-4 py-2 rounded-xl bg-[#241F1A] hover:bg-amber-500 hover:text-black border border-amber-500/30 text-xs font-mono font-bold text-amber-200 transition text-center">
                  16:00 • Sofá Individual (R$ 44)
                </button>
                <button onclick="openSeatSelection('Duna: Parte 2', '19:45', 'Salão Boutique 02', 48.00)" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-black transition text-center shadow-md">
                  19:45 • Sofá Duplo Gala (R$ 48)
                </button>
              </div>
            </div>

            <!-- Boutique Movie 2: Gladiador II -->
            <div class="p-5 rounded-2xl bg-[#1A1612] border border-amber-500/30 hover:border-amber-400/60 transition flex flex-col md:flex-row gap-6 items-center">
              <div class="w-full md:w-36 aspect-[2/3] rounded-xl overflow-hidden shrink-0 bg-black relative">
                <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80" alt="Gladiador II" class="w-full h-full object-cover">
                <span class="absolute top-2 left-2 w-6 h-6 rounded bg-red-600 text-white font-mono text-[10px] font-black flex items-center justify-center">16</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-serif text-amber-300 font-bold">Ridley Scott</span>
                  <span class="text-xs text-zinc-500">•</span>
                  <span class="text-xs text-zinc-400">148 min</span>
                  <span class="text-xs text-zinc-500">•</span>
                  <span class="text-xs text-amber-400 font-bold">★ 4.8 (Épico Imperial)</span>
                </div>
                <h3 class="text-xl font-bold font-serif text-white">Gladiador II</h3>
                <p class="text-xs text-zinc-300 line-clamp-2 font-sans">
                  A fúria de Roma renasce na tela de prata. Assista com o máximo conforto em nossas poltronas de veludo italiano com isolamento de vibração.
                </p>
                <div class="text-[11px] text-amber-300/80 font-serif italic">
                  Harmonização: Vinho Tinto Sangiovese + Focaccia crocante ao alecrim e azeite extravirgem.
                </div>
              </div>
              <div class="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
                <button onclick="openSeatSelection('Gladiador II', '17:00', 'Salão Boutique 01', 46.00)" class="px-4 py-2 rounded-xl bg-[#241F1A] hover:bg-amber-500 hover:text-black border border-amber-500/30 text-xs font-mono font-bold text-amber-200 transition text-center">
                  17:00 • Sofá Individual (R$ 46)
                </button>
                <button onclick="openSeatSelection('Gladiador II', '20:45', 'Salão Boutique 01', 48.00)" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-black transition text-center shadow-md">
                  20:45 • Sofá Duplo Gala (R$ 48)
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
"""

LAYOUT_CYBER_IMAX = """
      <!-- ==================================================== -->
      <!-- ARQUÉTIPO 2: CYBER IMAX MULTIPLEX (TECNOLOGIA & ESPETÁCULO) -->
      <!-- ==================================================== -->
      <div id="layout-cyber-imax" class="space-y-12 hidden">

        <!-- ULTRA-PANORAMIC 24:10 CYBER SCREEN HERO -->
        <div class="relative rounded-3xl overflow-hidden border border-cyan-500/40 bg-[#070A11] shadow-[0_0_40px_rgba(0,240,255,0.15)]">
          
          <!-- Background Scene with Cyber HUD Laser Grid Overlay -->
          <div class="relative w-full h-[380px] lg:h-[460px] overflow-hidden bg-black">
            <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=85" alt="Cena Interestelar IMAX" class="w-full h-full object-cover object-center brightness-75 scale-105">
            <div class="absolute inset-0 bg-gradient-to-t from-[#070A11] via-[#070A11]/70 to-transparent"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-[#070A11] via-[#070A11]/60 to-transparent"></div>
            
            <!-- Cyber Scanlines / HUD grid overlay -->
            <div class="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
          </div>

          <!-- Hero Content & Live Telemetry -->
          <div class="absolute inset-0 flex flex-col justify-between p-6 lg:p-10 pointer-events-none">
            
            <!-- Top HUD Bar: Live Telemetry & Next Showtime Countdown -->
            <div class="flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 font-mono text-xs text-cyan-400">
                <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span class="font-bold">STATUS DO SISTEMA:</span>
                <span class="text-white">IMAX LASER DUAL 4K CALIBRADO</span>
              </div>

              <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-950/80 backdrop-blur-md border border-red-500/50 font-mono text-xs text-red-300">
                <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>PRÓXIMA SESSÃO EM:</span>
                <span class="font-black text-white text-sm">14m 32s</span>
                <span class="text-[10px] text-red-400 uppercase tracking-widest">(ÚLTIMOS ASSENTOS)</span>
              </div>
            </div>

            <!-- Bottom Content: Massive Title, Specs & 1-Tap Turbo Action -->
            <div class="space-y-4 max-w-4xl pointer-events-auto">
              <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span class="px-2.5 py-1 rounded bg-cyan-400 text-black font-black">IMAX GT 70MM</span>
                <span class="px-2.5 py-1 rounded bg-[#0F172A] border border-cyan-500/30 text-cyan-300 font-bold">1.43:1 EXPANDIDO</span>
                <span class="px-2.5 py-1 rounded bg-[#0F172A] border border-cyan-500/30 text-zinc-300">DOLBY ATMOS 128 CANAIS</span>
                <span class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">169 MIN</span>
              </div>

              <h1 class="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase font-sans">
                INTERESTELAR <span class="text-cyan-400">//</span> 10 ANOS
              </h1>

              <!-- Live Occupancy Bar -->
              <div class="p-3 rounded-xl bg-black/70 backdrop-blur-md border border-zinc-800 space-y-1.5 max-w-xl">
                <div class="flex items-center justify-between text-xs font-mono">
                  <span class="text-zinc-400">Ocupação da Sala 01 (Sessão 19:30):</span>
                  <span class="text-cyan-400 font-black">84% LOTADO (Restam 8 poltronas no Sweet Spot)</span>
                </div>
                <div class="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-cyan-500 to-red-500 rounded-full" style="width: 84%;"></div>
                </div>
              </div>

              <!-- Quick Action Strip -->
              <div class="flex flex-wrap items-center gap-3 pt-2">
                <button onclick="openSeatSelection('Interestelar', '16:30', 'Sala 01 IMAX GT Laser', 46.00)" class="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-cyan-400 hover:text-black border border-cyan-500/40 text-cyan-300 font-mono text-xs font-black transition flex items-center gap-2 group">
                  <span>16:30</span>
                  <span class="text-[10px] bg-black/40 px-1 py-0.5 rounded text-zinc-300 group-hover:text-black">LASER 3D</span>
                </button>

                <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala 01 IMAX GT Laser', 48.00)" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-mono text-xs font-black transition flex items-center gap-2 shadow-lg shadow-cyan-500/30 hover:brightness-110 active:scale-95">
                  <i data-lucide="zap" class="w-4 h-4 text-black"></i>
                  <span>19:30 • COMPRA TURBO EXPRESS (R$ 48)</span>
                </button>

                <button onclick="openSeatSelection('Interestelar', '22:45', 'Sala 01 IMAX GT Laser', 44.00)" class="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-cyan-400 hover:text-black border border-cyan-500/40 text-cyan-300 font-mono text-xs font-black transition flex items-center gap-2 group">
                  <span>22:45</span>
                  <span class="text-[10px] bg-black/40 px-1 py-0.5 rounded text-zinc-300 group-hover:text-black">SESSÃO DA MEIA-NOITE</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        <!-- REAL-TIME ROOM TIMELINE MATRIX (AIRPORT / CGV DEPARTURE BOARD) -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span class="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest">PAINEL OPERACIONAL DE HORÁRIOS</span>
              </div>
              <h2 class="text-2xl font-black text-white font-sans uppercase tracking-tight">Grade de Salas em Tempo Real</h2>
            </div>
            <div class="text-xs font-mono text-zinc-400 flex items-center gap-3">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Disponível</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Quase Lotado</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span> Últimos Assentos</span>
            </div>
          </div>

          <!-- The Flight Board Rows -->
          <div class="space-y-3 font-mono">
            
            <!-- Room 1: IMAX GT -->
            <div class="p-4 rounded-2xl bg-[#0B1120] border border-cyan-500/30 hover:border-cyan-400/60 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div class="lg:w-80 space-y-1">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase">SALA 01</span>
                  <span class="text-xs font-bold text-white uppercase tracking-wider">IMAX DUAL LASER GT</span>
                </div>
                <div class="text-sm font-black text-cyan-200">Interestelar (10 Anos)</div>
                <div class="text-[11px] text-zinc-400">Tela de 28m x 21m • Áudio 12-Channel Imersivo</div>
              </div>

              <div class="flex-1 flex flex-wrap items-center gap-2.5">
                <button onclick="openSeatSelection('Interestelar', '13:30', 'Sala 01 IMAX GT', 46.00)" class="px-3.5 py-2 rounded-xl bg-[#141E33] hover:bg-cyan-500 hover:text-black border border-cyan-500/20 text-left transition group">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-white group-hover:text-black">13:30</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <span class="text-[9px] text-zinc-400 group-hover:text-black block">68% Livre</span>
                </button>

                <button onclick="openSeatSelection('Interestelar', '16:45', 'Sala 01 IMAX GT', 46.00)" class="px-3.5 py-2 rounded-xl bg-[#141E33] hover:bg-cyan-500 hover:text-black border border-cyan-500/20 text-left transition group">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-white group-hover:text-black">16:45</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  </div>
                  <span class="text-[9px] text-zinc-400 group-hover:text-black block">75% Ocupado</span>
                </button>

                <button onclick="openSeatSelection('Interestelar', '20:00', 'Sala 01 IMAX GT', 48.00)" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-950/80 to-[#141E33] hover:bg-cyan-500 hover:text-black border border-red-500/50 text-left transition group">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-red-300 group-hover:text-black">20:00</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  </div>
                  <span class="text-[9px] text-red-400 group-hover:text-black font-bold block">Últimos 2 lugares</span>
                </button>

                <button onclick="openSeatSelection('Interestelar', '23:15', 'Sala 01 IMAX GT', 44.00)" class="px-3.5 py-2 rounded-xl bg-[#141E33] hover:bg-cyan-500 hover:text-black border border-cyan-500/20 text-left transition group">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-white group-hover:text-black">23:15</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <span class="text-[9px] text-zinc-400 group-hover:text-black block">Meia-Noite • 40% Livre</span>
                </button>
              </div>
            </div>

            <!-- Room 2: 4DX Hydraulic -->
            <div class="p-4 rounded-2xl bg-[#0B1120] border border-cyan-500/30 hover:border-cyan-400/60 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div class="lg:w-80 space-y-1">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 text-[10px] font-black uppercase">SALA 02</span>
                  <span class="text-xs font-bold text-white uppercase tracking-wider">4DX ULTRA & MOTION</span>
                </div>
                <div class="text-sm font-black text-fuchsia-200">Gladiador II</div>
                <div class="text-[11px] text-zinc-400">Poltronas Hidráulicas • Vento, Névoa & Vibração</div>
              </div>

              <div class="flex-1 flex flex-wrap items-center gap-2.5">
                <button onclick="openSeatSelection('Gladiador II', '14:00', 'Sala 02 4DX Motion', 48.00)" class="px-3.5 py-2 rounded-xl bg-[#141E33] hover:bg-fuchsia-500 hover:text-black border border-fuchsia-500/20 text-left transition group">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-white group-hover:text-black">14:00</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <span class="text-[9px] text-zinc-400 group-hover:text-black block">4DX Dublado</span>
                </button>

                <button onclick="openSeatSelection('Gladiador II', '17:15', 'Sala 02 4DX Motion', 48.00)" class="px-3.5 py-2 rounded-xl bg-[#141E33] hover:bg-fuchsia-500 hover:text-black border border-fuchsia-500/20 text-left transition group">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-white group-hover:text-black">17:15</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  </div>
                  <span class="text-[9px] text-zinc-400 group-hover:text-black block">4DX Legendado</span>
                </button>

                <button onclick="openSeatSelection('Gladiador II', '20:30', 'Sala 02 4DX Motion', 52.00)" class="px-3.5 py-2 rounded-xl bg-[#141E33] hover:bg-fuchsia-500 hover:text-black border border-fuchsia-500/20 text-left transition group">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-white group-hover:text-black">20:30</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  </div>
                  <span class="text-[9px] text-fuchsia-300 group-hover:text-black font-bold block">90% Lotado</span>
                </button>
              </div>
            </div>

            <!-- Room 3: Dolby Cinema Atmos -->
            <div class="p-4 rounded-2xl bg-[#0B1120] border border-cyan-500/30 hover:border-cyan-400/60 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div class="lg:w-80 space-y-1">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase">SALA 03</span>
                  <span class="text-xs font-bold text-white uppercase tracking-wider">DOLBY CINEMA & VISION</span>
                </div>
                <div class="text-sm font-black text-blue-200">Duna: Parte 2</div>
                <div class="text-[11px] text-zinc-400">Contraste 1.000.000:1 • Projeção Laser Dupla</div>
              </div>

              <div class="flex-1 flex flex-wrap items-center gap-2.5">
                <button onclick="openSeatSelection('Duna: Parte 2', '15:00', 'Sala 03 Dolby Cinema', 44.00)" class="px-3.5 py-2 rounded-xl bg-[#141E33] hover:bg-blue-500 hover:text-black border border-blue-500/20 text-left transition group">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-white group-hover:text-black">15:00</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <span class="text-[9px] text-zinc-400 group-hover:text-black block">Dolby Dublado</span>
                </button>

                <button onclick="openSeatSelection('Duna: Parte 2', '18:30', 'Sala 03 Dolby Cinema', 46.00)" class="px-3.5 py-2 rounded-xl bg-[#141E33] hover:bg-blue-500 hover:text-black border border-blue-500/20 text-left transition group">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-white group-hover:text-black">18:30</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  </div>
                  <span class="text-[9px] text-zinc-400 group-hover:text-black block">Dolby Legendado</span>
                </button>

                <button onclick="openSeatSelection('Duna: Parte 2', '21:45', 'Sala 03 Dolby Cinema', 44.00)" class="px-3.5 py-2 rounded-xl bg-[#141E33] hover:bg-blue-500 hover:text-black border border-blue-500/20 text-left transition group">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-white group-hover:text-black">21:45</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <span class="text-[9px] text-zinc-400 group-hover:text-black block">Sessão Noturna</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- HIGH-TECH SNACK EXPRESS TURBO HUB -->
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-cyan-900/40 pb-3">
            <div>
              <span class="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest block">EXPRESS CONCESSION HUB</span>
              <h2 class="text-2xl font-black text-white font-sans uppercase">Combos & Concession Turbo</h2>
            </div>
            <button onclick="openConcessionDrawer()" class="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold">
              [+ ABRIR BOMBONIERE COMPLETA] ➔
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="p-4 rounded-2xl bg-[#0B1120] border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col justify-between">
              <div class="space-y-2">
                <span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">ED. COLECIONADOR</span>
                <h3 class="font-bold text-white text-sm">Balde Mega Laser Metálico + Refil</h3>
                <p class="text-xs text-zinc-400 font-sans">Balde colecionável metálico com iluminação LED na borda e refil ilimitado de pipoca.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span class="font-mono font-black text-cyan-400 text-sm">R$ 42,00</span>
                <button onclick="addConcessionItem('Balde Mega Laser Metálico', 42.00)" class="px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-mono text-xs font-black hover:bg-cyan-300 transition">
                  + 1-CLIQUE
                </button>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#0B1120] border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col justify-between">
              <div class="space-y-2">
                <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40">HOT & SPICY</span>
                <h3 class="font-bold text-white text-sm">Cyber Nachos c/ Cheddar Fluorescente</h3>
                <p class="text-xs text-zinc-400 font-sans">Tortillas crocantes servidas quentes com molho cheddar fundido e pimentas jalapeño fatiadas.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span class="font-mono font-black text-cyan-400 text-sm">R$ 34,00</span>
                <button onclick="addConcessionItem('Cyber Nachos Quentes', 34.00)" class="px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-mono text-xs font-black hover:bg-cyan-300 transition">
                  + 1-CLIQUE
                </button>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#0B1120] border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col justify-between">
              <div class="space-y-2">
                <span class="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono text-[10px] font-bold border border-fuchsia-500/40">GELADO 0°C</span>
                <h3 class="font-bold text-white text-sm">Energy Drink Neon c/ Gelo Seco</h3>
                <p class="text-xs text-zinc-400 font-sans">Bebida energética servida em copo com compartimento selado de névoa criogênica.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span class="font-mono font-black text-cyan-400 text-sm">R$ 22,00</span>
                <button onclick="addConcessionItem('Energy Drink Neon', 22.00)" class="px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-mono text-xs font-black hover:bg-cyan-300 transition">
                  + 1-CLIQUE
                </button>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#0B1120] border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col justify-between">
              <div class="space-y-2">
                <span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">DOCE CROCANTE</span>
                <h3 class="font-bold text-white text-sm">Pipoca Nitro Doce Crocante</h3>
                <p class="text-xs text-zinc-400 font-sans">Pipoca caramelizada resfriada com nitrogênio que cria crocância vítrea instantânea.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span class="font-mono font-black text-cyan-400 text-sm">R$ 30,00</span>
                <button onclick="addConcessionItem('Pipoca Nitro Doce', 30.00)" class="px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-mono text-xs font-black hover:bg-cyan-300 transition">
                  + 1-CLIQUE
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
"""

LAYOUT_CINEPHILE_MINIMAL = """
      <!-- ==================================================== -->
      <!-- ARQUÉTIPO 3: CINÉPHILE STUDIO MINIMAL (LETTERBOXD & MUBI) -->
      <!-- ==================================================== -->
      <div id="layout-cinephile-minimal" class="space-y-8 hidden">

        <!-- CURATOR'S COMPACT HEADER & GRANULAR FILTERS -->
        <div class="space-y-4 border-b border-[#2A2A2E] pb-6">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 text-xs font-mono text-[#00E054]">
                <span class="w-2 h-2 rounded-full bg-[#00E054]"></span>
                <span class="font-bold uppercase tracking-wider">PROGRAMAÇÃO OFICIAL // ARQUIVO CINEMATOGRÁFICO</span>
              </div>
              <h1 class="text-3xl sm:text-4xl font-bold text-white uppercase tracking-tight mt-1 font-sans">
                Em Cartaz Hoje nas Salas CineFood
              </h1>
              <p class="text-xs text-zinc-400 mt-1 max-w-2xl font-sans">
                Mostra permanente com projeções calibradas em padrão DCI-P3, cópias masterizadas em 4K e som imersivo sem compressão.
              </p>
            </div>

            <div class="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span class="px-2.5 py-1 rounded bg-[#1F1F23] border border-[#323238] text-white font-bold">5 Obras Ativas</span>
              <span class="px-2.5 py-1 rounded bg-[#1F1F23] border border-[#323238] text-white">4 Salas</span>
            </div>
          </div>

          <!-- Filter Rail -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button class="px-3 py-1.5 rounded-lg bg-[#00E054] text-black font-bold whitespace-nowrap shadow-sm">
              ✓ Todos os Filmes
            </button>
            <button class="px-3 py-1.5 rounded-lg bg-[#1F1F23] hover:bg-[#2A2A2E] text-zinc-300 border border-[#323238] whitespace-nowrap transition">
              ★ Top Avaliados (Letterboxd > 4.5)
            </button>
            <button class="px-3 py-1.5 rounded-lg bg-[#1F1F23] hover:bg-[#2A2A2E] text-zinc-300 border border-[#323238] whitespace-nowrap transition">
              Áudio Original Legendado
            </button>
            <button class="px-3 py-1.5 rounded-lg bg-[#1F1F23] hover:bg-[#2A2A2E] text-zinc-300 border border-[#323238] whitespace-nowrap transition">
              Ficção Científica
            </button>
            <button class="px-3 py-1.5 rounded-lg bg-[#1F1F23] hover:bg-[#2A2A2E] text-zinc-300 border border-[#323238] whitespace-nowrap transition">
              Salas c/ Mesa Bistrô
            </button>
          </div>
        </div>

        <!-- FEATURED COMPACT BANNER (16:5 CINÉPHILE STRIP) -->
        <div class="p-5 rounded-2xl bg-[#18181C] border border-[#2A2A2E] flex flex-col md:flex-row gap-5 items-center">
          <div class="w-24 sm:w-28 aspect-[2/3] rounded-lg overflow-hidden shrink-0 bg-black relative border border-white/10">
            <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80" alt="Interestelar" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-[#00E054]/20 text-[#00E054] font-mono text-[11px] font-bold border border-[#00E054]/40">
                ★ 4.9 Letterboxd
              </span>
              <span class="text-xs text-zinc-400 font-mono">169 min • 2014 • Dir. Christopher Nolan</span>
              <span class="w-5 h-5 rounded bg-amber-500 text-black font-black text-[10px] flex items-center justify-center font-mono">12</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">Interestelar (Edição Retrospectiva 10 Anos)</h2>
            <p class="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-sans">
              Com as reservas naturais da Terra se esgotando, um grupo de astronautas liderado por Cooper viaja através de um buraco de minhoca em busca de um novo lar para a humanidade.
            </p>
          </div>
          <div class="w-full md:w-auto shrink-0 flex flex-wrap md:flex-col gap-2">
            <button onclick="openSeatSelection('Interestelar', '16:30', 'Sala 01 Studio', 38.00)" class="px-3.5 py-1.5 rounded-lg bg-[#242429] hover:bg-[#00E054] hover:text-black border border-[#323238] font-mono text-xs font-bold text-white transition text-center">
              16:30 (LEG) • R$ 38
            </button>
            <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala 01 Studio', 42.00)" class="px-3.5 py-1.5 rounded-lg bg-[#00E054] hover:bg-emerald-400 text-black font-mono text-xs font-black transition text-center shadow-sm">
              19:30 (VIP LEG) • R$ 42
            </button>
            <button onclick="openSeatSelection('Interestelar', '22:15', 'Sala 01 Studio', 38.00)" class="px-3.5 py-1.5 rounded-lg bg-[#242429] hover:bg-[#00E054] hover:text-black border border-[#323238] font-mono text-xs font-bold text-white transition text-center">
              22:15 (LEG) • R$ 38
            </button>
          </div>
        </div>

        <!-- ULTRA-DENSE 5-COLUMN POSTER-FIRST CATALOG GRID -->
        <div class="space-y-4">
          <h2 class="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
            Catálogo Completo em Cartaz (5 Obras Selecionadas):
          </h2>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            
            <!-- Poster 1: Interestelar -->
            <div class="bg-[#18181C] border border-[#2A2A2E] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#00E054]/60 transition group">
              <div>
                <div class="aspect-[2/3] relative overflow-hidden bg-black">
                  <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80" alt="Interestelar" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 w-6 h-6 rounded bg-amber-500 text-black font-mono font-black text-[10px] flex items-center justify-center">12</span>
                  <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[#00E054] font-mono font-bold text-[10px]">★ 4.9</span>
                </div>
                <div class="p-3 space-y-1">
                  <h3 class="font-bold text-white text-xs leading-tight line-clamp-1 group-hover:text-[#00E054] transition">Interestelar (10 Anos)</h3>
                  <p class="text-[10px] text-zinc-400 font-mono">169m • Christopher Nolan</p>
                </div>
              </div>
              <div class="p-3 pt-0 space-y-1 font-mono">
                <button onclick="openSeatSelection('Interestelar', '16:30', 'Sala 01 Studio', 38.00)" class="w-full py-1 px-2 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold text-center block transition">
                  16:30 • LEG
                </button>
                <button onclick="openSeatSelection('Interestelar', '19:30', 'Sala 01 Studio', 42.00)" class="w-full py-1 px-2 rounded bg-[#00E054]/20 hover:bg-[#00E054] hover:text-black text-[#00E054] text-[11px] font-bold text-center block border border-[#00E054]/30 transition">
                  19:30 • VIP LEG
                </button>
              </div>
            </div>

            <!-- Poster 2: Duna 2 -->
            <div class="bg-[#18181C] border border-[#2A2A2E] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#00E054]/60 transition group">
              <div>
                <div class="aspect-[2/3] relative overflow-hidden bg-black">
                  <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80" alt="Duna 2" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 w-6 h-6 rounded bg-orange-500 text-white font-mono font-black text-[10px] flex items-center justify-center">14</span>
                  <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[#00E054] font-mono font-bold text-[10px]">★ 4.9</span>
                </div>
                <div class="p-3 space-y-1">
                  <h3 class="font-bold text-white text-xs leading-tight line-clamp-1 group-hover:text-[#00E054] transition">Duna: Parte 2</h3>
                  <p class="text-[10px] text-zinc-400 font-mono">166m • Denis Villeneuve</p>
                </div>
              </div>
              <div class="p-3 pt-0 space-y-1 font-mono">
                <button onclick="openSeatSelection('Duna: Parte 2', '16:00', 'Sala 02 Studio', 40.00)" class="w-full py-1 px-2 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold text-center block transition">
                  16:00 • DUB
                </button>
                <button onclick="openSeatSelection('Duna: Parte 2', '19:45', 'Sala 02 Studio', 44.00)" class="w-full py-1 px-2 rounded bg-[#00E054]/20 hover:bg-[#00E054] hover:text-black text-[#00E054] text-[11px] font-bold text-center block border border-[#00E054]/30 transition">
                  19:45 • VIP LEG
                </button>
              </div>
            </div>

            <!-- Poster 3: Coringa 2 -->
            <div class="bg-[#18181C] border border-[#2A2A2E] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#00E054]/60 transition group">
              <div>
                <div class="aspect-[2/3] relative overflow-hidden bg-black">
                  <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80" alt="Coringa 2" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 w-6 h-6 rounded bg-red-600 text-white font-mono font-black text-[10px] flex items-center justify-center">16</span>
                  <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[#00E054] font-mono font-bold text-[10px]">★ 4.6</span>
                </div>
                <div class="p-3 space-y-1">
                  <h3 class="font-bold text-white text-xs leading-tight line-clamp-1 group-hover:text-[#00E054] transition">Coringa: Delírio a Dois</h3>
                  <p class="text-[10px] text-zinc-400 font-mono">138m • Todd Phillips</p>
                </div>
              </div>
              <div class="p-3 pt-0 space-y-1 font-mono">
                <button onclick="openSeatSelection('Coringa: Delírio a Dois', '18:15', 'Sala 03 Studio', 38.00)" class="w-full py-1 px-2 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold text-center block transition">
                  18:15 • LEG
                </button>
                <button onclick="openSeatSelection('Coringa: Delírio a Dois', '21:15', 'Sala 03 Studio', 38.00)" class="w-full py-1 px-2 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold text-center block transition">
                  21:15 • LEG
                </button>
              </div>
            </div>

            <!-- Poster 4: Gladiador II -->
            <div class="bg-[#18181C] border border-[#2A2A2E] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#00E054]/60 transition group">
              <div>
                <div class="aspect-[2/3] relative overflow-hidden bg-black">
                  <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80" alt="Gladiador II" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 w-6 h-6 rounded bg-red-600 text-white font-mono font-black text-[10px] flex items-center justify-center">16</span>
                  <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[#00E054] font-mono font-bold text-[10px]">★ 4.8</span>
                </div>
                <div class="p-3 space-y-1">
                  <h3 class="font-bold text-white text-xs leading-tight line-clamp-1 group-hover:text-[#00E054] transition">Gladiador II</h3>
                  <p class="text-[10px] text-zinc-400 font-mono">148m • Ridley Scott</p>
                </div>
              </div>
              <div class="p-3 pt-0 space-y-1 font-mono">
                <button onclick="openSeatSelection('Gladiador II', '17:00', 'Sala 01 Studio', 42.00)" class="w-full py-1 px-2 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold text-center block transition">
                  17:00 • LEG
                </button>
                <button onclick="openSeatSelection('Gladiador II', '20:45', 'Sala 01 Studio', 44.00)" class="w-full py-1 px-2 rounded bg-[#00E054]/20 hover:bg-[#00E054] hover:text-black text-[#00E054] text-[11px] font-bold text-center block border border-[#00E054]/30 transition">
                  20:45 • VIP LEG
                </button>
              </div>
            </div>

            <!-- Poster 5: Robô Selvagem -->
            <div class="bg-[#18181C] border border-[#2A2A2E] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#00E054]/60 transition group">
              <div>
                <div class="aspect-[2/3] relative overflow-hidden bg-black">
                  <img src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=500&q=80" alt="Robô Selvagem" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                  <span class="absolute top-2 left-2 w-6 h-6 rounded bg-emerald-600 text-white font-mono font-black text-[10px] flex items-center justify-center">L</span>
                  <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[#00E054] font-mono font-bold text-[10px]">★ 4.9</span>
                </div>
                <div class="p-3 space-y-1">
                  <h3 class="font-bold text-white text-xs leading-tight line-clamp-1 group-hover:text-[#00E054] transition">Robô Selvagem</h3>
                  <p class="text-[10px] text-zinc-400 font-mono">102m • Chris Sanders</p>
                </div>
              </div>
              <div class="p-3 pt-0 space-y-1 font-mono">
                <button onclick="openSeatSelection('Robô Selvagem', '14:30', 'Sala 04 Studio', 32.00)" class="w-full py-1 px-2 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold text-center block transition">
                  14:30 • 2D DUB
                </button>
                <button onclick="openSeatSelection('Robô Selvagem', '17:10', 'Sala 04 Studio', 34.00)" class="w-full py-1 px-2 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold text-center block transition">
                  17:10 • 3D DUB
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- MONOSPACE BOMBONIERE PRICING TABLE -->
        <div class="p-5 rounded-2xl bg-[#18181C] border border-[#2A2A2E] space-y-4">
          <div class="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-widest text-[#00E054] font-bold">BOMBONIERE TRADICIONAL</span>
              <h2 class="text-lg font-bold text-white uppercase font-mono">Cardápio & Concessões de Cinema</h2>
            </div>
            <button onclick="openConcessionDrawer()" class="text-xs font-mono text-[#00E054] hover:underline font-bold">
              [+ Cardápio Completo]
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 font-mono text-xs">
            
            <div class="flex items-center justify-between py-2 border-b border-[#25252A]">
              <div>
                <span class="text-white font-bold">Pipoca Salgada de Cinema (Balde Médio)</span>
                <span class="text-zinc-400 text-[10px] block">Manteiga pura de cinema com flor de sal</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-[#00E054] font-bold">R$ 22,00</span>
                <button onclick="addConcessionItem('Pipoca Salgada M', 22.00)" class="px-2.5 py-1 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold transition">
                  + Pedir
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between py-2 border-b border-[#25252A]">
              <div>
                <span class="text-white font-bold">Pipoca Doce Caramelizada (Balde Médio)</span>
                <span class="text-zinc-400 text-[10px] block">Açúcar mascavo e raspas de fava de baunilha</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-[#00E054] font-bold">R$ 26,00</span>
                <button onclick="addConcessionItem('Pipoca Doce Caramelizada', 26.00)" class="px-2.5 py-1 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold transition">
                  + Pedir
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between py-2 border-b border-[#25252A]">
              <div>
                <span class="text-white font-bold">Refrigerante 500ml (Copo Sustentável)</span>
                <span class="text-zinc-400 text-[10px] block">Coca-Cola, Guaraná Antarctica ou Zero</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-[#00E054] font-bold">R$ 16,00</span>
                <button onclick="addConcessionItem('Refrigerante 500ml', 16.00)" class="px-2.5 py-1 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold transition">
                  + Pedir
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between py-2 border-b border-[#25252A]">
              <div>
                <span class="text-white font-bold">Café Espresso Especial (Grão Arábica)</span>
                <span class="text-zinc-400 text-[10px] block">Extração fresca servida em xícara térmica</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-[#00E054] font-bold">R$ 12,00</span>
                <button onclick="addConcessionItem('Café Espresso Especial', 12.00)" class="px-2.5 py-1 rounded bg-[#242429] hover:bg-[#00E054] hover:text-black text-white text-[11px] font-bold transition">
                  + Pedir
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
"""

def main():
    target_path = os.path.abspath('cinefood/docs/prototipo/index.html')
    with open(target_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Locate view-catalog-movie
    pattern = re.compile(r'<section id="view-catalog-movie"[^>]*>.*?</section>', re.DOTALL)
    match = pattern.search(html)
    if not match:
        print("ERROR: Could not find <section id='view-catalog-movie'>")
        return

    combined_layouts = f"""<section id="view-catalog-movie">\n{LAYOUT_BOUTIQUE_GOLD}\n{LAYOUT_CYBER_IMAX}\n{LAYOUT_CINEPHILE_MINIMAL}\n    </section>"""
    html = html[:match.start()] + combined_layouts + html[match.end():]

    # Now update setArchetype function to show/hide the corresponding layout
    old_set_archetype = """    function setArchetype(arch) {
      document.body.setAttribute('data-archetype', arch);
      localStorage.setItem('cinefood-archetype', arch);

      const btnBoutique = document.getElementById('btn-arch-boutique');
      const btnCyber = document.getElementById('btn-arch-cyber');
      const btnCinephile = document.getElementById('btn-arch-cinephile');

      if (!btnBoutique || !btnCyber || !btnCinephile) return;

      [btnBoutique, btnCyber, btnCinephile].forEach(b => {
        b.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white';
      });

      if (arch === 'boutique-gold') {
        btnBoutique.className = 'px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-amber-500 text-black shadow-sm';
      } else if (arch === 'cyber-imax') {
        btnCyber.className = 'px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-cyan-400 text-black shadow-sm';
      } else {
        btnCinephile.className = 'px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-emerald-500 text-black shadow-sm';
      }
    }"""

    new_set_archetype = """    function setArchetype(arch) {
      document.body.setAttribute('data-archetype', arch);
      localStorage.setItem('cinefood-archetype', arch);

      const lBoutique = document.getElementById('layout-boutique-gold');
      const lCyber = document.getElementById('layout-cyber-imax');
      const lCinephile = document.getElementById('layout-cinephile-minimal');

      if (lBoutique && lCyber && lCinephile) {
        lBoutique.classList.toggle('hidden', arch !== 'boutique-gold');
        lCyber.classList.toggle('hidden', arch !== 'cyber-imax');
        lCinephile.classList.toggle('hidden', arch !== 'cinephile-minimal');
      }

      const btnBoutique = document.getElementById('btn-arch-boutique');
      const btnCyber = document.getElementById('btn-arch-cyber');
      const btnCinephile = document.getElementById('btn-arch-cinephile');

      if (btnBoutique && btnCyber && btnCinephile) {
        [btnBoutique, btnCyber, btnCinephile].forEach(b => {
          b.className = 'px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-400 hover:text-white';
        });

        if (arch === 'boutique-gold') {
          btnBoutique.className = 'px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-amber-500 text-black shadow-sm';
        } else if (arch === 'cyber-imax') {
          btnCyber.className = 'px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-cyan-400 text-black shadow-sm';
        } else {
          btnCinephile.className = 'px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 bg-[#00E054] text-black shadow-sm';
        }
      }

      if (window.lucide) {
        lucide.createIcons();
      }
    }"""

    if old_set_archetype in html:
        html = html.replace(old_set_archetype, new_set_archetype)
        print("Updated setArchetype successfully!")
    else:
        print("WARNING: Could not find exact old setArchetype string, doing regex replacement...")
        pattern_func = re.compile(r'function setArchetype\(arch\)\s*\{.*?\}\n\n\s*function switchView', re.DOTALL)
        html = pattern_func.sub(new_set_archetype + "\n\n    function switchView", html)

    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print("SUCCESS: cinefood/docs/prototipo/index.html updated with 3 distinct layouts!")

if __name__ == '__main__':
    main()
