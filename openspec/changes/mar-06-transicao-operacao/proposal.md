# Proposal: MAR-06 Transição, Implantação e Encerramento Operacional (v1.0.0)

## Why
O Marco MAR-06 (Semanas 23 a 24 do ciclo ISO/IEC/IEEE 12207:2021) executa a transição controlada do CineFood para operação na unidade piloto (ou demonstração acadêmica simulada caso a unidade/gateway comercial não estejam homologados), garantindo backup/restauração validados, testes rápidos de fumaça (*smoke tests*), procedimentos de operação/manutenção e registro formal de aceite da release `v1.0.0`.

## What Changes
* **Implantação Piloto ou Simulação Controlada (`5.4.4`, `RST-03`):** Preparação do ambiente de homologação/piloto, aplicação de migrações, carga de dados sementes e verificação rápida (compra -> emissão de QR -> validação na portaria -> pedido cantina -> entrega/retirada -> avaliação).
* **Operação, Monitoramento e Resposta a Incidentes (`5.5.1`):** Checklist pré-abertura da unidade, monitoramento de erros/latência/filas sem expor dados sensíveis e procedimento de contenção/reconciliação em falhas críticas.
* **Manutenção, Descontinuação e Aceite Final (`5.5.2`, `5.5.3`, `4.1`):** Fluxos de manutenção (corretiva, preventiva, adaptativa e perfectiva), exportação/retenção segura na descontinuação e termo de encerramento e aceite da versão `v1.0.0`.

## Capabilities

### New Capabilities
- `operations/transicao-piloto`: Jornada ponta a ponta de fumaça (smoke test) para transição, verificação de prontidão operacional, conciliação de encerramento de turno e contingência/rollback (`MAR-06`).

### Modified Capabilities
*(Nenhuma capacidade existente modificada).*

## Impact
* **Release Final:** Publicação da versão `v1.0.0` com matriz de rastreabilidade 100% vinculada, evidências de recuperação e relatório de aceite.
