import React, { useState } from 'react';
import {
  CheckCircle2,
  QrCode,
  ScanLine,
  ShieldAlert,
  Sparkles,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import { ClientTicketOrder, GateScanRecord } from '../data/cinemaData';

interface GateScannerViewProps {
  orders: ClientTicketOrder[];
  scanLog: GateScanRecord[];
  onValidateQr: (token: string) => {
    outcome: GateScanRecord['outcome'];
    title: string;
    detail: string;
    order?: ClientTicketOrder;
    triggeredKitchenPrep: boolean;
  };
}

export const GateScannerView: React.FC<GateScannerViewProps> = ({
  orders,
  scanLog,
  onValidateQr,
}) => {
  const [tokenInput, setTokenInput] = useState('CF-QR-8492-NE');
  const [formKey, setFormKey] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [lastResult, setLastResult] = useState<{
    outcome: GateScanRecord['outcome'];
    title: string;
    detail: string;
    order?: ClientTicketOrder;
    triggeredKitchenPrep: boolean;
  } | null>(null);

  const handleScan = (rawToken: string) => {
    const cleaned = rawToken.trim().toUpperCase();
    if (!cleaned) return;
    const result = onValidateQr(cleaned);
    setLastResult(result);
    setTokenInput(cleaned);
    setFormKey((k) => k + 1);
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
        <section className="lg:col-span-7 bg-[#15171F] border border-white/10 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
                RF-06 · RN-02 · Check-in Atômico
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mt-1">
                Portaria &amp; Leitor QR
              </h2>
              <p className="text-xs text-white/65 mt-1">
                Validação single-use do ingresso na entrada da sala. Ao liberar combo de entrega na
                poltrona, o pedido avança automaticamente para preparo na Cantina KDS.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCameraActive((prev) => !prev)}
              aria-pressed={cameraActive}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                cameraActive
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'
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
                  <p className="text-xs text-white/60">
                    Selecione um ingresso da fila rápida abaixo ou leia o código manualmente.
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-200">
                CAM · 60 FPS
              </span>
            </div>
          )}

          <form key={formKey} onSubmit={handleSubmit} className="space-y-3">
            <label
              htmlFor="gate-qr-token"
              className="block text-xs uppercase tracking-[0.16em] text-white/65 font-semibold"
            >
              Código do QR Code / Token do Ingresso
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
                placeholder="Ex: CF-QR-8492-NE"
                className="cine-input flex-1 rounded-lg bg-[#0D0E12] border border-white/15 px-3.5 py-2.5 font-mono text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C40A14] hover:bg-[#a50811] text-white text-xs font-bold uppercase tracking-[0.14em] transition cursor-pointer shrink-0"
              >
                <QrCode className="w-4 h-4" />
                Validar Entrada
              </button>
            </div>
          </form>

          {/* Quick-test chips synced live with orders */}
          <div className="space-y-2 pt-1">
            <p className="text-xs uppercase tracking-[0.16em] text-white/65 font-semibold">
              Ingressos na fila / cenários rápidos de leitura
            </p>
            <div className="flex flex-wrap gap-2">
              {orders.slice(0, 6).map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => handleScan(order.qrToken)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0D0E12] border border-white/12 hover:border-white/30 text-left transition cursor-pointer"
                >
                  <span className="font-mono text-xs text-white font-semibold">
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
              ))}
              <button
                type="button"
                onClick={() => handleScan('CF-QR-9999-XX')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D0E12] border border-red-400/25 hover:border-red-400/50 font-mono text-xs text-red-200 transition cursor-pointer"
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
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>
                    <strong className="text-white">{lastResult.order.movieTitle}</strong> ·{' '}
                    {lastResult.order.room} · Poltronas:{' '}
                    <span className="font-mono text-white">
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
            <div className="bg-[#15171F] border border-white/10 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-white/70">
                Aguardando entrada
              </p>
              <p className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                {pendingOrders.length}
              </p>
            </div>
            <div className="bg-[#15171F] border border-white/10 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-white/70">
                Check-ins hoje
              </p>
              <p className="font-mono text-2xl font-bold text-emerald-300 mt-1 tabular-nums">
                {checkedInCount}
              </p>
            </div>
          </div>

          <div className="bg-[#15171F] border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white/75 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Log da Portaria
              </h3>
              <span className="font-mono text-xs text-white/65">
                {scanLog.length} leituras
              </span>
            </div>

            {scanLog.length === 0 ? (
              <p className="text-xs text-white/65 py-6 text-center border border-dashed border-white/10 rounded-lg">
                Nenhuma leitura realizada nesta sessão de portaria.
              </p>
            ) : (
              <ul className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {scanLog.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg bg-[#0D0E12] border border-white/10 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-white">
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
                    <p className="text-xs text-white/65">{entry.detail}</p>
                    <p className="font-mono text-xs text-white/65">{entry.timestamp}</p>
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
