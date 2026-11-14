import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  QrCode,
  ScanLine,
  ShieldAlert,
  Sparkles,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import {
  ClientTicketOrder,
  GateScanRecord,
  MovieItem,
  SessionSlot,
} from '../data/cinemaData';

export interface GateScannerViewProps {
  orders: ClientTicketOrder[];
  movies?: MovieItem[];
  scanLog: GateScanRecord[];
  onValidateQr: (
    token: string,
    expectedSessionId?: string,
  ) => {
    outcome: GateScanRecord['outcome'];
    title: string;
    detail: string;
    order?: ClientTicketOrder;
    triggeredKitchenPrep: boolean;
  };
}

interface FlattenedSession {
  movie: MovieItem;
  session: SessionSlot;
}

export const GateScannerView: React.FC<GateScannerViewProps> = ({
  orders,
  movies = [],
  scanLog,
  onValidateQr,
}) => {
  const [tokenInput, setTokenInput] = useState('CF-QR-8492-NE');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ALL');
  const [formKey, setFormKey] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [lastResult, setLastResult] = useState<{
    outcome: GateScanRecord['outcome'];
    title: string;
    detail: string;
    order?: ClientTicketOrder;
    triggeredKitchenPrep: boolean;
  } | null>(null);

  const allSessions = useMemo<FlattenedSession[]>(
    () =>
      movies.flatMap((movie) =>
        movie.sessions.map((session) => ({ movie, session })),
      ),
    [movies],
  );

  const selectedSessionEntry = useMemo(
    () => allSessions.find((entry) => entry.session.id === selectedSessionId) ?? null,
    [allSessions, selectedSessionId],
  );

  const findOrderSession = (order: ClientTicketOrder): FlattenedSession | undefined => {
    const orderSessionId = (order as { sessionId?: string }).sessionId;
    if (orderSessionId) {
      const byId = allSessions.find((entry) => entry.session.id === orderSessionId);
      if (byId) return byId;
    }
    return allSessions.find(
      (entry) =>
        entry.movie.id === order.movieId &&
        entry.session.time === order.time &&
        entry.session.dateLabel === order.dateLabel &&
        entry.session.room === order.room,
    );
  };

  const handleScan = (rawToken: string) => {
    const cleaned = rawToken.trim().toUpperCase();
    if (!cleaned) return;
    setTokenInput(cleaned);
    setFormKey((k) => k + 1);

    const matchedOrder = orders.find(
      (o) =>
        o.qrToken.toUpperCase() === cleaned ||
        o.seatQrTokens?.some((sq) => sq.qrToken.toUpperCase() === cleaned),
    );

    if (matchedOrder) {
      const matchedSeatToken = matchedOrder.seatQrTokens?.find(
        (sq) => sq.qrToken.toUpperCase() === cleaned,
      );

      if (matchedSeatToken && matchedSeatToken.status === 'CANCELADO') {
        setLastResult({
          outcome: 'CANCELADO',
          title: 'Assento Cancelado (CDC)',
          detail: `O QR individual ${cleaned} (poltrona ${matchedSeatToken.seatId}) foi cancelado e não é válido para entrada.`,
          order: matchedOrder,
          triggeredKitchenPrep: false,
        });
        return;
      }

      if (matchedSeatToken && matchedSeatToken.status === 'UTILIZADO') {
        setLastResult({
          outcome: 'DUPLICADO',
          title: 'QR de Assento Já Utilizado',
          detail: `O QR individual ${cleaned} (poltrona ${matchedSeatToken.seatId}) já realizou check-in atômico nesta portaria.`,
          order: matchedOrder,
          triggeredKitchenPrep: false,
        });
        return;
      }

      const orderSession = findOrderSession(matchedOrder);
      if (orderSession && orderSession.session.status !== 'ATIVA') {
        setLastResult({
          outcome: 'INVALIDO',
          title: `Sessão ${orderSession.session.status}`,
          detail: `A sessão de ${orderSession.movie.title} (${orderSession.session.dateLabel} · ${orderSession.session.time}) está marcada como ${orderSession.session.status}. Entrada bloqueada.`,
          order: matchedOrder,
          triggeredKitchenPrep: false,
        });
        return;
      }

      if (selectedSessionEntry) {
        if (selectedSessionEntry.session.status !== 'ATIVA') {
          setLastResult({
            outcome: 'INVALIDO',
            title: `Portaria em Sessão ${selectedSessionEntry.session.status}`,
            detail: `A sessão selecionada nesta portaria (${selectedSessionEntry.session.time}) está ${selectedSessionEntry.session.status}.`,
            order: matchedOrder,
            triggeredKitchenPrep: false,
          });
          return;
        }

        const sameSession = orderSession
          ? orderSession.session.id === selectedSessionEntry.session.id
          : matchedOrder.movieId === selectedSessionEntry.movie.id &&
            matchedOrder.time === selectedSessionEntry.session.time &&
            matchedOrder.dateLabel === selectedSessionEntry.session.dateLabel &&
            matchedOrder.room === selectedSessionEntry.session.room;

        if (!sameSession) {
          setLastResult({
            outcome: 'INVALIDO',
            title: 'Ingresso de Outra Sessão',
            detail: `Ingresso ${matchedOrder.id} pertence a ${matchedOrder.movieTitle} (${matchedOrder.dateLabel} · ${matchedOrder.time} · ${matchedOrder.room}), incompatível com a portaria selecionada (${selectedSessionEntry.movie.title} · ${selectedSessionEntry.session.time}).`,
            order: matchedOrder,
            triggeredKitchenPrep: false,
          });
          return;
        }
      }
    }

    const expectedSessionId =
      selectedSessionId === 'ALL' ? undefined : selectedSessionId;
    const result = onValidateQr(cleaned, expectedSessionId);
    setLastResult(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(tokenInput);
  };

  const pendingOrders = orders.filter((o) => o.status === 'ATIVO' && !o.checkedIn);
  const checkedInCount = orders.filter((o) => o.checkedIn).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scanner + Validation Panel */}
        <section className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
                RF-06 · RN-02 · Check-in Atômico
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[var(--text-primary)] mt-1">
                Portaria &amp; Leitor QR
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Validação single-use por QR do pedido ou QR individual do assento em sessões{' '}
                <span className="font-mono text-emerald-300">ATIVA</span>. Ao liberar combo na
                poltrona, a Cantina KDS inicia o preparo (<span className="font-mono">RN-02</span>).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCameraActive((prev) => !prev)}
              aria-pressed={cameraActive}
              className={`min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                cameraActive
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              {cameraActive ? 'Leitor Óptico Ativo' : 'Simular Câmera'}
            </button>
          </div>

          {cameraActive && (
            <div className="relative overflow-hidden rounded-xl border border-emerald-400/35 bg-black p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg border-2 border-dashed border-emerald-400/70 flex items-center justify-center bg-emerald-500/10 shrink-0">
                  <QrCode className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-200">
                    Mira de captura simulada pronta
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Selecione um QR da fila rápida abaixo ou digite o token individual do assento.
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-200">
                CAM · 60 FPS
              </span>
            </div>
          )}

          {allSessions.length > 0 && (
            <div>
              <label
                htmlFor="gate-session-filter"
                className="block text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] font-semibold mb-1.5"
              >
                Sessão / Portaria em Operação (opcional)
              </label>
              <select
                id="gate-session-filter"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
              >
                <option value="ALL">Todas as sessões ATIVAS</option>
                {allSessions.map(({ movie, session }) => (
                  <option key={session.id} value={session.id}>
                    {movie.title} · {session.dateLabel} {session.time} · {session.room} ({session.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          <form key={formKey} onSubmit={handleSubmit} className="space-y-3">
            <label
              htmlFor="gate-qr-token"
              className="block text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] font-semibold"
            >
              Código do QR Code / Token Individual do Assento
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="gate-qr-token"
                type="text"
                required
                minLength={6}
                spellCheck={false}
                autoComplete="off"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Ex: CF-QR-8492-NE ou CF-QR-8492-NE-G7"
                className="cine-input flex-1 min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2.5 font-mono text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)]"
              />
              <button
                type="submit"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brand-red)] hover:bg-[var(--brand-red-hover)] text-white text-xs font-bold uppercase tracking-[0.14em] transition cursor-pointer shrink-0"
              >
                <QrCode className="w-4 h-4" />
                Validar Entrada
              </button>
            </div>
          </form>

          {/* Quick-test chips synced live with orders & seatQrTokens */}
          <div className="space-y-2 pt-1">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] font-semibold">
              Ingressos &amp; QR individuais na fila de leitura
            </p>
            <div className="flex flex-wrap gap-2">
              {orders.slice(0, 5).map((order) => (
                <React.Fragment key={order.id}>
                  <button
                    type="button"
                    onClick={() => handleScan(order.qrToken)}
                    className="min-h-[38px] inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-left transition cursor-pointer"
                  >
                    <span className="font-mono text-xs text-[var(--text-primary)] font-semibold">
                      {order.qrToken}
                    </span>
                    <span
                      className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                        order.status === 'CANCELADO'
                          ? 'bg-red-500/20 text-red-300'
                          : order.checkedIn
                            ? 'bg-amber-500/20 text-amber-200'
                            : 'bg-emerald-500/20 text-emerald-200'
                      }`}
                    >
                      {order.status === 'CANCELADO'
                        ? 'Cancelado'
                        : order.checkedIn
                          ? 'Já lido'
                          : 'Pronto'}
                    </span>
                  </button>
                  {(order.seatQrTokens ?? []).slice(0, 1).map((sq) => (
                    <button
                      key={sq.qrToken}
                      type="button"
                      onClick={() => handleScan(sq.qrToken)}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-left transition cursor-pointer"
                    >
                      <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                        {sq.qrToken}
                      </span>
                      <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-white/5 text-amber-200">
                        {sq.seatId}
                      </span>
                    </button>
                  ))}
                </React.Fragment>
              ))}
              <button
                type="button"
                onClick={() => handleScan('CF-QR-9999-XX')}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-red-400/25 hover:border-red-400/50 font-mono text-xs text-red-200 transition cursor-pointer"
              >
                CF-QR-9999-XX (Inválido)
              </button>
            </div>
          </div>

          {/* Atomic Validation Feedback */}
          {lastResult && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border p-4 space-y-2.5 ${
                lastResult.outcome === 'LIBERADO'
                  ? 'bg-emerald-500/12 border-emerald-400/40 text-emerald-100'
                  : lastResult.outcome === 'DUPLICADO'
                    ? 'bg-amber-500/14 border-amber-400/45 text-amber-100'
                    : 'bg-red-500/14 border-red-400/45 text-red-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {lastResult.outcome === 'LIBERADO' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                  ) : lastResult.outcome === 'DUPLICADO' ? (
                    <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-300 shrink-0" />
                  )}
                  <h3 className="text-sm font-bold uppercase tracking-[0.08em]">
                    {lastResult.title}
                  </h3>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/30">
                  {lastResult.outcome}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{lastResult.detail}</p>

              {lastResult.order && (
                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>
                    <strong className="text-[var(--text-primary)]">{lastResult.order.movieTitle}</strong> ·{' '}
                    {lastResult.order.room} · Poltronas:{' '}
                    <span className="font-mono text-[var(--text-primary)]">
                      {lastResult.order.seatsLabel.join(', ')}
                    </span>
                  </span>
                  {lastResult.triggeredKitchenPrep && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 font-semibold">
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      RN-02: Cantina KDS liberada (EM_PREPARO)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Live Telemetry & Recent Gate Log */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Aguardando entrada
              </p>
              <p className="font-mono text-2xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">
                {pendingOrders.length}
              </p>
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Check-ins hoje
              </p>
              <p className="font-mono text-2xl font-bold text-emerald-300 mt-1 tabular-nums">
                {checkedInCount}
              </p>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Log da Portaria
              </h3>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {scanLog.length} leituras
              </span>
            </div>

            {scanLog.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center border border-dashed border-[var(--border-subtle)] rounded-lg">
                Nenhuma leitura realizada nesta sessão de portaria.
              </p>
            ) : (
              <ul className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {scanLog.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                        {entry.qrToken}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          entry.outcome === 'LIBERADO'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : entry.outcome === 'DUPLICADO'
                              ? 'bg-amber-500/20 text-amber-200'
                              : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {entry.outcome}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{entry.detail}</p>
                    <p className="font-mono text-xs text-[var(--text-muted)]">{entry.timestamp}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
