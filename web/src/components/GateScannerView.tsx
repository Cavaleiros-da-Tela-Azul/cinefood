import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ClipboardList,
  QrCode,
  ScanLine,
  ShieldAlert,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import {
  ClientTicketOrder,
  GateScanRecord,
  MovieItem,
  SessionSlot,
} from '../data/cinemaData';

function playGateAudioCue(outcome: GateScanRecord['outcome']) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = outcome === 'LIBERADO' ? 'sine' : 'square';
    osc.frequency.setValueAtTime(outcome === 'LIBERADO' ? 880 : 220, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 250);
  } catch {
    // Silencioso em navegadores sem suporte ou bloqueio de autoplay
  }
}

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<{
    outcome: GateScanRecord['outcome'];
    title: string;
    detail: string;
    order?: ClientTicketOrder;
    triggeredKitchenPrep: boolean;
  } | null>(null);

  const commitScanResult = (result: {
    outcome: GateScanRecord['outcome'];
    title: string;
    detail: string;
    order?: ClientTicketOrder;
    triggeredKitchenPrep: boolean;
  }) => {
    setLastResult(result);
    if (soundEnabled) {
      playGateAudioCue(result.outcome);
    }
  };

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
        commitScanResult({
          outcome: 'CANCELADO',
          title: 'Assento Cancelado (CDC)',
          detail: `O QR individual ${cleaned} (poltrona ${matchedSeatToken.seatId}) foi cancelado e não é válido para entrada.`,
          order: matchedOrder,
          triggeredKitchenPrep: false,
        });
        return;
      }

      if (matchedSeatToken && matchedSeatToken.status === 'UTILIZADO') {
        commitScanResult({
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
        commitScanResult({
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
          commitScanResult({
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
          commitScanResult({
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
    commitScanResult(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(tokenInput);
  };

  const pendingOrders = orders.filter((o) => o.status === 'ATIVO' && !o.checkedIn);
  const checkedInCount = orders.filter((o) => o.checkedIn).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Scanner + Validation Panel */}
        <section className="space-y-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-5 shadow-xl sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
                RN-02 · Check-in Atômico
              </p>
              <h2 className="font-display mt-1 text-2xl font-bold uppercase tracking-tight text-[var(--text-primary)] sm:text-3xl">
                Portaria &amp; Leitor QR
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Validação single-use por QR do pedido ou QR individual do assento em sessões{' '}
                <span className="font-mono text-emerald-300">ATIVA</span>. Ao liberar combo na
                poltrona, a Cantina KDS inicia o preparo (<span className="font-mono">RN-02</span>).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                aria-pressed={soundEnabled}
                className={`cine-press inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  soundEnabled
                    ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{soundEnabled ? 'Som Ativo' : 'Som Mudo'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCameraActive((prev) => !prev)}
                aria-pressed={cameraActive}
                className={`cine-press inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  cameraActive
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                <ScanLine className="h-4 w-4" aria-hidden="true" />
                {cameraActive ? 'Leitor Óptico Ativo' : 'Simular Câmera'}
              </button>
            </div>
          </div>

          {/* Optical Reticle Viewfinder */}
          {cameraActive && (
            <div className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-emerald-400/40 bg-[#050709] p-5 shadow-inner">
              <div className="gate-scan-line" aria-hidden="true" />
              {/* Reticle Corner Brackets */}
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                  <span className="absolute left-0 top-0 h-3 w-3 rounded-tl border-l-2 border-t-2 border-emerald-400" />
                  <span className="absolute right-0 top-0 h-3 w-3 rounded-tr border-r-2 border-t-2 border-emerald-400" />
                  <span className="absolute bottom-0 left-0 h-3 w-3 rounded-bl border-b-2 border-l-2 border-emerald-400" />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-br border-b-2 border-r-2 border-emerald-400" />
                  <QrCode className="h-7 w-7 text-emerald-300" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Mira de captura simulada pronta
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    Selecione um QR da fila rápida abaixo ou digite o token individual do assento.
                  </p>
                </div>
              </div>
              <span className="font-mono inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                CAM · 60 FPS
              </span>
            </div>
          )}

          {allSessions.length > 0 && (
            <div>
              <label
                htmlFor="gate-session-filter"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]"
              >
                Sessão / Portaria em Operação (opcional)
              </label>
              <select
                id="gate-session-filter"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
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
              className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]"
            >
              Código do QR Code / Token Individual do Assento
            </label>
            <div className="flex flex-col gap-2.5 sm:flex-row">
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
                className="cine-input min-h-[44px] flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5 font-mono text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                className="cine-press inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg transition hover:bg-[var(--brand-red-hover)]"
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
                Validar Entrada
              </button>
            </div>
          </form>

          {/* Quick-test chips */}
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Ingressos &amp; QR individuais na fila de leitura
            </p>
            <div className="flex flex-wrap gap-2">
              {orders.slice(0, 5).map((order) => (
                <React.Fragment key={order.id}>
                  <button
                    type="button"
                    onClick={() => handleScan(order.qrToken)}
                    className="cine-press inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-left transition hover:border-[var(--border-strong)]"
                  >
                    <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                      {order.qrToken}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
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
                      className="cine-press inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-left transition hover:border-[var(--border-strong)]"
                    >
                      <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                        {sq.qrToken}
                      </span>
                      <span className="font-mono rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                        {sq.seatId}
                      </span>
                    </button>
                  ))}
                </React.Fragment>
              ))}
              <button
                type="button"
                onClick={() => handleScan('CF-QR-9999-XX')}
                className="cine-press inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-red-400/25 bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-xs text-red-200 transition hover:border-red-400/50"
              >
                CF-QR-9999-XX (Inválido)
              </button>
            </div>
          </div>

          {/* Atomic Validation Feedback */}
          {lastResult && (
            <motion.div
              key={`${lastResult.outcome}-${lastResult.title}`}
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              role={lastResult.outcome === 'LIBERADO' ? 'status' : 'alert'}
              aria-live={lastResult.outcome === 'LIBERADO' ? 'polite' : 'assertive'}
              data-audio-feedback={soundEnabled ? lastResult.outcome : 'muted'}
              className={`space-y-3 rounded-2xl border p-4 shadow-lg ${
                lastResult.outcome === 'LIBERADO'
                  ? 'border-emerald-400/45 bg-emerald-500/12 text-emerald-100'
                  : lastResult.outcome === 'DUPLICADO'
                    ? 'border-amber-400/45 bg-amber-500/14 text-amber-100'
                    : 'border-red-400/45 bg-red-500/14 text-red-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {lastResult.outcome === 'LIBERADO' ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                  ) : lastResult.outcome === 'DUPLICADO' ? (
                    <ShieldAlert className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-red-300" aria-hidden="true" />
                  )}
                  <h3 className="text-sm font-bold uppercase tracking-[0.08em]">
                    {lastResult.title}
                  </h3>
                </div>
                <span className="font-mono rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-bold">
                  {lastResult.outcome}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{lastResult.detail}</p>

              {lastResult.order && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-2.5 text-xs">
                  <span>
                    <strong className="text-[var(--text-primary)]">
                      {lastResult.order.movieTitle}
                    </strong>{' '}
                    · {lastResult.order.room} · Poltronas:{' '}
                    <span className="font-mono text-[var(--text-primary)]">
                      {lastResult.order.seatsLabel.join(', ')}
                    </span>
                  </span>
                  {lastResult.triggeredKitchenPrep && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/40 bg-emerald-400/20 px-2.5 py-1 font-semibold text-emerald-100">
                      <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
                      RN-02: Cantina KDS liberada (EM_PREPARO)
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </section>

        {/* Live Telemetry & Recent Gate Log */}
        <aside className="space-y-4 lg:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-4 shadow-md">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Aguardando entrada
              </p>
              <p className="font-mono-tabular mt-1 text-3xl font-bold text-[var(--text-primary)]">
                {pendingOrders.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-4 shadow-md">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Check-ins hoje
              </p>
              <p className="font-mono-tabular mt-1 text-3xl font-bold text-emerald-300">
                {checkedInCount}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-5 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                <ClipboardList className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                Log da Portaria
              </h3>
              <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
                {scanLog.length} leituras
              </span>
            </div>

            {scanLog.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--border-subtle)] py-6 text-center text-xs text-[var(--text-muted)]">
                Nenhuma leitura realizada nesta sessão de portaria.
              </p>
            ) : (
              <ul className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
                {scanLog.map((entry) => (
                  <li
                    key={entry.id}
                    className="space-y-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                        {entry.qrToken}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
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
