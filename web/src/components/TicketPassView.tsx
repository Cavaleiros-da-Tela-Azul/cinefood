import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Armchair,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MapPin,
  Moon,
  Popcorn,
  RotateCcw,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import {
  CANTEEN_STATUS_LABEL,
  CanteenOrderStatus,
  ClientTicketOrder,
  MovieItem,
  SeatQrToken,
  SelectedSeat,
  SessionSlot,
} from '../data/cinemaData';
import { CartComboLine, DeliveryMode } from './CanteenSheet';
import { StepperBar } from './StepperBar';

export interface TicketPassViewProps {
  order?: ClientTicketOrder | null;
  movie?: MovieItem | null;
  session?: SessionSlot | null;
  selectedSeats: SelectedSeat[];
  cart: CartComboLine[];
  deliveryMode: DeliveryMode;
  paymentMethod: 'pix' | 'card';
  oledMode: boolean;
  onToggleOled: () => void;
  onGoToOrders: () => void;
  onGoToCanteen?: () => void;
  onRestart: () => void;
}

function DeterministicQrSvg({ seed, label }: { seed: string; label: string }) {
  const safeSeed = seed || 'CINEFOOD-QR';
  const cells = 15;
  const blocks: { x: number; y: number }[] = [];
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const inFinder =
        (x < 4 && y < 4) || (x >= cells - 4 && y < 4) || (x < 4 && y >= cells - 4);
      const hash = (safeSeed.charCodeAt((x + y) % safeSeed.length) * (x + 3) + y * 17) % 5;
      if (inFinder || hash < 2) {
        blocks.push({ x, y });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${cells} ${cells}`}
      className="h-40 w-40 rounded-xl bg-white p-2.5 shadow-inner sm:h-44 sm:w-44"
      role="img"
      aria-label={label}
    >
      {blocks.map((b) => (
        <rect key={`${b.x}-${b.y}`} x={b.x} y={b.y} width={0.9} height={0.9} fill="#0D0E12" />
      ))}
    </svg>
  );
}

export function TicketPassView({
  order,
  movie,
  session,
  selectedSeats,
  cart,
  deliveryMode,
  paymentMethod,
  oledMode,
  onToggleOled,
  onGoToOrders,
  onGoToCanteen,
  onRestart,
}: TicketPassViewProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const isCanteenOnly =
    order?.orderKind === 'canteen-only' ||
    (selectedSeats.length === 0 && (!order || order.seatQrTokens.length === 0));

  const fallbackSeatTokens: SeatQrToken[] = selectedSeats.map((s) => ({
    seatId: s.seatId,
    qrToken: order?.qrToken
      ? `${order.qrToken}-${s.seatId}`
      : `CF-QR-${(movie?.id ?? 'CF').slice(0, 2).toUpperCase()}-${s.seatId}`,
    status: 'ATIVO',
  }));

  const seatQrTokens: SeatQrToken[] =
    order && order.seatQrTokens && order.seatQrTokens.length > 0
      ? order.seatQrTokens
      : fallbackSeatTokens;

  const canteenPickupToken = order?.qrToken ?? 'CF-QR-CANTINA-BALCAO';

  const resolvedCanteenStatus: CanteenOrderStatus = order
    ? order.canteenStatus
    : cart.length === 0
      ? 'NENHUM'
      : deliveryMode === 'seat'
        ? 'AGUARDANDO_CHEGADA'
        : 'RETIRADA_NO_BALCAO';

  const displayTitle = isCanteenOnly
    ? 'PEDIDO DE CANTINA (BALCÃO)'
    : order?.movieTitle ?? movie?.title ?? 'INGRESSO CINEFOOD';
  const displayComplex = order?.complex ?? session?.complex ?? 'CineFood';
  const displayRoom = order?.room ?? session?.room ?? 'Balcão Expresso';
  const displayFormat = order?.format ?? session?.format ?? 'Cantina';
  const displayDate = order?.dateLabel ?? session?.dateLabel ?? 'Hoje';
  const displayTime = order?.time ?? session?.time ?? 'Retirada imediata';
  const hasCanteenItems = cart.length > 0 || Boolean(order?.canteenSummary) || isCanteenOnly;
  const backdropUrl = !isCanteenOnly ? movie?.backdropSrc : undefined;

  const handleCopyToken = (token: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(token).catch(() => {});
    }
    setCopiedToken(token);
    window.setTimeout(() => {
      setCopiedToken((prev) => (prev === token ? null : prev));
    }, 1800);
  };

  return (
    <section
      className={`relative min-h-[calc(100vh-80px)] overflow-x-clip px-4 py-8 sm:px-8 sm:py-10 ${
        oledMode ? 'bg-black' : ''
      }`}
      aria-label="Ingresso Digital Emitido"
    >
      {/* Atmospheric Backdrop (hidden in pure OLED theater mode) */}
      {!oledMode && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt=""
              className="h-full w-full scale-105 object-cover object-center opacity-20 blur-sm"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),transparent_60%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D0E12]/90 via-[#0D0E12]/88 to-[#0D0E12]" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-[960px]">
        <StepperBar current={4} />

        {/* Boarding Pass Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={`mt-8 overflow-hidden rounded-3xl border shadow-2xl ${
            oledMode
              ? 'border-white/20 bg-[#050507]'
              : 'border-white/15 bg-[var(--bg-elevated)]/92 backdrop-blur-md'
          }`}
        >
          {/* Status + OLED Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/45 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--success-emerald)]/35 bg-[var(--success-emerald)]/15 text-[var(--success-emerald)]">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--success-emerald)]">
                  {isCanteenOnly ? 'Pedido de cantina emitido' : 'Ingresso emitido'} via Sandbox (
                  {paymentMethod === 'pix' ? 'Pix' : 'Cartão'})
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isCanteenOnly
                    ? 'Apresente o QR Code abaixo no balcão da bomboniere para retirada.'
                    : 'Cada assento possui um QR Code individual para validação atômica única na portaria.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleOled}
              className="cine-press inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10"
            >
              <Moon className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
              <span>{oledMode ? 'Desativar Modo OLED' : 'Ativar Modo Sala Escura (OLED)'}</span>
            </button>
          </div>

          {/* Upper Boarding Pass Header */}
          <div className="relative overflow-hidden p-6 sm:p-8">
            {backdropUrl && !oledMode && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20">
                <img src={backdropUrl} alt="" className="h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-[var(--bg-elevated)]/80 to-transparent" />
              </div>
            )}

            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start">
              {movie?.posterSrc && !isCanteenOnly && (
                <img
                  src={movie.posterSrc}
                  alt={`Pôster de ${displayTitle}`}
                  className="hidden h-36 w-24 shrink-0 rounded-xl border border-white/15 object-cover shadow-xl sm:block"
                />
              )}

              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-red)]/45 bg-[var(--brand-red)]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FCA5A5]">
                    <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                    {displayFormat} · {displayRoom}
                  </span>
                  {order?.id && (
                    <span className="font-mono-tabular rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-bold text-white">
                      Pedido {order.id}
                    </span>
                  )}
                </div>

                <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">
                  {displayTitle}
                </h1>

                {/* 2x2 / 4-col Boarding Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/35 p-3.5 sm:grid-cols-4">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <MapPin className="h-3 w-3 text-[var(--brand-red)]" aria-hidden="true" />
                      Complexo
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-white">
                      {displayComplex}
                    </p>
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <Calendar className="h-3 w-3 text-[var(--amber-progress)]" aria-hidden="true" />
                      Data
                    </p>
                    <p className="font-mono-tabular mt-0.5 text-xs font-semibold text-white">
                      {displayDate}
                    </p>
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <Clock className="h-3 w-3 text-[var(--amber-progress)]" aria-hidden="true" />
                      Horário
                    </p>
                    <p className="font-mono-tabular mt-0.5 text-xs font-semibold text-white">
                      {displayTime}
                    </p>
                  </div>
                  <div>
                    <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <Armchair className="h-3 w-3 text-[var(--success-emerald)]" aria-hidden="true" />
                      {isCanteenOnly ? 'Entrega' : 'Assentos'}
                    </p>
                    <p className="font-mono-tabular mt-0.5 truncate text-xs font-semibold text-white">
                      {isCanteenOnly
                        ? 'Balcão Expresso'
                        : seatQrTokens.map((s) => s.seatId).join(', ') || '—'}
                    </p>
                  </div>
                </div>

                {/* Integrated Canteen Order Strip */}
                {hasCanteenItems && (
                  <div className="rounded-2xl border border-[var(--amber-progress)]/30 bg-[var(--amber-progress)]/8 p-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[var(--amber-progress)]">
                        <Popcorn className="h-4 w-4" aria-hidden="true" />
                        Pedido da Cantina Vinculado
                      </p>
                      <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-0.5 text-[11px] font-bold text-white">
                        {resolvedCanteenStatus}
                      </span>
                    </div>
                    {order?.canteenSummary && (
                      <p className="mt-1.5 font-medium text-white">{order.canteenSummary}</p>
                    )}
                    <p className="mt-1 text-[var(--text-secondary)]">
                      Status: <strong className="text-white">{resolvedCanteenStatus}</strong> —{' '}
                      {CANTEEN_STATUS_LABEL[resolvedCanteenStatus]}
                      {resolvedCanteenStatus === 'AGUARDANDO_CHEGADA' &&
                        ' (o preparo inicia automaticamente após validação de QR na portaria).'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Perforated Ticket Cutout Divider */}
          <div className="relative flex items-center" aria-hidden="true">
            <span
              className={`-ml-3 h-6 w-6 shrink-0 rounded-full border border-white/15 ${
                oledMode ? 'bg-black' : 'bg-[#0D0E12]'
              }`}
            />
            <div className="ticket-perforated-divider mx-3 flex-1" />
            <span
              className={`-mr-3 h-6 w-6 shrink-0 rounded-full border border-white/15 ${
                oledMode ? 'bg-black' : 'bg-[#0D0E12]'
              }`}
            />
          </div>

          {/* Lower QR Pass Area */}
          <div className="space-y-5 bg-black/25 p-6 sm:p-8">
            {isCanteenOnly ? (
              <div className="mx-auto flex max-w-xs flex-col items-center rounded-2xl border border-white/15 bg-black/45 p-6 text-center shadow-lg">
                <span className="mb-3 rounded-full bg-[var(--amber-progress)]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FCD34D]">
                  Retirada no Balcão
                </span>
                <div className="rounded-2xl bg-white p-2 shadow-lg">
                  <DeterministicQrSvg
                    seed={canteenPickupToken}
                    label={`QR Code opaco de retirada na cantina ${canteenPickupToken}`}
                  />
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Apresente no Balcão
                </p>
                <code className="font-mono-tabular mt-2 w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs font-bold tracking-wider text-white select-all">
                  {canteenPickupToken}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyToken(canteenPickupToken)}
                  className="cine-press mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {copiedToken === canteenPickupToken ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[var(--success-emerald)]" aria-hidden="true" />
                      <span>Token Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copiar Token</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    QR Codes Individuais por Assento ({seatQrTokens.length})
                  </p>
                  <span
                    role="note"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/10 px-3 py-1 text-[11px] font-semibold text-[#FDE68A]"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                    Uso único na portaria · Não compartilhe capturas
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {seatQrTokens.map((seatToken) => {
                    const seatMeta = selectedSeats.find((s) => s.seatId === seatToken.seatId);
                    const statusTone =
                      seatToken.status === 'ATIVO'
                        ? 'bg-[var(--success-emerald)]/20 text-[#6EE7B7] border-[var(--success-emerald)]/30'
                        : seatToken.status === 'CANCELADO'
                          ? 'bg-rose-500/20 text-rose-200 border-rose-500/30'
                          : 'bg-white/15 text-[var(--text-secondary)] border-white/15';
                    return (
                      <div
                        key={seatToken.qrToken}
                        className="flex flex-col items-center rounded-2xl border border-white/15 bg-black/45 p-4 text-center shadow-lg"
                      >
                        <div className="mb-3 flex w-full items-center justify-between gap-2">
                          <span className="font-mono-tabular rounded-lg border border-[var(--brand-red)]/50 bg-[var(--brand-red)]/15 px-2.5 py-1 text-xs font-bold text-white">
                            Assento {seatToken.seatId}
                            {seatMeta ? ` · ${seatMeta.tier.toUpperCase()}` : ''}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusTone}`}
                          >
                            {seatToken.status}
                          </span>
                        </div>

                        <div className="rounded-2xl bg-white p-1.5 shadow-md">
                          <DeterministicQrSvg
                            seed={seatToken.qrToken}
                            label={`QR Code opaco do ingresso CineFood assento ${seatToken.seatId} (${seatToken.qrToken})`}
                          />
                        </div>

                        <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                          Escaneie na Portaria
                        </p>

                        <code className="font-mono-tabular mt-1.5 w-full break-all rounded-lg border border-white/15 bg-black/60 px-2.5 py-1.5 text-xs font-bold tracking-wider text-white select-all">
                          {seatToken.qrToken}
                        </code>

                        <button
                          type="button"
                          onClick={() => handleCopyToken(seatToken.qrToken)}
                          className="cine-press mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                        >
                          {copiedToken === seatToken.qrToken ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-[var(--success-emerald)]" aria-hidden="true" />
                              <span>Token Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Copiar Token para Portaria</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Post-ticket Guided Canteen Upsell */}
        {!isCanteenOnly && !hasCanteenItems && onGoToCanteen && (
          <aside
            aria-label="Convite de bomboniere com pré-vínculo de poltrona"
            className="mt-6 flex flex-col gap-4 rounded-2xl border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/10 p-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--amber-progress)]/35 bg-[var(--amber-progress)]/15 text-[var(--amber-progress)]">
                <Popcorn className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#FCD34D]">
                  Antecipe sua Bomboniere
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  Deseja pedir pipoca e bebidas com pré-vínculo{' '}
                  {seatQrTokens.length > 0
                    ? `às poltronas ${seatQrTokens.map((s) => s.seatId).join(', ')}`
                    : 'ao seu ingresso'}
                  ? O preparo começa automaticamente após a leitura do QR na portaria.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoToCanteen}
              className="cine-press inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--amber-progress)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0D0E12] shadow-lg transition hover:brightness-110"
            >
              <Popcorn className="h-4 w-4" aria-hidden="true" />
              <span>Antecipar Bomboniere com Pré-Vínculo</span>
            </button>
          </aside>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onGoToOrders}
            className="cine-press inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[var(--brand-red-hover)]"
          >
            <Ticket className="h-4 w-4" aria-hidden="true" />
            <span>Ver em Meus Ingressos</span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="cine-press inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:border-white/40 hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Iniciar Nova Simulação</span>
          </button>
        </div>
      </div>
    </section>
  );
}
