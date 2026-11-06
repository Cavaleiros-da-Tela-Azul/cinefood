# Design: MAR-04 Alimentação e Gestão (Cantina, KDS/Runner, Estorno CDC e Direitos LGPD)

## Context
Implementação das funcionalidades da cantina (`CMP-05`), administração, relatórios, estornos (`CMP-03`, `CMP-06`) e direitos LGPD (`CMP-01`) previstas para o marco `MAR-04`.

## Goals / Non-Goals

**Goals:**
* Prevenir saldo negativo de estoque em disputas concorrentes pela última unidade (`CA-F08`, `CA-N03`).
* Garantir que a entrega no assento ocorra somente para ingresso próprio, pago, não cancelado e com entrada física validada na portaria (`CA-F09`, `RST-04`, `RN-02`).
* Tratar ocorrências do runner na sala escura convertendo automaticamente para retirada no balcão (`RN-03` / `RF-20`).
* Aplicar a janela de corte de cancelamento CDC (até 7 dias da compra e até 2h antes da sessão para ingresso não utilizado) com estorno idempotente (`CA-F12`, `RN-04`).
* Calcular taxa de ocupação exata (`ingressos ativos / assentos comercializáveis * 100`) e atender protocolos LGPD (`CA-F15`, `CA-F18`).

**Non-Goals:**
* Integração com PDV externo ou restaurantes terceiros (`RST-01`).

## Decisions

### 1. Reserva Atômica de Estoque no PostgreSQL (`RF-08`)
* **Decisão:** Decrementar `estoque_disponivel` via `UPDATE produtos SET estoque_disponivel = estoque_disponivel - :qtd WHERE id = :id AND estoque_disponivel >= :qtd`. Se falhar, aborta a transação do checkout antes de gerar cobrança.

### 2. Máquina de Estados do Pedido e Ocorrência do Runner (`RF-09`, `RF-20`)
* **Decisão:**
  * Modalidade `BALCAO`: `PENDENTE_PAGAMENTO` -> `EM_PREPARO` -> `PRONTO` -> `ENTREGUE`.
  * Modalidade `ENTREGA_ASSENTO`: `PENDENTE_PAGAMENTO` -> `AGUARDANDO_CHEGADA` -> (evento portaria `RF-06`) -> `EM_PREPARO` -> `PRONTO` -> `SAIU_PARA_ENTREGA` -> `ENTREGUE` (ou `RETIRADA_NO_BALCAO` caso o runner registre ocorrência de ausência/impedimento na sala).

### 3. Regra de Corte de Cancelamento e Estorno (`RF-12` / `RN-04`)
* **Decisão:** Solicitações automáticas de arrependimento verificam `NOW() <= compra.criado_em + 7 dias`, `NOW() <= sessao.inicio - 2 horas` e `ingresso.status === 'EMITIDO'`. Para cantina, permitido enquanto `pedido.status` estiver em `AGUARDANDO_CHEGADA` (antes de iniciar `EM_PREPARO`).

## Risks / Trade-offs

* **[Risco: Pagamento tardio de pedido com estoque já esgotado]** → Disparar compensação e estorno automático sem enviar comanda ao KDS (`CA-F08`).
* **[Risco: Exclusão indevida de registros fiscais em solicitação LGPD]** → Anonimizar/eliminar apenas dados pessoais dispensáveis e reter registros de transações obrigatórias com justificativa legal (`CA-F18`).
