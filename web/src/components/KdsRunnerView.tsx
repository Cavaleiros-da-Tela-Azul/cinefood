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

const KDS_HEADER_TONE: Record<CanteenOrderStatus, string> = {
  NENHUM: 'bg-white/5 border-white/10 text-[var(--text-secondary)]',
  AGUARDANDO_CHEGADA: 'bg-amber-500/20 border-amber-400/35 text-amber-200',
  PENDENTE_PAGAMENTO: 'bg-amber-500/20 border-amber-400/35 text-amber-200',
  EM_PREPARO: 'bg-blue-500/20 border-blue-400/35 text-blue-200',
  PRONTO: 'bg-sky-500/20 border-sky-400/35 text-sky-200',
  SAIU_PARA_ENTREGA: 'bg-purple-500/20 border-purple-400/35 text-purple-200',
  RETIRADA_NO_BALCAO: 'bg-purple-500/20 border-purple-400/35 text-purple-200',
  ENTREGUE: 'bg-emerald-500/20 border-emerald-400/35 text-emerald-200',
  CANCELADO: 'bg-rose-500/20 border-rose-400/35 text-rose-200',
};

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
            RN-02 · RN-03 · KDS &amp; Runner
          </p>
          <h2 className="font-display mt-0.5 text-2xl font-bold uppercase tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Cantina KDS &amp; Runner Sala Escura
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Visão da Cantina e Runner"
          className="inline-flex gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5"
        >
          <button
            type="button"
            role="tab"
            disabled={!canAccessKds}
            aria-selected={resolvedSurfaceTab === 'kds'}
            onClick={() => canAccessKds && setSurfaceTab('kds')}
            className={`cine-press inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition ${
              !canAccessKds
                ? 'cursor-not-allowed text-[var(--text-muted)] opacity-40'
                : resolvedSurfaceTab === 'kds'
                  ? 'cursor-pointer bg-[var(--brand-red)] text-white shadow-sm'
                  : 'cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {canAccessKds ? (
              <ChefHat className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Cozinha KDS ({canteenOrders.length})
          </button>
          <button
            type="button"
            role="tab"
            disabled={!canAccessRunner}
            aria-selected={resolvedSurfaceTab === 'runner'}
            onClick={() => canAccessRunner && setSurfaceTab('runner')}
            className={`cine-press inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition ${
              !canAccessRunner
                ? 'cursor-not-allowed text-[var(--text-muted)] opacity-40'
                : resolvedSurfaceTab === 'runner'
                  ? 'cursor-pointer border border-amber-400/50 bg-black text-amber-300 shadow-sm'
                  : 'cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {canAccessRunner ? (
              <MoonStar className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Runner · OLED ({runnerQueue.length})
          </button>
        </div>
      </div>

      {resolvedSurfaceTab === 'kds' ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {canteenOrders.map((order) => {
            const blockedByRn02 =
              order.deliveryMode === 'seat' && order.canteenStatus === 'AGUARDANDO_CHEGADA';
            const pendingPayment = order.canteenStatus === 'PENDENTE_PAGAMENTO';
            const headerTone = KDS_HEADER_TONE[order.canteenStatus];

            return (
              <article
                key={order.id}
                className={`flex flex-col justify-between overflow-hidden rounded-2xl border shadow-lg transition ${
                  blockedByRn02
                    ? 'border-amber-400/35 bg-[var(--bg-surface)]/85'
                    : order.canteenStatus === 'ENTREGUE'
                      ? 'border-emerald-500/25 bg-[var(--bg-surface)]/65'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                }`}
              >
                <div>
                  {/* Color-coded KDS Ticket Header Band */}
                  <div
                    className={`flex items-center justify-between gap-2 border-b px-4 py-3 ${headerTone}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold">{order.id}</span>
                      <span className="text-[11px] font-semibold opacity-85">
                        · {order.room}
                      </span>
                    </div>
                    <span className="font-mono rounded-full bg-black/35 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                      {order.canteenStatus}
                    </span>
                  </div>

                  {/* Ticket Body */}
                  <div className="space-y-3 p-5">
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">
                        {order.canteenSummary}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Sessão {order.time} · Canal:{' '}
                        {order.deliveryMode === 'seat'
                          ? 'Entrega na Poltrona'
                          : 'Retirada no Balcão'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs">
                      <span className="font-semibold text-[var(--text-secondary)]">
                        Destino
                      </span>
                      <span className="font-mono rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
                        {order.seatsLabel.length > 0
                          ? `Poltrona ${order.seatsLabel.join(', ')}`
                          : 'Balcão Expresso'}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-muted)]">
                      {CANTEEN_STATUS_LABEL[order.canteenStatus]}
                    </p>

                    {blockedByRn02 && (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-400/35 bg-amber-500/12 p-3 text-xs text-amber-100">
                        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                        <span>
                          <strong>Bloqueado pela RN-02 — aguardando validação na portaria.</strong>{' '}
                          O preparo inicia automaticamente quando o QR{' '}
                          <span className="font-mono">{order.qrToken}</span> passar pela Portaria.
                        </span>
                      </div>
                    )}

                    {order.canteenStatus === 'RETIRADA_NO_BALCAO' && (
                      <div className="rounded-xl border border-purple-400/35 bg-purple-500/12 p-2.5 text-xs text-purple-100">
                        Disponível no balcão (<strong>RN-03</strong>). Aguardando retirada pelo titular.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] bg-black/20 p-4">
                  {order.canteenStatus === 'EM_PREPARO' && (
                    <button
                      type="button"
                      onClick={() => onAdvanceCanteenStatus(order.id, 'PRONTO')}
                      className="cine-press inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-3 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[var(--brand-red-hover)]"
                    >
                      <ChefHat className="h-4 w-4" aria-hidden="true" />
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
                      className="cine-press inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-3 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[var(--brand-red-hover)]"
                    >
                      <Truck className="h-4 w-4" aria-hidden="true" />
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
                      className="cine-press inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-emerald-500"
                    >
                      <PackageCheck className="h-4 w-4" aria-hidden="true" />
                      Confirmar Entrega Concluída (ENTREGUE)
                    </button>
                  )}

                  {(blockedByRn02 || pendingPayment) && (
                    <button
                      type="button"
                      disabled
                      className="inline-flex min-h-[44px] w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)]"
                    >
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {pendingPayment
                        ? 'Aguardando Confirmação de Pagamento'
                        : 'Aguardando Check-in na Portaria (RN-02)'}
                    </button>
                  )}

                  {order.canteenStatus === 'ENTREGUE' && (
                    <p className="w-full py-1 text-center text-xs font-semibold text-emerald-300">
                      Pedido entregue sem pendências
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        /* Runner OLED Dark Mode (#000000 surface) */
        <section
          aria-label="Console Runner OLED Modo Sala Escura"
          className="space-y-6 rounded-2xl border border-amber-400/35 bg-black p-5 text-white shadow-2xl sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15">
                <MoonStar className="h-5 w-5 text-amber-300" aria-hidden="true" />
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
            <span className="font-mono rounded-full border border-amber-400/30 bg-[#0B0C10] px-3 py-1 text-xs font-bold text-amber-200">
              {runnerQueue.length} entregas elegíveis
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Active Runner Delivery Cards */}
            <div className="space-y-3 lg:col-span-7">
              {runnerQueue.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#050507] p-6 text-center text-xs text-[var(--text-secondary)]">
                  Nenhuma entrega pronta ou em rota para poltrona no momento. Libere o check-in na
                  Portaria QR (RN-02) e conclua o preparo na Cozinha KDS.
                </div>
              ) : (
                runnerQueue.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-400/35 bg-[#090A0E] p-4 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono rounded-lg bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-200">
                          {order.room}
                        </span>
                        <span className="font-mono text-base font-extrabold text-amber-300">
                          Poltrona {order.seatsLabel.join(', ')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">{order.canteenSummary}</p>
                      <p className="font-mono text-xs text-[var(--text-secondary)]">
                        Pedido {order.id} · Status: {order.canteenStatus}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                      {order.canteenStatus === 'PRONTO' && (
                        <button
                          type="button"
                          onClick={() => onAdvanceCanteenStatus(order.id, 'SAIU_PARA_ENTREGA')}
                          className="cine-press inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[var(--brand-red-hover)]"
                        >
                          <Truck className="h-4 w-4" aria-hidden="true" />
                          Iniciar Entrega
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onAdvanceCanteenStatus(order.id, 'ENTREGUE')}
                        className="cine-press inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Confirmar Entrega
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncidentOrderId(order.id)}
                        className="cine-press inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-black px-3 py-2 text-xs font-semibold text-amber-200 hover:border-amber-400/50"
                      >
                        Selecionar Ocorrência
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* RN-03 Runner Incident Form */}
            <div className="space-y-4 lg:col-span-5">
              <form
                key={incidentFormKey}
                onSubmit={handleIncidentSubmit}
                className="space-y-3 rounded-2xl border border-white/15 bg-[#090A0E] p-4"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-300" aria-hidden="true" />
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                    Registrar Ocorrência em Sala (RN-03)
                  </h4>
                </div>

                <div>
                  <label
                    htmlFor="runner-order"
                    className="mb-1 block text-xs text-[var(--text-secondary)]"
                  >
                    Pedido Elegível em Entrega (Poltrona)
                  </label>
                  <select
                    id="runner-order"
                    value={selectedIncidentOrder?.id ?? ''}
                    onChange={(e) => setIncidentOrderId(e.target.value)}
                    disabled={runnerQueue.length === 0}
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-base text-white focus:border-[var(--focus-ring)] focus:outline-none disabled:opacity-50 sm:text-xs"
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
                    className="mb-1 block text-xs text-[var(--text-secondary)]"
                  >
                    Motivo Operacional
                  </label>
                  <select
                    id="runner-reason"
                    value={incidentReason}
                    onChange={(e) =>
                      setIncidentReason(e.target.value as RunnerIncidentReason)
                    }
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-base text-white focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
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
                  <div className="rounded-xl border border-amber-400/35 bg-amber-500/12 p-3 text-xs text-amber-100">
                    <strong>Regra RN-03:</strong> ao registrar ausência do cliente no assento, o
                    pedido é convertido automaticamente para{' '}
                    <span className="font-mono">RETIRADA_NO_BALCAO</span> e o titular recebe um
                    aviso interno.
                  </div>
                )}

                <div>
                  <label
                    htmlFor="runner-notes"
                    className="mb-1 block text-xs text-[var(--text-secondary)]"
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
                    className="cine-input w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-base text-white placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedIncidentOrder}
                  className="cine-press inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  Registrar Ocorrência
                </button>

                {incidentFeedback && (
                  <p role="status" className="text-xs font-medium text-emerald-300">
                    {incidentFeedback}
                  </p>
                )}
              </form>

              <div className="space-y-2.5 rounded-2xl border border-white/15 bg-[#090A0E] p-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  Histórico de Ocorrências ({incidents.length})
                </h4>
                <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {incidents.map((inc) => (
                    <li
                      key={inc.id}
                      className="space-y-1 rounded-xl border border-white/10 bg-black p-2.5 text-xs"
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
