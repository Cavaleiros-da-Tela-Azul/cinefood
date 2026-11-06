# Design: MAR-03 Acesso e Histórico (QR Code, Portaria e Avaliação Privada)

## Context
Entrega da emissão e validação de ingressos (`CMP-04`) e do histórico e avaliação pós-sessão (`CMP-06`) referentes ao marco `MAR-03`.

## Goals / Non-Goals

**Goals:**
* Emitir um QR Code com token opaco (HMAC/hash não sequencial) por assento pago (`CA-F05`).
* Garantir que apenas a primeira leitura válida na portaria consuma o ingresso, inclusive sob requisições concorrentes (`CA-F06`, `CA-N03`).
* Disparar evento de domínio ao validar a entrada na portaria para transicionar pedidos `ENTREGA_ASSENTO` de `AGUARDANDO_CHEGADA` para `EM_PREPARO` (`RN-02`).
* Permitir avaliação privada (1 a 5 estrelas) editável e excluível somente após o fim da sessão e com entrada validada (`CA-F13`).

**Non-Goals:**
* Operação de preparo e runner da cantina (detalhada em `mar-04-cantina-gestao`).

## Decisions

### 1. Token Opaco e Consumo Atômico no Banco (`RF-05`, `RF-06`)
* **Decisão:** O QR Code codifica apenas um token aleatório/HMAC opaco de alta entropia. A validação executa `UPDATE ingressos SET status = 'UTILIZADO', data_utilizacao = NOW() WHERE qr_token = :token AND status = 'EMITIDO'`, verificando `rowCount === 1`.
* **Justificativa:** Duas leituras simultâneas em câmeras distintas resultam em exatamente uma aprovação e uma rejeição imediata.

### 2. Gatilho de Entrada para Preparo na Cantina (`RN-02`)
* **Decisão:** Na mesma confirmação de leitura do ingresso na portaria, o serviço emite evento interno `TicketValidatedEvent` contendo `ingressoId`, permitindo que `CMP-05` mova pedidos vinculados de `AGUARDANDO_CHEGADA` para `EM_PREPARO`.

## Risks / Trade-offs

* **[Risco: Compartilhamento de print do QR Code]** → Consumo atômico invalida instantaneamente qualquer leitura subsequente (`R3`).
* **[Risco: Tentativa de avaliar sessão sem ter comparecido]** → Validação estrita de `ingresso.status === 'UTILIZADO'` e `NOW() > sessao.fim` (`CA-F13`).
