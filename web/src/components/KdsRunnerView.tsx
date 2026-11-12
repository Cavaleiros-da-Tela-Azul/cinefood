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
  CanteenOrderStatus,
  ClientTicketOrder,
  RUNNER_INCIDENT_LABELS,
  RunnerIncident,
  RunnerIncidentReason,
} from '../data/cinemaData';

interface KdsRunnerViewProps {
  orders: ClientTicketOrder[];
  incidents: RunnerIncident[];
  onAdvanceCanteenStatus: (orderId: string, nextStatus: CanteenOrderStatus) => void;
  onRegisterIncident: (incident: Omit<RunnerIncident, 'id' | 'createdAt' | 'operator'>) => void;
}

export const KdsRunnerView: React.FC<KdsRunnerViewProps> = ({
  orders,
  incidents,
  onAdvanceCanteenStatus,
  onRegisterIncident,
}) => {
  const [surfaceTab, setSurfaceTab] = useState<'kds' | 'runner'>('kds');
  const [incidentOrderId, setIncidentOrderId] = useState('');
  const [incidentReason, setIncidentReason] =
    useState<RunnerIncidentReason>('CLIENTE_AUSENTE');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [incidentFormKey, setIncidentFormKey] = useState(0);
  const [incidentFeedback, setIncidentFeedback] = useState<string | null>(null);

  const canteenOrders = orders.filter(
    (o) => o.canteenSummary && o.canteenStatus !== 'NENHUM' && o.status !== 'CANCELADO',
  );

  const runnerQueue = canteenOrders.filter(
    (o) =>
      o.deliveryMode === 'seat' &&
      (o.canteenStatus === 'EM_ENTREGA' || o.canteenStatus === 'EM_PREPARO'),
  );

  const selectedIncidentOrder =
    canteenOrders.find((o) => o.id === incidentOrderId) ??
    runnerQueue[0] ??
    canteenOrders[0];

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
    setIncidentNotes('');
    setIncidentFormKey((k) => k + 1);
    setIncidentFeedback(
      `Ocorrência registrada para ${selectedIncidentOrder.id} (${selectedIncidentOrder.seatsLabel.join(', ')}).`,
    );
  };

  return (
    <div className="space-y-5">
      {/* Sub-mode switcher: Cozinha KDS vs Runner Sala Escura OLED */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
            RF-09 · RF-20 · RN-03 · KDS &amp; Runner
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mt-0.5">
            Cantina KDS &amp; Runner Sala Escura
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Visão da Cantina e Runner"
          className="inline-flex rounded-xl bg-[#15171F] border border-white/10 p-1 gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={surfaceTab === 'kds'}
            onClick={() => setSurfaceTab('kds')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.1em] transition cursor-pointer ${
              surfaceTab === 'kds'
                ? 'bg-[#C40A14] text-white'
                : 'text-white/65 hover:text-white'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Cozinha KDS ({canteenOrders.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={surfaceTab === 'runner'}
            onClick={() => setSurfaceTab('runner')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.1em] transition cursor-pointer ${
              surfaceTab === 'runner'
                ? 'bg-black text-amber-300 border border-amber-400/50'
                : 'text-white/65 hover:text-white'
            }`}
          >
            <MoonStar className="w-4 h-4" />
            Runner · OLED ({runnerQueue.length})
          </button>
        </div>
      </div>

      {surfaceTab === 'kds' ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {canteenOrders.map((order) => {
            const blockedByRn03 =
              order.deliveryMode === 'seat' && order.canteenStatus === 'AGUARDANDO_CHEGADA';

            return (
              <article
                key={order.id}
                className={`rounded-xl border p-5 flex flex-col justify-between gap-4 ${
                  blockedByRn03
                    ? 'bg-[#15171F]/80 border-amber-400/35'
                    : order.canteenStatus === 'ENTREGUE'
                      ? 'bg-[#15171F]/50 border-emerald-500/25'
                      : 'bg-[#15171F] border-white/12'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-white">{order.id}</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        {order.canteenSummary}
                      </h3>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold uppercase px-2 py-1 rounded ${
                        order.canteenStatus === 'AGUARDANDO_CHEGADA'
                          ? 'bg-amber-500/20 text-amber-200'
                          : order.canteenStatus === 'EM_PREPARO'
                            ? 'bg-blue-500/20 text-blue-200'
                            : order.canteenStatus === 'EM_ENTREGA' ||
                                order.canteenStatus === 'PRONTO_RETIRADA'
                              ? 'bg-purple-500/20 text-purple-200'
                              : 'bg-emerald-500/20 text-emerald-200'
                      }`}
                    >
                      {order.canteenStatus}
                    </span>
                  </div>

                  <div className="rounded-lg bg-[#0D0E12] border border-white/8 p-3 text-xs text-white/75 space-y-1">
                    <p>
                      <strong className="text-white">{order.room}</strong> · Poltronas:{' '}
                      <span className="font-mono text-white">{order.seatsLabel.join(', ')}</span>
                    </p>
                    <p className="text-xs text-white/70">
                      Sessão {order.time} · Canal:{' '}
                      {order.deliveryMode === 'seat'
                        ? 'Entrega na Poltrona'
                        : 'Retirada no Balcão'}
                    </p>
                  </div>

                  {blockedByRn03 && (
                    <div className="rounded-lg bg-amber-500/12 border border-amber-400/35 p-3 flex items-start gap-2 text-xs text-amber-100">
                      <Lock className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>
                        <strong>Bloqueado pela RN-03 — aguardando validação na portaria.</strong>{' '}
                        O preparo inicia automaticamente quando o QR{' '}
                        <span className="font-mono">{order.qrToken}</span> passar pela Portaria.
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
                  {order.canteenStatus === 'EM_PREPARO' && (
                    <button
                      type="button"
                      onClick={() =>
                        onAdvanceCanteenStatus(
                          order.id,
                          order.deliveryMode === 'seat' ? 'EM_ENTREGA' : 'PRONTO_RETIRADA',
                        )
                      }
                      className="w-full py-2.5 px-3 rounded-lg bg-[#C40A14] hover:bg-[#a50811] text-white text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      {order.deliveryMode === 'seat'
                        ? 'Liberar para Runner (EM_ENTREGA)'
                        : 'Marcar Pronto no Balcão'}
                    </button>
                  )}

                  {(order.canteenStatus === 'EM_ENTREGA' ||
                    order.canteenStatus === 'PRONTO_RETIRADA') && (
                    <button
                      type="button"
                      onClick={() => onAdvanceCanteenStatus(order.id, 'ENTREGUE')}
                      className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Confirmar Entrega Concluída
                    </button>
                  )}

                  {blockedByRn03 && (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-3 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Aguardando Check-in na Portaria
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-400/40 flex items-center justify-center">
                <MoonStar className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-amber-300">
                  Modo Sala Escura OLED (#000000)
                </h3>
                <p className="text-xs text-white/60">
                  Baixa luminância para circulação nos corredores sem ofuscar a projeção.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-white/5 border border-white/15 text-amber-200">
              {runnerQueue.length} entregas em rota
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Runner Delivery Cards */}
            <div className="lg:col-span-7 space-y-3">
              {runnerQueue.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-xs text-white/70">
                  Nenhuma entrega ativa para poltrona no momento. Libere um combo na Portaria QR
                  e avance na Cozinha KDS.
                </div>
              ) : (
                runnerQueue.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl bg-[#070709] border border-amber-400/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                      <p className="text-sm font-semibold text-white/95">
                        {order.canteenSummary}
                      </p>
                      <p className="font-mono text-xs text-white/65">
                        Pedido {order.id} · Status: {order.canteenStatus}
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onAdvanceCanteenStatus(order.id, 'ENTREGUE')}
                        className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar Entrega
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncidentOrderId(order.id)}
                        className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-amber-200 text-xs font-semibold cursor-pointer"
                      >
                        Selecionar Ocorrência
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* RF-20 Runner Incident Form */}
            <div className="lg:col-span-5 space-y-4">
              <form
                key={incidentFormKey}
                onSubmit={handleIncidentSubmit}
                className="rounded-xl bg-[#070709] border border-white/15 p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                    Registrar Ocorrência em Sala (RF-20)
                  </h4>
                </div>

                <div>
                  <label
                    htmlFor="runner-order"
                    className="block text-xs text-white/60 mb-1"
                  >
                    Pedido / Poltrona
                  </label>
                  <select
                    id="runner-order"
                    value={selectedIncidentOrder?.id ?? ''}
                    onChange={(e) => setIncidentOrderId(e.target.value)}
                    className="w-full rounded-lg bg-black border border-white/20 px-3 py-2 text-xs text-white"
                  >
                    {canteenOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} — {o.room} ({o.seatsLabel.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="runner-reason"
                    className="block text-xs text-white/60 mb-1"
                  >
                    Motivo Operacional
                  </label>
                  <select
                    id="runner-reason"
                    value={incidentReason}
                    onChange={(e) =>
                      setIncidentReason(e.target.value as RunnerIncidentReason)
                    }
                    className="w-full rounded-lg bg-black border border-white/20 px-3 py-2 text-xs text-white"
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

                <div>
                  <label
                    htmlFor="runner-notes"
                    className="block text-xs text-white/60 mb-1"
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
                    className="cine-input w-full rounded-lg bg-black border border-white/20 px-3 py-2 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedIncidentOrder}
                  className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-[0.12em] inline-flex items-center justify-center gap-2 transition cursor-pointer"
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

              <div className="rounded-xl bg-[#070709] border border-white/10 p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">
                  Histórico de Ocorrências ({incidents.length})
                </h4>
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {incidents.map((inc) => (
                    <li
                      key={inc.id}
                      className="rounded-lg bg-black border border-white/10 p-2.5 text-xs space-y-1"
                    >
                      <div className="flex justify-between font-mono text-amber-200">
                        <span>
                          {inc.id} · {inc.orderId} ({inc.seatLabel})
                        </span>
                        <span className="text-white/65">{inc.createdAt}</span>
                      </div>
                      <p className="text-white/85">{inc.notes}</p>
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
