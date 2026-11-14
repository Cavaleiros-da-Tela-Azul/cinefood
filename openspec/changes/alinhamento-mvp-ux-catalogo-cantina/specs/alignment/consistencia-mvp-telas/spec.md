# Spec Delta: Consistência Funcional, Visual e Contratual das Telas do MVP

## Purpose
Eliminar as divergências identificadas entre as especificações (`PRODUCT.md`, `DESIGN.md`, `mar-01` a `mar-05`, ADRs) e o código atual do frontend e do módulo `catalog`.

## ADDED Requirements

### Requirement: Separação estrita entre aplicação do cliente e portal Backstage e alinhamento RBAC
O sistema DEVE remover qualquer botão ou atalho de login de funcionários das telas voltadas ao cliente (`AuthView` e `Header`), restringindo o Backstage à rota `#/ops` com barreira de identificação e papéis alinhados (`CLIENTE`, `OPERADOR_PORTARIA`, `OPERADOR_CANTINA`, `RUNNER`, `ADMIN_CINEMA`).

#### Scenario: Tela de conta do cliente sem controles operacionais
- **WHEN** o cliente acessa a tela de autenticação ou conta
- **THEN** o sistema exibe apenas autenticação de cliente, histórico de consentimento LGPD e saída de sessão, sem cards ou botões de acesso ao Backstage operacional

### Requirement: Consistência de capacidade de sala, mapa por sessão, reserva e checkout
O sistema DEVE unificar a capacidade padrão da sala entre mapa de cliente, bilheteria e painel admin (`96` poltronas `A–H` × 12 ou capacidade parametrizada consistente), manter mapa independente por sessão coerente com a ocupação, diferenciar visualmente poltronas `PCD_OBESO` (`1.5×`), remover pré-seleções indevidas, validar o timer de 10 minutos no checkout e exigir validação documental de meia-entrada com persistência no pedido.

#### Scenario: Expiração da trava de 10 minutos durante o checkout
- **WHEN** o cronômetro de reserva de 10 minutos atinge zero enquanto o usuário está no checkout
- **THEN** o sistema bloqueia a aprovação do pagamento, exibe alerta de expiração e redireciona para nova escolha de assentos

#### Scenario: Emissão de QR individual por assento e token sincronizado com a Portaria
- **WHEN** uma compra de múltiplos assentos é aprovada no checkout
- **THEN** o sistema gera um token/QR único e verificável para cada assento comprado, compatível com a leitura na Portaria

### Requirement: Alinhamento de RNs, estados da cantina, fila do Runner e remoção de bypass
O sistema DEVE remover o botão `"Simular avanço"` da área do cliente, alinhar a rotulagem de `RN-02` (trava de portaria) e `RN-03` (conversão por ocorrência), suportar os estados completos (`PENDENTE_PAGAMENTO`, `AGUARDANDO_CHEGADA`, `EM_PREPARO`, `PRONTO`, `SAIU_PARA_ENTREGA`, `RETIRADA_NO_BALCAO`, `ENTREGUE`), restringir a fila do Runner a pedidos prontos/em entrega e converter o pedido para `RETIRADA_NO_BALCAO` com aviso ao titular em caso de ocorrência.

#### Scenario: Conversão automática para retirada no balcão após ocorrência do Runner
- **WHEN** o Runner registra ausência do cliente no assento para um pedido elegível em entrega
- **THEN** o sistema altera o modo de entrega para balcão, muda o status para `RETIRADA_NO_BALCAO` e exibe aviso correspondente no histórico do cliente

### Requirement: Conformidade de Cancelamento CDC, LGPD, Módulo Catalog e Design System OLED/WCAG
O sistema DEVE isolar pedidos por `userId`, exibir avisos internos e termo LGPD completo com timestamps dinâmicos e gestão pós-login de marketing, validar cancelamento CDC (até 7 dias da compra e 2h antes da sessão) liberando assentos e estoque, eliminar cores hardcoded que quebram o Modo OLED, garantir alvos >= 44px, foco `#60A5FA` e inputs >= 16px no mobile, e corrigir filtros e comparação de data local no módulo `catalog`.

#### Scenario: Cancelamento dentro da janela CDC libera assentos e estoque
- **WHEN** o cliente solicita cancelamento de pedido ativo dentro de 7 dias da compra e com pelo menos 2 horas de antecedência da sessão
- **THEN** o sistema cancela o pedido, registra estorno e libera imediatamente os assentos ocupados e o estoque reservado

#### Scenario: Alternância para Modo Sala Escura OLED sem vazamento de cor clara/hardcoded
- **WHEN** o usuário ativa o Modo Sala Escura OLED
- **THEN** todos os painéis e botões usam tokens CSS (`var(--...)`) sem cores de fundo hardcoded incompatíveis com o tema OLED

## Acceptance Criteria
- **AC-1.** Tela de conta do cliente não expõe acesso ao Backstage e `#/ops` exige seleção/barreira inicial de perfil alinhado ao RBAC.
  @test:tests/identity/rbac.test.ts
- **AC-2.** Capacidade de sala (`96` assentos), diferenciação `PCD_OBESO 1.5×`, timer no checkout, meia-entrada e QR individual por assento são consistentes entre cliente, bilheteria e portaria.
  @test:tests/booking/reserva.test.ts
- **AC-3.** Fluxo de cantina/KDS/Runner respeita `RN-02` e `RN-03` sem bypass no cliente, convertendo ocorrências para `RETIRADA_NO_BALCAO`.
  @test:tests/canteen/entrega.test.ts
- **AC-4.** Histórico isolado por titular, avisos, regra CDC completa, transparência LGPD, correções no módulo `catalog` e tokens OLED/WCAG funcionam de forma integrada.
  @test:web/tests/prototype.spec.ts
