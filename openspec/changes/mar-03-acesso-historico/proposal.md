# Proposal: MAR-03 Acesso e Histórico (QR Code, Portaria e Avaliação Privada)

## Why
O Marco MAR-03 (Semanas 11 a 13 do ciclo ISO/IEC/IEEE 12207:2021) conecta a compra digital à operação física da sala de cinema. Permite emitir ingressos individuais com QR Code opaco após a confirmação do pagamento, validar a entrada única na portaria com disparo automático para a cantina e disponibilizar o histórico privado e a avaliação pós-sessão.

## What Changes
* **Emissão de Ingresso e QR Code (`RF-05` / `CMP-04`):** Geração de um ingresso e token opaco exclusivo por assento somente após liquidação do pagamento e conversão válida da reserva, iniciando a esteira guiada para convite de compra na cantina (`RN-05`).
* **Validação e Consumo Atômico na Portaria (`RF-06` / `CMP-04`):** Leitura do QR Code por operador autorizado (`OPERADOR_PORTARIA`), verificando pagamento, sessão e uso anterior; altera atomicamente o estado para `UTILIZADO` e dispara o evento interno que libera o preparo de pedidos da cantina vinculados em `AGUARDANDO_CHEGADA` (`RN-02`).
* **Histórico Privado e Avisos (`RF-11` / `CMP-06`):** Exibição consolidada de compras, ingressos, pedidos de cantina e avisos internos restritos ao titular autenticado.
* **Avaliação Privada Pós-Sessão (`RF-13` / `CMP-06`):** Nota de 1 a 5 estrelas liberada exclusivamente após o término da sessão e somente para o usuário que teve seu ingresso validado na portaria.

## Capabilities

### New Capabilities
- `tickets/emissao-validacao-qr`: Emissão de ingresso com QR Code opaco individual por poltrona e validação/consumo atômico único na portaria com gatilho para cantina (`RF-05`, `RF-06`).
- `history/historico-avaliacao`: Histórico privado do titular com avisos internos e avaliação pós-sessão de 1 a 5 estrelas condicionada à entrada validada (`RF-11`, `RF-13`).

### Modified Capabilities
*(Nenhuma capacidade existente modificada).*

## Impact
* **Arquitetura e Dados:** Módulos `CMP-04` e `CMP-06` integrados com `CMP-03` e `CMP-05`.
* **Riscos Mitigados:** `R3` (Reutilização fraudulenta de ingresso por cópia ou leitura simultânea).
