# Spec Delta: Verificação Integrada de Requisitos Não Funcionais (RNF-01 a RNF-06)

## Purpose
Assegurar que a versão candidata do CineFood cumpra as metas não funcionais de desempenho, segurança, integridade transacional sob concorrência, acessibilidade, recuperação e manutenibilidade.

## ADDED Requirements

### Requirement: Desempenho com p95 de até 2 segundos em operações internas
O sistema DEVE responder com tempo de latência p95 igual ou inferior a 2 segundos para operações internas e validação de QR Code sob carga concorrente.

#### Scenario: Medição de p95 em bateria de operações internas e validação de QR
- **WHEN** 100 operações internas e 100 validações de QR Code são executadas com 20 usuários simultâneos
- **THEN** o tempo na posição teto de 95% das amostras ordenadas permanece igual ou inferior a 2000 milissegundos

### Requirement: Integridade transacional absoluta e isolamento de segurança
O sistema DEVE manter zero venda duplicada, zero estoque negativo, zero reutilização de QR Code, zero acesso cruzado entre contas e zero armazenamento de dados completos de cartão.

#### Scenario: Invariantes de banco preservadas após bateria de concorrência e segurança
- **WHEN** múltiplas transações concorrentes disputam o mesmo assento, o último item de estoque e o mesmo QR Code, além de tentativas de acesso cruzado
- **THEN** o estado final do banco registra apenas uma alocação válida por recurso e rejeita todos os acessos não autorizados

## Acceptance Criteria
- **AC-1.** Operações internas e validações de QR Code atingem meta de desempenho p95 <= 2s sem erros inesperados.
  @test:tests/quality/rnf-integridade.test.ts
- **AC-2.** Bateria de integridade e segurança comprova zero venda duplicada, zero reuso de QR, zero estoque negativo e bloqueio de acesso cruzado.
  @test:tests/quality/rnf-integridade.test.ts
