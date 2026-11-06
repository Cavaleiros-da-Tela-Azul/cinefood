# Spec Delta: Catálogo e Programação de Cinema

## Purpose
Consulta estruturada de programação de filmes em cartaz, salas de exibição, sessões disponíveis e estado do mapa de assentos para os canais web, mobile e bilheteria.

## ADDED Requirements

### Requirement: Consulta de catálogo de filmes e sessões
O sistema DEVE listar os filmes em cartaz com detalhes informativos e as respectivas sessões ativas da unidade piloto.

#### Scenario: Listagem de sessões ativas
- **WHEN** cliente consulta a programação do cinema para uma data válida
- **THEN** sistema retorna a lista de sessões com horário de início, sala, formato e filme associado

#### Scenario: Bloqueio de sessões encerradas ou desabilitadas
- **WHEN** cliente solicita compra ou assentos para sessão com horário já ultrapassado ou status inativo
- **THEN** sistema recusa a seleção e impede qualquer início de reserva para essa sessão

### Requirement: Consulta de mapa de assentos por sessão
O sistema DEVE retornar o mapa de poltronas da sala vinculada à sessão com a indicação precisa do estado atual de cada assento (DISPONIVEL, RESERVADO, OCUPADO).

#### Scenario: Exibição do estado das poltronas
- **WHEN** cliente requisita o mapa de assentos de uma sessão ativa
- **THEN** sistema retorna todas as poltronas com identificação de fila, número e estado atualizado

## Acceptance Criteria
- **AC-3.** Filtros e consultas de filmes e sessões retornam apenas programações válidas e ativas.
  @test:tests/catalog/programacao.test.ts
- **AC-4.** Mapa de assentos reflete com precisão os estados das poltronas e rejeita sessões encerradas.
  @test:tests/catalog/assentos.test.ts
