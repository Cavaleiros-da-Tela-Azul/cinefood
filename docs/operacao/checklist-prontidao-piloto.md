# Checklist de Prontidão Operacional — Unidade Piloto (`MAR-06`)

- **Unidade Piloto Única (`RST-01`):** `cinefood-piloto-paulista` (CineFood Paulista IMAX)
- **Versão Alvo:** `v1.0.0` (Modo Sandbox obrigatório `RST-03` enquanto não houver homologação comercial formal)
- **Acesso Operacional Isolado:** `#/ops` (CineFood Backstage · Estações RBAC)

---

## 1. Pré-Abertura do Turno (T-60 min) — `ADMIN_CINEMA`

- [ ] Executar verificação de prontidão e trava de sandbox (`GET /operations/health` / `OperationsService.verifyOperationalReadiness`) confirmando `status: READY` e `sandboxLocked: true`;
- [ ] Validar integridade do banco PostgreSQL e verificar se a última rotina de snapshot passou (`node scripts/verify-backup-restore.mjs`);
- [ ] Conferir grade de sessões ativas no Painel Admin (`#/ops` -> `Painel Admin`): horários, tarifas e quantitativo de assentos comercializáveis (`96` na Sala 1 IMAX, incluindo `A12 PCD Obeso 1.5x`);
- [ ] Atualizar estoques iniciais dos combos e adicionais no cardápio da cantina;
- [ ] Garantir que nenhum módulo operacional está usando credenciais reais de pagamento enquanto `RST-03` estiver ativo.

---

## 2. Portaria e Controle de Acesso — `OPERADOR_PORTARIA`

- [ ] Efetuar login isolado em `#/ops` selecionando estação `OPERADOR_PORTARIA` (confirmar que `Bilheteria`, `Cantina KDS` e `Painel Admin` estão bloqueados via RBAC);
- [ ] Selecionar a sala/sessão correspondente no filtro `#gate-session-filter` antes do embarque;
- [ ] Conferir aviso sonoro (`Som Ativo` em `GateScannerView`) e feedback visual (`LIBERADO` / `DUPLICADO` / `INVALIDO`);
- [ ] Confirmar na primeira leitura válida que comandas pré-vinculadas (`ENTREGA_ASSENTO`) transicionaram automaticamente de `AGUARDANDO_CHEGADA` para `EM_PREPARO` (`RN-02` / `RST-04`);
- [ ] Em caso de dupla leitura de QR Code (`HTTP 409`), orientar o espectador sem liberar acesso duplicado.

---

## 3. Bilheteria Assistida — `OPERADOR_BILHETERIA`

- [ ] Selecionar estação `OPERADOR_BILHETERIA` em `#/ops`;
- [ ] Confirmar ausência de assento pré-selecionado antes da escolha junto ao cliente no guichê;
- [ ] Para compras `Meia 50%` (`RF-16`), conferir documento comprobatório físico/digital e preencher identificador do documento antes da emissão;
- [ ] Emitir ingresso com trava unificada de assento em tempo real (`ADR-002`).

---

## 4. Cozinha / Bomboniere (`KDS`) — `OPERADOR_CANTINA`

- [ ] Abrir aba `Cozinha KDS` (com sub-aba `Runner · OLED` restrita ao papel específico);
- [ ] Preparar imediatamente pedidos `RETIRADA_BALCAO` já liquidados (`RN-05`) e pedidos avulsos (`ADR-005`);
- [ ] **Regra inegociável (`RST-04` / `RN-02`):** jamais iniciar ou despachar `ENTREGA_ASSENTO` enquanto estiver sinalizado como `AGUARDANDO_CHEGADA` (aguardar validação na portaria);
- [ ] Ao concluir preparo, marcar `PRONTO` antes de despachar ao runner.

---

## 5. Entrega em Sala Escura — `RUNNER`

- [ ] Ativar modo `Runner · OLED` (`data-theme="oled"` com fundo `#000000` para baixa emissão luminosa dentro da sala);
- [ ] Retirar somente comandas `PRONTO` vinculadas a ingressos já validados (`SAIU_PARA_ENTREGA`);
- [ ] Em caso de espectador não localizado na poltrona ou impedimento dentro da sala, registrar ocorrência (`CLIENTE_AUSENTE` / observação) para conversão automática em `RETIRADA_NO_BALCAO` com notificação ao titular (`RN-03` / `RF-20`);
- [ ] Após entrega presencial, confirmar `ENTREGUE`.

---

## 6. Fechamento de Turno (Fim do Dia) — `ADMIN_CINEMA`

- [ ] Executar `postShiftClosingReconciliationRoute` (`reconcileShiftClosing`) confrontando ingressos emitidos, vendas brutas de bilheteria + cantina, estornos `CDC_ARREPENDIMENTO` (`RF-12` / `RN-04`) e `PIX_TARDIO` (`RN-01`);
- [ ] Confirmar `discrepancyCents === 0` (`balanced: true`) e arquivar relatório do turno;
- [ ] Disparar coleta de snapshot lógico + checksum SHA-256 pós-fechamento (`RNF-05`).
