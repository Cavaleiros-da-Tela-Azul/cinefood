# Design: MAR-06 Transição, Implantação e Operação Piloto (v1.0.0)

## Context
Etapa final de transição, operação, manutenção e encerramento (`MAR-06`) segundo as seções 5.4.4 e 5.5 do Manual de Processos v2.0.

## Goals / Non-Goals

**Goals:**
* Executar teste ponta a ponta de prontidão operacional (*smoke test*) cobrindo o fluxo completo de ingresso, portaria, cantina e avaliação.
* Garantir que falhas críticas acionem contenção do fluxo afetado e reconciliação de transações sem sobrescrever compras posteriores ao backup (`4.3`, `5.4.4`).
* Assegurar que na ausência de gateway/unidade comercial homologados o sistema opere em modo de demonstração simulada segura (`RST-03`).

**Non-Goals:**
* Operação financeira real sem homologação prévia do cinema e do gateway (`RST-03`).

## Decisions

### 1. Verificador de Prontidão e Jornada Smoke (`5.4.4`)
* **Decisão:** Automatizar o ensaio rápido pós-implantação que valida saúde da API, banco, adaptador de pagamento e a sequência completa da jornada integrada.

### 2. Procedimento de Contenção e Reconciliação (`5.5.1`)
* **Decisão:** Em caso de divergência ou indisponibilidade crítica, suspender especificamente a operação afetada, preservar transações já confirmadas e executar rotina de conciliação de pagamentos/estornos no fechamento do turno.

## Risks / Trade-offs

* **[Risco: Sobrescrita de transações recentes durante restauração de backup]** → Restaurar banco em instância de análise e reconciliar eventos do gateway posteriores ao ponto de backup antes de reabrir vendas (`4.3`).
