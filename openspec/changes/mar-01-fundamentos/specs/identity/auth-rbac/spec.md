# Spec Delta: Identity & Auth RBAC

## Purpose
Gerenciamento de identidades, autenticação segura e autorização baseada em papéis (RBAC) com isolamento estrito de permissões operacionais e de clientes para o CineFood.

## ADDED Requirements

### Requirement: Cadastro e autenticação de usuários
O sistema DEVE permitir cadastro com e-mail único e autenticar usuários gerando token seguro de sessão com hash de senha protegido.

#### Scenario: Autenticação com credenciais válidas
- **WHEN** usuário submete e-mail e senha corretos previamente cadastrados
- **THEN** sistema autentica com sucesso e retorna token de sessão com identificador e perfil do usuário

#### Scenario: Rejeição de credenciais incorretas ou inexistentes
- **WHEN** usuário submete senha incorreta ou e-mail não existente
- **THEN** sistema rejeita a autenticação com código HTTP 401 e não emite token de acesso

#### Scenario: Rejeição de cadastro com e-mail duplicado
- **WHEN** novo cadastro submete e-mail que já existe na base
- **THEN** sistema bloqueia o cadastro e retorna erro HTTP 409 informando indisponibilidade do e-mail

### Requirement: Controle de Acesso Baseado em Papéis (RBAC)
O sistema DEVE validar o papel atribuído ao usuário (CLIENTE, OPERADOR_PORTARIA, OPERADOR_CANTINA, RUNNER, ADMIN_CINEMA) antes de autorizar a execução de operações protegidas.

#### Scenario: Acesso autorizado ao perfil correto
- **WHEN** operador com papel OPERADOR_PORTARIA solicita validação de ingresso
- **THEN** sistema autoriza a operação e prossegue com a validação

#### Scenario: Bloqueio de acesso para perfil sem privilégio
- **WHEN** usuário com papel CLIENTE tenta acessar endpoint administrativo ou operacional
- **THEN** sistema bloqueia a requisição retornando código HTTP 403 Forbidden

## Acceptance Criteria
- **AC-1.** Cadastro, autenticação com senha válida e rejeição de e-mail duplicado ou senha incorreta.
  @test:tests/identity/auth.test.ts
- **AC-2.** Validação rigorosa de perfis RBAC bloqueando acesso indevido entre papéis operacionais e clientes.
  @test:tests/identity/rbac.test.ts
