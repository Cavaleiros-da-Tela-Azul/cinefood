# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript + Tailwind CSS v4 + Motion (`motion/react`) + Lucide Icons in `cinefood/web/`, verified with Playwright.

## Users

- **Cliente (Espectador):** Compra ingressos antecipados, escolhe poltronas numeradas em mapa interativo, pede combos da bomboniere para entrega no assento ou retirada no balcão, apresenta QR Code na portaria e usa a interface dentro da sala escura sem ofuscamento.
- **Operadores & Gestão (fases seguintes):** Portaria (validação atômica de QR), Bilheteria (venda assistida), Cantina/KDS, Runner e Admin.

## Product Purpose

Unificar compra de ingressos de cinema e pedidos de bomboniere em uma jornada única, eliminando filas duplicadas e conectando reserva de assento, entrada na portaria e preparo/entrega na poltrona.

## Positioning

Diferente de bilheterias genéricas separadas da cantina, o CineFood vincula a poltrona reservada (com trava de 10 minutos) diretamente ao pedido da bomboniere — disparando o preparo para entrega no assento apenas após a validação física do QR Code na portaria — com modo Sala Escura OLED (`#000000`) para uso dentro da sala sem incômodo visual.

## Operating Context

- Uso híbrido: desktop para escolha detalhada de filmes/sessões/assentos e smartphone em movimento no cinema, inclusive em ambiente de sala escura.
- Restrição de ambiente não homologado: pagamentos operam estritamente em modo Sandbox (`RST-03`) com dados ilustrativos de demonstração.

## Capabilities and Constraints

- Catálogo por filme e por complexo com faixa de datas e formatos (`IMAX 3D`, `Dolby Atmos`, `2D`) e indicador de ocupação por sessão.
- Detalhes editoriais do filme com ficha técnica e modal de trailer.
- Mapa interativo de assentos (fileiras A–J) com trava regressiva de 10 minutos, seleção de categoria (`Inteira` / `Meia-Entrada` Lei 12.933/2013) e poltronas PCD (Cadeirante e Obeso 1.5×).
- Cantina Dine-In com opção explícita de pular alimentação, escolha entre entrega no assento (condicionada à validação na portaria — `RST-04`) ou retirada no balcão.
- Checkout Sandbox (`Pix` / `Cartão`) e Ingresso Digital com QR Code opaco simulado.
- Modo Sala Escura OLED (`#000000`) alternável a qualquer momento.

## Brand Commitments

- Nome: **CineFood** (Organização Cavaleiros da Tela Azul).
- Identidade visual Dark-First inspirada nas referências fornecidas pelo usuário: Hero carrossel com expansão fluida *card-to-hero* (Ref 3 + vídeo), detalhe editorial imersivo (Ref 2) e mapa de assentos escuro com destaque vermelho cinema `#E50914` (Ref 1), aliado a `#F59E0B` (barra de progresso/alertas), `#2563EB` (PCD) e `#60A5FA` (anel de foco).

## Evidence on Hand

- Especificação de produto: `ai-memory/projects/cinefood/PROD-001-cinefood.md`
- Protótipo de referência anterior: `cinefood/docs/prototipo/README.md` e `cinefood/docs/prototipo/index.html`
- Imagens e vídeo de referência fornecidos pelo usuário na sessão.
- **Lacunas declaradas:** API HTTP do monólito modular (`cinefood/src/modules/`) ainda sem servidor de borda conectado; dados de catálogo, sessões, combos e QR Code neste protótipo são demonstrativos locais.

## Product Principles

1. **Imersão cinematográfica com clareza operacional:** Impacto visual de cinema no catálogo/detalhes e precisão absoluta no mapa de assentos, preços e cronômetro.
2. **Fluxo sem atrito entre ingresso e cantina:** Encadear a bomboniere após a seleção de poltronas sem bloquear quem só quer o ingresso.
3. **Conforto visual na sala escura:** Dark-First por padrão com opção OLED puro (`#000000`) sem elementos ofuscantes.
4. **Acessibilidade e verdade transacional:** Codificação multimodal (cor + forma + ícone) em poltronas e aviso transparente de modo Sandbox.

## Accessibility & Inclusion

- Conformidade com **WCAG 2.2 Nível AA**: contraste mínimo `4.5:1` para texto e `3:1` para componentes/estados gráficos, foco visível `#60A5FA`, navegação completa por teclado, suporte a `prefers-reduced-motion`, alvos de toque ≥ 44px em mobile e poltronas PCD claramente diferenciadas.
