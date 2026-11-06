# Proposal: MAR-05 Verificação Integrada e Qualidade (RNF-01 a RNF-06 e Candidata v1.0.0-rc.1)

## Why
O Marco MAR-05 (Semanas 19 a 22 do ciclo ISO/IEC/IEEE 12207:2021) consolida a verificação e validação integrada de todo o sistema antes da liberação da versão candidata (`v1.0.0-rc.1`). Comprova empiricamente o atendimento aos 6 Requisitos Não Funcionais (`RNF-01` a `RNF-06`) e às 4 Restrições (`RST-01` a `RST-04`).

## What Changes
* **Desempenho e Latência (`RNF-01` / `CA-N01`):** Ensaios automatizados comprovando `p95 <= 2 s` nas operações internas da API e validação de QR Code sob carga de 20 usuários simultâneos.
* **Segurança e Proteção de Segredos (`RNF-02` / `CA-N02`):** Verificação de HTTPS, hash de senhas, bloqueio de acesso cruzado entre contas/perfis e ausência total de números de cartão ou credenciais em logs/código.
* **Integridade Transacional sob Concorrência (`RNF-03` / `CA-N03`):** Bateria integrada validando zero venda duplicada de assento, zero estoque negativo, zero confirmação repetida e zero reutilização de QR Code no estado final do banco.
* **Usabilidade, Acessibilidade, Recuperação e Manutenibilidade (`RNF-04`, `RNF-05`, `RNF-06`):** Checklist WCAG 2.2 AA, jornada com `>= 80%` de conclusão sem ajuda, simulação de backup/restauração do PostgreSQL e cobertura `>= 70%` nos módulos de negócio.

## Capabilities

### New Capabilities
- `quality/verificacao-rnf`: Verificação automatizada de desempenho (p95 <= 2s), segurança, integridade transacional concorrente, recuperação e cobertura de código (`RNF-01` a `RNF-06`, `RST-01` a `RST-04`).

### Modified Capabilities
*(Nenhuma capacidade existente modificada).*

## Impact
* **Qualidade e Release:** Geração da matriz de rastreabilidade completa e aprovação da candidata `v1.0.0-rc.1`.
