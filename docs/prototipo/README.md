# Protótipo Oficial de UI/UX — CineFood (MAR-01)

Este documento registra o primeiro protótipo visual e interativo do **CineFood** para atendimento à **[Issue #7](https://github.com/Cavaleiros-da-Tela-Azul/cinefood/issues/7)** (`[MAR-01][UI/UX] Definição de Identidade Visual Dark-First, Design Tokens e Protótipos Figma (WCAG 2.2 AA)`).

---

## 🎨 Acesso ao Arquivo no Figma

- **Arquivo Oficial no Figma:** [CineFood - Design System & MVP](https://www.figma.com/design/4BTQA3NO0k6yi4659FHdVJ)
- **Layer Interativo (Figma Make / Code Layer):** [Visualizar Camada de Código Interativa](https://www.figma.com/design/4BTQA3NO0k6yi4659FHdVJ?node-id=2-3&autoplay-code-preview=2-3)
- **Equipe:** `Grupo 07` (Admin: Gabriel Alves Martins)
- **Node ID:** `2:3` (Dimensões: `1512 x 982`)

---

## 🛠️ Conteúdo Implementado no Protótipo

1. **Aba 1: Catálogo de Filmes & Sessões (`RF-02`):**
   - Hero Banner em destaque (*Interestelar* com sinopse e formatos IMAX/Atmos).
   - Filtros de formato e data.
   - Cards de filmes com pôster, classificação indicativa, duração, avaliações e botões de horários de sessão interativos.
2. **Aba 2: Mapa de Assentos & Trava de 10 min (`RF-02` / `RF-03` / `ADR-002`):**
   - Curva da tela de cinema com efeito de iluminação (*screen glow*).
   - Grid completo de poltronas (Fileiras A a J, 12 colunas) com corredor central e poltronas PCD (A1, A2, A11, A12).
   - **Cronômetro regressivo de 10 minutos** em tempo real com alerta visual de urgência.
   - Legenda acessível multimodal (cor + ícone + texto):
     - `DISPONIVEL` (Borda cinza, número legível)
     - `SELECIONADO` (Ouro âmbar, ícone de check)
     - `RESERVADO` (Vinho, ícone de cadeado)
     - `OCUPADO` (Cinza escuro, ícone X)
     - `PCD / ACESSÍVEL` (Azul acessível, ícone cadeirante)
   - Barra de ação inferior dinâmica com cálculo automático de valor e poltronas selecionadas.
3. **Aba 3: Design Tokens & Matriz WCAG 2.2 AA (`RNF-04`):**
   - Superfícies Dark-First (`#0A0B10`, `#13151F`).
   - Cores primárias de alto contraste (`#F5A623`, `#E50914`).
   - Tabela de razões de contraste comprovando conformidade WCAG 2.2 Nível AA e AAA.
4. **Modal de Transparência e LGPD (`RF-17`):**
   - Finalidades explícitas de tratamento e base legal.
   - Toggle de consentimento facultativo para comunicações promocionais com persistência sem travar a compra.

---

## 💻 Código Fonte Local do Protótipo

O código estático interativo está versionado em:
- [index.html](file:///c:/Users/gabri/OneDrive/Desktop/MVP-Cinefood/cinefood/docs/prototipo/index.html)
