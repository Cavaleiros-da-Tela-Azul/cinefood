# Design System — CineFood

<!-- impeccable:design-schema 1 -->

## Direção Visual

Estética **Dark-First Cinematográfica** que une três registros complementares em uma jornada única:
1. **Descoberta Imersiva (Home Hero):** Carrossel em tela cheia com expansão fluida *card-to-hero* (`layoutId`), barra de progresso superior âmbar (`#F59E0B`), tipografia display condensada (`Barlow Condensed`) e deck de pôsteres verticais.
2. **Detalhe Editorial (Filme & Sessões):** Composição aberta sobre *still* cinematográfico com vinheta profunda, coluna lateral direita de ficha técnica (`Estreia`, `Direção`, `Trilha`, `Gênero`, `Trailer`) e pílulas de horário com micro-barra de ocupação.
3. **Precisão Transacional (Assentos, Cantina e Ingresso):** Header sobre o backdrop do filme, pôster ancorado à esquerda, stepper de 4 etapas, mapa de assentos com tela angulada e *screen glow*, seleção em Vermelho Cinema (`#E50914`), PCD em Azul (`#2563EB`) e modo opcional **Sala Escura OLED (`#000000`)**.

## Tokens de Cor

- **Superfícies:** `--bg-base: #0D0E12` (`#000000` no modo OLED), `--bg-elevated: #15171E`, `--bg-surface: #1B1E28`
- **Ação Principal / Seleção:** `--brand-red: #C40A14` (hover `#DC111D`, contraste ≥ 5.5:1 com `#FFFFFF` para WCAG 2.2 AA)
- **Progresso / Trava de Tempo:** `--amber-progress: #F59E0B`
- **Acessibilidade PCD:** `--pcd-blue: #2563EB`
- **Anel de Foco (WCAG 2.2 AA):** `--focus-ring: #60A5FA`
- **Estados de Poltrona (Codificação Tripla: cor + forma + ícone):**
  - `DISPONIVEL`: `#4B5263` (borda sutil, número legível)
  - `SELECIONADO`: `#C40A14` (ícone check; poltronas PCD mantêm anel azul `#2563EB`)
  - `RESERVADO`: `#581C28` (ícone cadeado)
  - `OCUPADO`: `#1F232E` (ícone `✕`, `disabled`)
  - `PCD_CADEIRANTE` / `PCD_OBESO`: `#2563EB` (ícone cadeira de rodas / `1.5×`)

## Tipografia

- **Display / Títulos:** `Barlow Condensed` (700/800, tracking `-0.02em`, uppercase em títulos de sessão e hero)
- **Interface & Corpo:** `Archivo` (400/500/600/700, mínimo `11px` funcional e `16px` em inputs mobile)
- **Dados Tabulares (Preços, Horários, Cronômetro 10m):** `JetBrains Mono` com `font-variant-numeric: tabular-nums`

## Coreografia & Movimento

- **Transição Assinatura (Home Hero):** Um único gesto coordenado — expansão compartilhada do card frontal do deck para o backdrop em tela cheia com `cubic-bezier(0.16, 1, 0.3, 1)`, enquanto o texto entra com escalonamento curto e não bloqueante.
- **Gestos (Cantina Dine-In):** Painel/bottom-sheet com rastreamento 1:1 (`drag="y"`, `dragElastic={0.2}`) e fechamento por distância ou velocidade.
- **Respeito a `prefers-reduced-motion`:** Todas as transições são reduzidas instantaneamente quando ativo.
