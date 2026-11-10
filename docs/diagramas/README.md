# Diagramas de Arquitetura e Modelagem UML — CineFood

Este diretório reúne os **3 diagramas oficiais de Engenharia de Software** do projeto **CineFood** (*Cavaleiros da Tela Azul*), modelados e validados a partir do [Manual de Processos do CineFood v2.1](../Manual_de_Processos_CineFood_v2.1.pdf) e das especificações do repositório (`openspec/`).

---

## Arquivos Disponíveis

| Arquivo | Tipo UML / Archify | Descrição Resumida |
| :--- | :--- | :--- |
| [`diagrama-classes.html`](./diagrama-classes.html) | **Diagrama de Classes (`class`)** | Modelo estrutural completo com **12 classes/enums** distribuídos em 4 camadas, visibilidade UML (`+`/`-`), multiplicidades exatas (`1`, `1..*`, `0..*`, `0..1`) e métodos operacionais de todos os 6 papéis do sistema. |
| [`diagrama-atividades.html`](./diagrama-atividades.html) | **Diagrama de Atividades (`workflow`)** | Fluxo comportamental ponta a ponta com **5 raias (swimlanes)**, **17 nós** e **6 nós de decisão UML (`◊`)** cobrindo compra, desistência/abandono, estorno CDC, só assistir vs. cantina (antes ou durante a sessão), balcão vs. sala, portaria, fallback do Runner e avaliação pós-sessão. |
| [`diagrama-sequencial.html`](./diagrama-sequencial.html) | **Diagrama de Sequência (`sequence`)** | Interação cronológica entre **6 linhas de vida (lifelines)**, dividida em **4 fases (`segments`)** e **20 mensagens numeradas (`1..20`)** com fragmentos UML (`[alt]`, `[opt]`, `[par]`), contratos REST da Seção 5.2.2 e invocação direta dos métodos do Diagrama de Classes. |
| [`../Manual_de_Processos_CineFood_v2.1.pdf`](../Manual_de_Processos_CineFood_v2.1.pdf) | **Documento Base (PDF)** | Manual de Processos do CineFood Revisado (com requisitos funcionais, não funcionais, regras de negócio, ADRs, contratos de API e parecer de engenharia). |

> **Como visualizar:** Todos os arquivos `.html` são **100% autocontidos (standalone)** e funcionam offline. Basta dar duplo clique no arquivo ou executar no terminal:
> ```bash
> firefox docs/diagramas/diagrama-classes.html \
>         docs/diagramas/diagrama-atividades.html \
>         docs/diagramas/diagrama-sequencial.html &
> ```

---

## 1. Critérios do Projeto Atendidos na Modelagem

Os três diagramas foram construídos garantindo rastreabilidade direta com os artefatos normativos do manual:

- **Requisitos Funcionais (`RF-01` a `RF-20`):** Autenticação e RBAC (`RF-01`), catálogo de sessões (`RF-02`), trava de assento de 10 min (`RF-03`), pagamento e confirmação (`RF-04`), QR Code individual por assento (`RF-05`), validação de leitura única na portaria (`RF-06`), cardápio e estoque da cantina (`RF-07`/`RF-08`), fluxo KDS e entrega na poltrona pelo Runner (`RF-09`), histórico do cliente (`RF-10`), administração de sessões/cardápio (`RF-11`), cancelamento e estorno CDC art. 49 (`RF-12`), avaliação privada pós-sessão 1..5 (`RF-13`), venda assistida na bilheteria compartilhando o mesmo mapa de assentos (`RF-14`), painel gerencial de ocupação e vendas (`RF-15`), cálculo server-side de meia-entrada (`RF-16`), transparência LGPD (`RF-17`), protocolo do titular LGPD (`RF-18`), trilha de auditoria (`RF-19`) e conversão de entrega na sala para balcão em caso de ausência > 2 min (`RF-20`).
- **Regras de Negócio (`RN-01` a `RN-04`):**
  - **`RN-01`:** Reserva temporária de 10 minutos; se o Pix compensar após a expiração e o assento não estiver mais disponível, registra estorno/reembolso automático sem emitir ingresso.
  - **`RN-02`:** 1 QR Code único por assento reservado, consumido em leitura única na portaria (`EMITIDO -> UTILIZADO`).
  - **`RN-03`:** Pedidos na modalidade `ENTREGA_ASSENTO` exigem ingresso pago, não cancelado e **entrada validada na portaria** antes do preparo/despacho para a sala.
  - **`RN-04`:** Checkouts independentes entre Ingresso e Cantina (falha ou cancelamento na cantina não cancela o ingresso).
- **Decisões Arquiteturais (`ADR-001` a `ADR-005`) e Restrições (`RST-01` a `RST-06`):** Monólito modular + PostgreSQL (`ADR-001`), trava condicional no banco (`ADR-002`), chamada ao gateway fora da transação e confirmação via webhook autenticado (`ADR-003`), QR Code com token opaco/assinado (`ADR-004`), checkouts desacoplados (`ADR-005`), preços sempre em centavos calculados no servidor (`RNF-03`/`CA-F07`) e trava da cozinha vinculada à portaria (`RST-04`).

---

## 2. Explicação Detalhada dos 3 Diagramas

### 2.1. Diagrama de Classes (`diagrama-classes.html`)

O Diagrama de Classes modela a estrutura estática do domínio em **12 classes/enums independentes**, organizados em uma grade de **4 camadas por 3 colunas** para evitar classes monolíticas e deixar explícita a responsabilidade de cada entidade:

1. **Camada 1 — Segurança (RBAC) e Catálogo Físico do Cinema:**
   - **`Papel (EnumPapel)` (`<<enumeration>>`):** Lista explicitamente os 6 perfis de acesso do manual (`CLIENTE`, `ATENDENTE_BILHETERIA`, `PORTARIA`, `ATENDENTE_CANTINA`, `RUNNER`, `ADMINISTRADOR`) e a operação `verificarPermissaoRBAC(papel, rota)`.
   - **`Filme`:** Representa a obra cinematográfica (`id`, `titulo`, `classificacaoIndicativa`, `duracaoMinutos`, `genero`, `ativo`) e a operação administrativa `cadastrarFilme()`. Uma instância de `Filme` é exibida em `1..*` sessões.
   - **`SalaCinema`:** Representa o espaço físico de exibição (`id`, `nomeSala`, `capacidadeTotal`, `layoutFileiras`, `ativa`) e os métodos `configurarMapaPoltronas()` e `ValidarCapacidade()`. Uma `SalaCinema` sedia `1..*` sessões.
2. **Camada 2 — Identidade/LGPD e Mapa Concorrente da Sessão:**
   - **`Usuario`:** Entidade de identidade autenticada (`id`, `nome`, `email`, `senhaHash`, `papel`, `aceiteLgpdEm`) que concentra tanto a autoatuação do cliente quanto a identificação do operador (`STAFF-*`) em ações auditadas (`autenticar()`, `registrarAceiteLgpd()`, `solicitarDireitoTitular()`, `consultarPainelOcupacao()`).
   - **`Sessao`:** Conecta `Filme` e `SalaCinema` num horário específico (`horarioExibicao`, `precoBaseCentavos`, `statusSessao`, `taxaOcupacaoPct`), expondo `programarSessao()` e `calcularTaxaOcupacao()` (`RF-15`). Compõe `1..*` instâncias de `AssentoSessao`.
   - **`AssentoSessao`:** Representa cada poltrona individual naquela sessão (`codigoAssento` ex.: `F8`, `status: LIVRE | RESERVADO | OCUPADO`, `reservadoAte`, `versaoLock`). Implementa a trava otimista/condicional de 10 minutos (`reservarTemporariamente(10m)`, `confirmarOcupacao()`, `liberarReserva()`) compartilhada entre Web/App e Bilheteria (`RF-03`/`RF-14`).
3. **Camada 3 — Faturamento de Ingressos e Acesso Físico (Portaria):**
   - **`Compra`:** Cabeçalho transacional da compra de ingressos (`canalVenda: ONLINE | BILHETERIA`, `tipoTarifa: INTEIRA | MEIA`, `valorTotalCentavos`, `statusCompra`), com cálculo server-side (`calcularTarifaServidor()`, `registrarVendaAssistida()`, `emitirIngressoQr()`, `solicitarEstornoCDC()`).
   - **`Pagamento`:** Transação financeira associada (`1` para `1` com `Compra` ou `0..1` com `PedidoCantina`), contendo `idempotencyKey`, `gatewayRef`, `metodo: PIX | CARTAO` e `status: PENDENTE | APROVADO | ESTORNADO` (`processarWebhook()`, `estornarIdempotente()`).
   - **`Ingresso`:** Credencial individual gerada para cada `AssentoSessao` pago (`qrTokenOpaco`, `assinaturaHmac`, `status: EMITIDO | UTILIZADO | CANCELADO`, `validadoPorId`, `utilizadoEm`), expondo `validarQrCodePortaria(token, opId)` e `invalidarPorEstorno()`.
4. **Camada 4 — Alimentação (Cantina KDS / Runner) e Pós-Sessão:**
   - **`Produto`:** Item do cardápio da cantina (`nome`, `categoria`, `precoCentavos`, `estoqueDisponivel`, `ativo`) com controle atômico de estoque (`gerenciarCardapio()`, `reservarEstoque(qtd)`, `baixarEstoque()`, `reporEstoque()`).
   - **`PedidoCantina (Opcional 0..*)`:** Pedido independente (`ADR-005`) que referencia `1..*` `Produto`s e `0..1` `Ingresso` (`modalidade: BALCAO | ENTREGA_ASSENTO`, `statusKds: RECEBIDO | AGUARDANDO_CHEGADA | EM_PREPARO | PRONTO | ENTREGUE`, `runnerId`). Expõe os métodos operacionais da cozinha e do Runner: `podeEntregarNoAssento()`, `avancarPreparoKDS()`, `confirmarEntregaAssento()` e `converterParaBalcao()`.
   - **`AvaliacaoSessao`:** Avaliação privada pós-sessão (`notaEstrelas: 1..5`, `comentarioPrivado`, `criadaEm`), vinculada a `0..1` `Ingresso` apenas quando `Ingresso.status == UTILIZADO` e a sessão já encerrou (`submeterAvaliacao()`, `RF-13`).

#### Fluxo "Só Comprar Ingresso" vs. "Comprar com Comida" no Diagrama de Classes
- A relação entre `Usuario` e `PedidoCantina` tem multiplicidade **`0..*`** e a relação entre `Ingresso` e `PedidoCantina` também é **`0..*` (opcional)**.
- Assim, o cliente que **só compra ingresso** instancia `Compra -> Pagamento -> Ingresso -> AssentoSessao` (e opcionalmente `AvaliacaoSessao` após o filme), com **zero** instâncias de `PedidoCantina`.
- Já o cliente que **compra apenas na cantina para Retirada no Balcão** instancia `PedidoCantina` com `modalidade = BALCAO` e `ingressoId = null` (`0..1`), sem precisar de ingresso.

---

### 2.2. Diagrama de Atividades (`diagrama-atividades.html`)

O Diagrama de Atividades representa a lógica comportamental completa dividida em **5 raias (swimlanes)** (`01 / Cliente & Bilheteria`, `02 / Cantina KDS`, `03 / Portaria QR`, `04 / API & PostgreSQL` e `EX / Exceções & Estorno`) e **4 fases cronológicas**, estruturadas em torno de **6 nós de decisão UML (`◊`)**:

1. **Decisão 1 — `◊ Assento Livre?` (`decisao_assento`):**
   - Ao selecionar a sessão, poltrona e meia-entrada (com aviso LGPD), o banco verifica a disponibilidade concorrente (`RF-03`/`RF-14`).
   - **`[Não]`:** Segue para a raia de exceções em **`Trocar / Desistir`** (`desistir_indisponivel`), permitindo escolher outra poltrona ou encerrar a jornada imediatamente.
   - **`[Sim] livre`:** Avança para **`Reservar 10 min`** (`bloquear_10m`), gravando `status = RESERVADO` (`ADR-002`).
2. **Saída de Abandono/Expiração na Reserva (`desistir_checkout`):**
   - Durante a janela de 10 minutos, se o cliente desistir de continuar a compra ou o timer expirar sem confirmação, o fluxo desvia para **`Desistiu / >10m`**, liberando o assento automaticamente para outros compradores.
3. **Decisão 2 — `◊ Pagto Aprovado?` (`decisao_pagto`):**
   - **`[Não]/estorno`:** Desvia para **`Falha / Estorno CDC`** (`falha_ou_estorno_cdc`), cobrindo:
     - Recusa do cartão ou falha no gateway (libera reserva);
     - Compensação tardia de Pix após os 10 minutos quando o assento expirou (agenda reembolso automático sem emitir ingresso — `RN-01`);
     - Solicitação de **Estorno CDC (art. 49)** em até 7 dias da compra e antes do início da sessão (`RF-12`), cancelando o ingresso e liberando o assento.
   - **`[Sim] pago`:** Avança para **`Emitir QR Code`** (`emitir_qr`), gerando 1 token opaco assinado por assento (`RF-05`).
4. **Decisão 3 — `◊ Pedir Comida?` (`decisao_comida` — Checkouts Independentes `ADR-005`):**
   - **Caminho "Só assistir ao filme":** O cliente não é obrigado a comprar alimentos; a partir de `Emitir QR Code`, segue direto pela seta **`ir à sessão`** rumo à portaria (`decisao_qr_portaria`).
   - **Caminho `[Sim] comida` (antes da sessão OU durante a sessão):** Como os checkouts são independentes (`ADR-005`), o cliente pode fazer pedido na cantina tanto antes de entrar quanto já sentado na poltrona durante o filme, seguindo para `◊ Modalidade?` (`checkout_cantina`).
5. **Decisão 4 — `◊ Modalidade?` (`checkout_cantina`):**
   - **`[Balcão]` (`BALCAO`):** Segue direto para **`Retirar no Balcão`** (`retirada_balcao`), dispensando ingresso ativo (`CA-F09`).
   - **`[Sala]` (`ENTREGA_ASSENTO`):** Fica retido até que a validação na portaria libere o preparo para a sala (`liberar_kds_sala`, `RST-04`).
6. **Decisão 5 — `◊ Entrou c/ QR?` (`decisao_qr_portaria`):**
   - **`[Não] faltou`:** Se o QR Code for inválido/já usado ou se o cliente **não comparecer à sessão**, cai em **`Barrado / Faltou`** (`barrar_ou_ausente`), bloqueando qualquer entrega na sala e **impedindo a avaliação pós-sessão** (`CA-F13`).
   - **`[Sim] entrou`:** Consome o QR Code em leitura única (`status = UTILIZADO`), aciona **`Liberar KDS Sala`** (`liberar_kds_sala`) e, ao final do filme, libera **`Assistir & Avaliar`** (`assistir_e_avaliar`, nota de 1 a 5 estrelas — `RF-13`).
7. **Decisão 6 — `◊ Achou Cliente?` (`runner_entrega`):**
   - Com a entrada confirmada e o lanche pronto, o Runner vai até a poltrona na sala escura (`RF-09`).
   - Se o cliente for localizado, confirma a entrega (`ENTREGUE`).
   - **`[Não] >2m`:** Se o cliente não estiver na poltrona após 2 minutos de tentativa, o Runner aciona **`Mudar p/ Balcão`** (`converter_balcao`, `RF-20` / `RN-03`), convertendo o pedido para retirada no balcão sem perturbar a sessão.

---

### 2.3. Diagrama de Sequência (`diagrama-sequencial.html`)

O Diagrama de Sequência detalha a troca temporal de mensagens entre **6 linhas de vida (lifelines)** (`Cliente (Web/App)`, `API & PostgreSQL`, `Gateway Pagto`, `Portaria QR`, `Cozinha / KDS` e `Runner / Sala`), organizada em **4 segmentos (`segments`)** e **20 passos numerados (`1..20`)**:

- **Segmento 1 — Seleção e Trava de Assento 10 min (`RN-01` / `ADR-002`) [Passos 1 a 3]:**
  - `1.` `Cliente -> API`: `POST /reservations (sessao, assento F8)` invocando `AssentoSessao.reservarTemporariamente(10m)`.
  - `2.` `API -> Cliente`: Fragmento `[alt]` retornando `200 OK (RESERVADO)` se livre ou `409 Conflict` se já disputado/ocupado.
  - `3.` `Cliente -> API`: Fragmento `[opt Desistir/>10m]` executando `liberarReserva()` caso o cliente desista ou o timer expire.
- **Segmento 2 — Checkout Idempotente, Webhook e Cantina (`ADR-003` / `ADR-005`) [Passos 4 a 9]:**
  - `4–5.` `Cliente -> API -> Gateway`: `POST /payments` envia cobrança com `idempotencyKey` e `valorCentavos` **fora da transação do banco** (`ADR-003`).
  - `6.` `Gateway -> API`: `[alt Recusado/Timeout]` Webhook `RECUSADO` aciona `liberarReserva()` (ou reembolso automático se Pix compensou após expiração — `RN-01`).
  - `7–8.` `Gateway -> API -> Cliente`: `[alt Aprovado]` `POST /webhooks/payments` executa `confirmarOcupacao()` + `emitirIngressoQr()` e devolve `200 OK` com `qrToken`.
  - `9.` `Cliente -> API`: `[opt Comida]` `POST /orders (modalidade)` realiza o checkout independente da cantina (antes ou durante a sessão) com reserva atômica de estoque.
- **Segmento 3 — Operação Concorrente: Portaria (`RN-02`), Cozinha KDS e Runner (`RN-03`) [Passos 10 a 17]:**
  - `10–12.` `[par Portaria]`: O cliente apresenta o QR Code ao operador (`STAFF-VAL-01`), que chama `POST /tickets/validate`. A API executa `validarQrCodePortaria() -> UTILIZADO` e responde `[alt Válido] 200 OK (Poltrona F8)` ou `[Inválido/Usado] 403`.
  - `13–14.` `[par KDS]`: A API libera o preparo para a Cozinha/KDS (`STAFF-KDS-01`) — imediato para `BALCAO` ou após validação na portaria para `ENTREGA_ASSENTO` (`RST-04`) — e a cozinha conclui com `PATCH /orders/{id}/status (avancarPreparoKDS -> PRONTO)`.
  - `15.` `[alt BALCAO]`: A API envia push ao cliente avisando que o pedido está pronto para retirada no balcão.
  - `16–17.` `[alt ENTREGA_ASSENTO]`: O Runner (`STAFF-RUN-02`) valida `podeEntregarNoAssento()`, realiza a entrega na poltrona `F8` (`confirmarEntregaAssento()`) ou, se o cliente estiver ausente por mais de 2 minutos, executa `converterParaBalcao()` (`RF-20`).
- **Segmento 4 — Pós-Sessão e Pós-Venda: Estorno CDC (`RF-12`) e Avaliação (`RF-13`) [Passos 18 a 20]:**
  - `18.` `[opt Estorno CDC]`: Antes da sessão e dentro do prazo legal de 7 dias, o cliente pode acionar `solicitarEstornoCDC()`.
  - `19–20.` Após o término da sessão, o cliente que teve ingresso `UTILIZADO` envia `PUT /screenings/{id}/rating (nota 1..5)` (`submeterAvaliacao()`), recebendo `201 Created`.

---

## 3. O que é o Archify e Como Usar para Futuras Modificações

O **[Archify](https://github.com/tt-a1i/archify)** (instalado localmente neste repositório em `.agents/skills/archify`) é um compilador determinístico de diagramas arquiteturais e UML que transforma especificações declarativas em **JSON** em páginas **HTML interativas standalone** (com tema claro/escuro, zoom/pan, busca de nós, lentes semânticas e exportação direta para **PNG, SVG e WebM**).

Ao contrário de geradores que apenas desenham caixas sem validar a geometria, o compilador do Archify possui uma barreira de qualidade (`showcase`) que **rejeita automaticamente** textos truncados, rótulos sobrepostos, setas cruzando caixas ou colisões de linhas antes de gerar o HTML.

### 3.1. Onde ficam os códigos-fonte (JSON) de cada diagrama

Os arquivos JSON fonte e os recibos de validação ficam armazenados em `.archify/`:

| Diagrama | Arquivo JSON Fonte (Editável) | HTML Gerado |
| :--- | :--- | :--- |
| **Diagrama de Classes** | [`.archify/class-cinefood-20261109-171000/candidate.json`](../../.archify/class-cinefood-20261109-171000/candidate.json) | [`docs/diagramas/diagrama-classes.html`](./diagrama-classes.html) |
| **Diagrama de Atividades** | [`.archify/workflow-cinefood-20261109-171000/candidate.json`](../../.archify/workflow-cinefood-20261109-171000/candidate.json) | [`docs/diagramas/diagrama-atividades.html`](./diagrama-atividades.html) |
| **Diagrama de Sequência** | [`.archify/sequence-cinefood-20261109-171000/candidate.json`](../../.archify/sequence-cinefood-20261109-171000/candidate.json) | [`docs/diagramas/diagrama-sequencial.html`](./diagrama-sequencial.html) |

### 3.2. Comandos para Validar e Recompilar um Diagrama

1. **Verificar a instalação do Archify no projeto:**
   ```bash
   node .agents/skills/archify/bin/archify.mjs doctor
   ```

2. **Recompilar e validar o Diagrama de Classes após editar o JSON:**
   ```bash
   node .agents/skills/archify/bin/archify.mjs finalize class \
     .archify/class-cinefood-20261109-171000/candidate.json \
     docs/diagramas/diagrama-classes.html \
     --out-dir .archify/class-cinefood-20261109-171000/review-novo \
     --quality showcase --json
   ```

3. **Recompilar e validar o Diagrama de Atividades (`workflow`):**
   ```bash
   node .agents/skills/archify/bin/archify.mjs finalize workflow \
     .archify/workflow-cinefood-20261109-171000/candidate.json \
     docs/diagramas/diagrama-atividades.html \
     --out-dir .archify/workflow-cinefood-20261109-171000/review-novo \
     --quality showcase --json
   ```

4. **Recompilar e validar o Diagrama de Sequência (`sequence`):**
   ```bash
   node .agents/skills/archify/bin/archify.mjs finalize sequence \
     .archify/sequence-cinefood-20261109-171000/candidate.json \
     docs/diagramas/diagrama-sequencial.html \
     --out-dir .archify/sequence-cinefood-20261109-171000/review-novo \
     --quality showcase --json
   ```

> **Dica:** Sempre que rodar `finalize` para uma nova revisão, informe um diretório novo em `--out-dir` (ex.: `review-10`, `review-11`) para preservar o histórico de recibos de validação sem conflito. Caso algum texto ou seta fique fora do padrão visual `showcase`, o próprio JSON de saída mostrará em `diagnostics` qual nó/aresta precisa de ajuste e qual a correção sugerida (`supportedFixes`).
