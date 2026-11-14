# Spec Delta: Comentários Verificados na Ficha do Filme do Catálogo

## Purpose

Acoplar a aba de comentários dos usuários dentro da ficha de cada filme no "Catálogo", preservando integralmente a regra de que apenas clientes com ingresso validado na portaria e sessão encerrada podem avaliar filmes da rede (`RF-13`).

## ADDED Requirements

### Requirement: Aba de comentários vinculada ao filme selecionado no Catálogo
O sistema DEVE disponibilizar uma sub-aba "Comentários" na ficha de cada filme do "Catálogo", listando apenas as avaliações verificadas referentes àquele filme, ordenáveis por data ou nota e com selo de entrada validada na rede.

#### Scenario: Leitura de comentários ao abrir um filme no Catálogo
- **WHEN** o cliente abre a sub-aba "Comentários" na ficha de um filme do catálogo
- **THEN** o sistema exibe os comentários verificados daquele filme (ou estado vazio informativo quando ainda não houver avaliações na rede) sem misturar avaliações de outros títulos

#### Scenario: Redirecionamento direto a partir da aba Sessões
- **WHEN** o cliente clica em "Ver Comentários da Rede" nos detalhes de uma sessão
- **THEN** o sistema navega para a aba "Catálogo" já com a ficha daquele filme aberta diretamente na sub-aba "Comentários"

### Requirement: Escrita restrita a sessão assistida validada (Opção A / RF-13)
O sistema DEVE restringir criação, edição e exclusão de comentários e notas (1 a 5 estrelas) ao titular autenticado que possua ingresso do filme validado na portaria e sessão encerrada (`RF-13`), mantendo a aba em modo leitura com explicação clara para filmes fora de cartaz ou usuários sem check-in concluído.

#### Scenario: Bloqueio de comentário em filme não assistido na rede
- **WHEN** o usuário visualiza a sub-aba "Comentários" de um filme sem ingresso validado e sessão encerrada em sua conta
- **THEN** o sistema não libera o formulário de avaliação e informa de forma clara o pré-requisito da portaria/sessão encerrada

## Acceptance Criteria

- **AC-1.** Sub-aba "Comentários" dentro da ficha do filme exibe somente comentários daquele filme e abre diretamente quando acionada a partir de "Sessões".
  @test:web/tests/prototype.spec.ts
- **AC-2.** Publicação, edição e exclusão permanecem bloqueadas fora da regra `RF-13` (titular com check-in e sessão encerrada).
  @test:tests/history/avaliacao.test.ts
