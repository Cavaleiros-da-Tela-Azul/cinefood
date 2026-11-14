# Spec Delta: Tela de Comentários de Clientes da Rede de Cinema

## Purpose
Exibir em uma tela dedicada os comentários e notas atribuídos por clientes aos filmes que efetivamente assistiram na rede CineFood, permitindo também que o titular autenticado publique, edite e exclua sua avaliação pós-sessão.

## ADDED Requirements

### Requirement: Mural público de comentários verificados por filme assistido na rede
O sistema DEVE disponibilizar na interface do cliente uma tela de comentários listando avaliações publicadas por espectadores com entrada validada na rede, filtráveis por filme e ordenáveis por data ou nota.

#### Scenario: Consulta de comentários de um filme na rede
- **WHEN** o cliente acessa a aba "Comentários" ou clica nas avaliações de um filme
- **THEN** o sistema exibe os comentários com nome público abreviado do espectador, selo de "Sessão Assistida / Entrada Validada", nota de 1 a 5 estrelas, filme, complexo e data

### Requirement: Publicação, edição e exclusão de comentário condicionados à sessão validada
O sistema DEVE permitir que apenas o titular autenticado com ingresso validado na portaria e sessão encerrada crie, edite ou exclua seu comentário e nota de 1 a 5 estrelas (`RF-13`).

#### Scenario: Edição e exclusão de avaliação existente pelo autor
- **WHEN** o cliente autenticado edita a nota/texto ou exclui uma avaliação que publicou anteriormente
- **THEN** o sistema atualiza ou remove o registro imediatamente tanto no histórico privado quanto no mural da rede

#### Scenario: Bloqueio de comentário sem sessão assistida validada
- **WHEN** um usuário sem ingresso utilizado e sessão encerrada tenta enviar comentário para um filme
- **THEN** o sistema bloqueia a publicação e exibe orientação clara sobre o pré-requisito de validação na portaria

## Acceptance Criteria
- **AC-1.** Tela de comentários exibe avaliações verificadas dos filmes assistidos na rede com filtro por filme.
  @test:web/tests/prototype.spec.ts
- **AC-2.** Apenas titulares com ingresso validado e sessão encerrada podem criar, editar e excluir suas avaliações (1 a 5 estrelas).
  @test:tests/history/avaliacao.test.ts
