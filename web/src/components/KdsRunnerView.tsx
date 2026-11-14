import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock,
  Lock,
  MoonStar,
  PackageCheck,
  Send,
  Truck,
} from 'lucide-react';
import {
  CANTEEN_STATUS_LABEL,
  CanteenOrderStatus,
  ClientTicketOrder,
  RUNNER_INCIDENT_LABELS,
  RunnerIncident,
  RunnerIncidentReason,
  StaffRoleGroup,
} from '../data/cinemaData';

export interface KdsRunnerViewProps {
  orders: ClientTicketOrder[];
  incidents: RunnerIncident[];
  staffRole?: StaffRoleGroup;
  onAdvanceCanteenStatus: (orderId: string, nextStatus: CanteenOrderStatus) => void;
  onRegisterIncident: (incident: Omit<RunnerIncident, 'id' | 'createdAt' | 'operator'>) => void;
}

export const KdsRunnerView: React.FC<KdsRunnerViewProps> = ({
  orders,
  incidents,
  staffRole = 'ADMIN_CINEMA',
  onAdvanceCanteenStatus,
  onRegisterIncident,
}) => {
  const canAccessKds = staffRole === 'ADMIN_CINEMA' || staffRole === 'OPERADOR_CANTINA';
  const canAccessRunner = staffRole === 'ADMIN_CINEMA' || staffRole === 'RUNNER';

  const [surfaceTab, setSurfaceTab] = useState<'kds' | 'runner'>(
    canAccessKds ? 'kds' : 'runner',
  );
  const [incidentOrderId, setIncidentOrderId] = useState('');
  const [incidentReason, setIncidentReason] =
    useState<RunnerIncidentReason>('CLIENTE_AUSENTE');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [incidentFormKey, setIncidentFormKey] = useState(0);
  const [incidentFeedback, setIncidentFeedback] = useState<string | null>(null);

  const resolvedSurfaceTab: 'kds' | 'runner' =
    surfaceTab === 'kds' && !canAccessKds
      ? 'runner'
      : surfaceTab === 'runner' && !canAccessRunner
        ? 'kds'
        : surfaceTab;

  const canteenOrders = orders.filter(
    (o) => o.canteenSummary && o.canteenStatus !== 'NENHUM' && o.status !== 'CANCELADO',
  );

  // Runner queue strictly restricted to seat-delivery orders in PRONTO or SAIU_PARA_ENTREGA
  const runnerQueue = canteenOrders.filter(
    (o) =>
      o.deliveryMode === 'seat' &&
      (o.canteenStatus === 'PRONTO' || o.canteenStatus === 'SAIU_PARA_ENTREGA'),
  );

  const selectedIncidentOrder =
    runnerQueue.find((o) => o.id === incidentOrderId) ?? runnerQueue[0];

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentOrder) return;

    onRegisterIncident({
      orderId: selectedIncidentOrder.id,
      room: selectedIncidentOrder.room,
      seatLabel: selectedIncidentOrder.seatsLabel.join(', '),
      reason: incidentReason,
      notes:
        incidentNotes.trim() ||
        'Ocorrência registrada em sala escura pelo Runner de plantão.',
    });

    if (incidentReason === 'CLIENTE_AUSENTE') {
      onAdvanceCanteenStatus(selectedIncidentOrder.id, 'RETIRADA_NO_BALCAO');
    }

    setIncidentNotes('');
    setIncidentFormKey((k) => k + 1);
    setIncidentFeedback(
      incidentReason === 'CLIENTE_AUSENTE'
        ? `RN-03 aplicada: pedido ${selectedIncidentOrder.id} (${selectedIncidentOrder.seatsLabel.join(', ')}) convertido para RETIRADA_NO_BALCAO com aviso ao cliente.`
        : `Ocorrência registrada para ${selectedIncidentOrder.id} (${selectedIncidentOrder.seatsLabel.join(', ')}).`,
    );
  };

  return (
    <div className="space-y-5">
      {/* Sub-mode switcher: Cozinha KDS vs Runner Sala Escura OLED */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
            RF-09 · RF-20 · RN-02 · RN-03 · KDS &amp; Runner
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[var(--text-primary)] mt-0.5">
            Cantina KDS &amp; Runner Sala Escura
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Visão da Cantina e Runner"
          className="inline-flex rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-1 gap-1"
        >
          <button
            type="button"
            role="tab"
            disabled={!canAccessKds}
            aria-selected={resolvedSurfaceTab === 'kds'}
            onClick={() => canAccessKds && setSurfaceTab('kds')}
            className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.1em] transition ${
              !canAccessKds
                ? 'opacity-40 text-[var(--text-muted)] cursor-not-allowed'
                : resolvedSurfaceTab === 'kds'
                  ? 'bg-[var(--brand-red)] text-white cursor-pointer'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer'
            }`}
          >
            {canAccessKds ? <ChefHat className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            Cozinha KDS ({canteenOrders.length})
          </button>
          <button
            type="button"
            role="tab"
            disabled={!canAccessRunner}
            aria-selected={resolvedSurfaceTab === 'runner'}
            onClick={() => canAccessRunner && setSurfaceTab('runner')}
            className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.1em] transition ${
              !canAccessRunner
                ? 'opacity-40 text-[var(--text-muted)] cursor-not-allowed'
                : resolvedSurfaceTab === 'runner'
                  ? 'bg-black text-amber-300 border border-amber-400/50 cursor-pointer'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer'
            }`}
          >
            {canAccessRunner ? <MoonStar className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            Runner · OLED ({runnerQueue.length})
          </button>
        </div>
      </div>

      {resolvedSurfaceTab === 'kds' ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {canteenOrders.map((order) => {
            const blockedByRn02 =
              order.deliveryMode === 'seat' && order.canteenStatus === 'AGUARDANDO_CHEGADA';
            const pendingPayment = order.canteenStatus === 'PENDENTE_PAGAMENTO';

            return (
              <article
                key={order.id}
                className={`rounded-xl border p-5 flex flex-col justify-between gap-4 ${
                  blockedByRn02
                    ? 'bg-[var(--bg-surface)]/80 border-amber-400/35'
                    : order.canteenStatus === 'ENTREGUE'
                      ? 'bg-[var(--bg-surface)]/55 border-emerald-500/25'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                        {order.id}
                      </span>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                        {order.canteenSummary}
                      </h3>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold uppercase px-2 py-1 rounded ${
                        order.canteenStatus === 'AGUARDANDO_CHEGADA' ||
                        order.canteenStatus === 'PENDENTE_PAGAMENTO'
                          ? 'bg-amber-500/20 text-amber-200'
                          : order.canteenStatus === 'EM_PREPARO'
                            ? 'bg-blue-500/20 text-blue-200'
                            : order.canteenStatus === 'PRONTO'
                              ? 'bg-sky-500/20 text-sky-200'
                              : order.canteenStatus === 'SAIU_PARA_ENTREGA' ||
                                  order.canteenStatus === 'RETIRADA_NO_BALCAO'
                                ? 'bg-purple-500/20 text-purple-200'
                                : 'bg-emerald-500/20 text-emerald-200'
                      }`}
                    >
                      {order.canteenStatus}
                    </span>
                  </div>

                  <div className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--text-secondary)] space-y-1">
                    <p>
                      <strong className="text-[var(--text-primary)]">{order.room}</strong> · Poltronas:{' '}
                      <span className="font-mono text-[var(--text-primary)]">
                        {order.seatsLabel.length > 0 ? order.seatsLabel.join(', ') : 'Balcão'}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Sessão {order.time} · Canal:{' '}
                      {order.deliveryMode === 'seat'
                        ? 'Entrega na Poltrona'
                        : 'Retirada no Balcão'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {CANTEEN_STATUS_LABEL[order.canteenStatus]}
                    </p>
                  </div>

                  {blockedByRn02 && (
                    <div className="rounded-lg bg-amber-500/12 border border-amber-400/35 p-3 flex items-start gap-2 text-xs text-amber-100">
                      <Lock className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>
                        <strong>Bloqueado pela RN-02 — aguardando validação na portaria.</strong>{' '}
                        O preparo inicia automaticamente quando o QR{' '}
                        <span className="font-mono">{order.qrToken}</span> passar pela Portaria.
                      </span>
                    </div>
                  )}

                  {order.canteenStatus === 'RETIRADA_NO_BALCAO' && (
                    <div className="rounded-lg bg-purple-500/12 border border-purple-400/35 p-2.5 text-xs text-purple-100">
                      Disponível no balcão (<strong>RN-03</strong>). Aguardando retirada pelo titular.
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
                  {order.canteenStatus === 'EM_PREPARO' && (
                    <button
                      type="button"
                      onClick={() => onAdvanceCanteenStatus(order.id, 'PRONTO')}
                      className="w-full min-h-[44px] py-2.5 px-3 rounded-lg bg-[var(--brand-red)] hover:bg-[var(--brand-red-hover)] text-white text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4" />
                      Marcar Pronto (PRONTO)
                    </button>
                  )}

                  {order.canteenStatus === 'PRONTO' && (
                    <button
                      type="button"
                      onClick={() =>
                        onAdvanceCanteenStatus(
                          order.id,
                          order.deliveryMode === 'seat'
                            ? 'SAIU_PARA_ENTREGA'
                            : 'RETIRADA_NO_BALCAO',
                        )
                      }
                      className="w-full min-h-[44px] py-2.5 px-3 rounded-lg bg-[var(--brand-red)] hover:bg-[var(--brand-red-hover)] text-white text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      {order.deliveryMode === 'seat'
                        ? 'Despachar para Runner (SAIU_PARA_ENTREGA)'
                        : 'Liberar no Balcão (RETIRADA_NO_BALCAO)'}
                    </button>
                  )}

                  {(order.canteenStatus === 'SAIU_PARA_ENTREGA' ||
                    order.canteenStatus === 'RETIRADA_NO_BALCAO') && (
                    <button
                      type="button"
                      onClick={() => onAdvanceCanteenStatus(order.id, 'ENTREGUE')}
                      className="w-full min-h-[44px] py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Confirmar Entrega Concluída (ENTREGUE)
                    </button>
                  )}

                  {(blockedByRn02 || pendingPayment) && (
                    <button
                      type="button"
                      disabled
                      className="w-full min-h-[44px] py-2.5 px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {pendingPayment
                        ? 'Aguardando Confirmação de Pagamento'
                        : 'Aguardando Check-in na Portaria (RN-02)'}
                    </button>
                  )}

                  {order.canteenStatus === 'ENTREGUE' && (
                    <p className="w-full text-center text-xs text-emerald-300 font-semibold py-1">
                      Pedido entregue sem pendências
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        /* Runner OLED Dark Mode (forced #000000 surface per #17 & RF-09) */
        <section
          aria-label="Console Runner OLED Modo Sala Escura"
          className="rounded-2xl bg-black border border-amber-400/35 p-5 sm:p-6 space-y-6 text-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-400/40 flex items-center justify-center">
                <MoonStar className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-amber-300">
                  Modo Sala Escura OLED (#000000)
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Apenas pedidos para poltrona nos estados <span className="font-mono">PRONTO</span> ou{' '}
                  <span className="font-mono">SAIU_PARA_ENTREGA</span>.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-amber-200">
              {runnerQueue.length} entregas elegíveis
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Runner Delivery Cards */}
            <div className="lg:col-span-7 space-y-3">
              {runnerQueue.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-xs text-[var(--text-secondary)]">
                  Nenhuma entrega pronta ou em rota para poltrona no momento. Libere o check-in na
                  Portaria QR (RN-02) e conclua o preparo na Cozinha KDS.
                </div>
              ) : (
                runnerQueue.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl bg-[var(--bg-elevated)] border border-amber-400/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 font-bold">
                          {order.room}
                        </span>
                        <span className="font-mono text-sm font-bold text-white">
                          Poltrona {order.seatsLabel.join(', ')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {order.canteenSummary}
                      </p>
                      <p className="font-mono text-xs text-[var(--text-secondary)]">
                        Pedido {order.id} · Status: {order.canteenStatus}
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2 shrink-0">
                      {order.canteenStatus === 'PRONTO' && (
                        <button
                          type="button"
                          onClick={() => onAdvanceCanteenStatus(order.id, 'SAIU_PARA_ENTREGA')}
                          className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--brand-red)] hover:bg-[var(--brand-red-hover)] text-white text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Truck className="w-4 h-4" />
                          Iniciar Entrega
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onAdvanceCanteenStatus(order.id, 'ENTREGUE')}
                        className="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar Entrega
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncidentOrderId(order.id)}
                        className="min-h-[44px] px-3 py-2 rounded-lg bg-[var(--bg-surface)] hover:border-[var(--border-strong)] border border-[var(--border-subtle)] text-amber-200 text-xs font-semibold cursor-pointer"
                      >
                        Selecionar Ocorrência
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* RF-20 + RN-03 Runner Incident Form */}
            <div className="lg:col-span-5 space-y-4">
              <form
                key={incidentFormKey}
                onSubmit={handleIncidentSubmit}
                className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                    Registrar Ocorrência em Sala (RF-20 · RN-03)
                  </h4>
                </div>

                <div>
                  <label
                    htmlFor="runner-order"
                    className="block text-xs text-[var(--text-secondary)] mb-1"
                  >
                    Pedido Elegível em Entrega (Poltrona)
                  </label>
                  <select
                    id="runner-order"
                    value={selectedIncidentOrder?.id ?? ''}
                    onChange={(e) => setIncidentOrderId(e.target.value)}
                    disabled={runnerQueue.length === 0}
                    className="w-full min-h-[44px] rounded-lg bg-black border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-[var(--focus-ring)] disabled:opacity-50"
                  >
                    {runnerQueue.length === 0 ? (
                      <option value="">Nenhum pedido elegível (PRONTO / SAIU_PARA_ENTREGA)</option>
                    ) : (
                      runnerQueue.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.id} — {o.room} ({o.seatsLabel.join(', ')}) [{o.canteenStatus}]
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="runner-reason"
                    className="block text-xs text-[var(--text-secondary)] mb-1"
                  >
                    Motivo Operacional
                  </label>
                  <select
                    id="runner-reason"
                    value={incidentReason}
                    onChange={(e) =>
                      setIncidentReason(e.target.value as RunnerIncidentReason)
                    }
                    className="w-full min-h-[44px] rounded-lg bg-black border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-[var(--focus-ring)]"
                  >
                    {(Object.keys(RUNNER_INCIDENT_LABELS) as RunnerIncidentReason[]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {RUNNER_INCIDENT_LABELS[key]}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {incidentReason === 'CLIENTE_AUSENTE' && (
                  <div className="rounded-lg bg-amber-500/12 border border-amber-400/35 p-2.5 text-xs text-amber-100">
                    <strong>Regra RN-03:</strong> ao registrar ausência do cliente no assento, o
                    pedido é convertido automaticamente para{' '}
                    <span className="font-mono">RETIRADA_NO_BALCAO</span> e o titular recebe um
                    aviso interno.
                  </div>
                )}

                <div>
                  <label
                    htmlFor="runner-notes"
                    className="block text-xs text-[var(--text-secondary)] mb-1"
                  >
                    Observação para a Supervisão
                  </label>
                  <textarea
                    id="runner-notes"
                    rows={2}
                    required
                    minLength={5}
                    value={incidentNotes}
                    onChange={(e) => setIncidentNotes(e.target.value)}
                    placeholder="Ex: Poltrona G7 vazia; combo mantido aquecido no balcão."
                    className="cine-input w-full rounded-lg bg-black border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-xs text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedIncidentOrder}
                  className="w-full min-h-[44px] py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold uppercase tracking-[0.12em] inline-flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Registrar Ocorrência
                </button>

                {incidentFeedback && (
                  <p role="status" className="text-xs text-emerald-300 font-medium">
                    {incidentFeedback}
                  </p>
                )}
              </form>

              <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  Histórico de Ocorrências ({incidents.length})
                </h4>
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {incidents.map((inc) => (
                    <li
                      key={inc.id}
                      className="rounded-lg bg-black border border-[var(--border-subtle)] p-2.5 text-xs space-y-1"
                    >
                      <div className="flex justify-between font-mono text-amber-200">
                        <span>
                          {inc.id} · {inc.orderId} ({inc.seatLabel})
                        </span>
                        <span className="text-[var(--text-muted)]">{inc.createdAt}</span>
                      </div>
                      <p className="text-white/90">{inc.notes}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
