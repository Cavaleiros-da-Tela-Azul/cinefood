import { useState } from 'react';
import { Check, CheckCircle2, Copy, Moon, Popcorn, RotateCcw, Ticket } from 'lucide-react';
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
      className="h-40 w-40 rounded-lg bg-white p-2.5 sm:h-44 sm:w-44"
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
    <section className="mx-auto max-w-[960px] px-4 py-10 sm:px-8" aria-label="Ingresso Digital Emitido">
      <StepperBar current={4} />

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/15 bg-[var(--bg-elevated)] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/35 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-[var(--success-emerald)]" aria-hidden="true" />
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
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:border-white/40"
          >
            <Moon className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
            <span>{oledMode ? 'Desativar Modo OLED' : 'Ativar Modo Sala Escura (OLED)'}</span>
          </button>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded bg-[var(--brand-red)]/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#FCA5A5]">
                <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                {displayFormat} · {displayRoom}
              </span>
              {order?.id && (
                <span className="font-mono-tabular rounded border border-white/15 bg-black/30 px-2.5 py-1 text-xs font-bold text-white">
                  Pedido {order.id}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl font-extrabold uppercase text-white sm:text-5xl">
              {displayTitle}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {displayComplex} · {displayDate} às{' '}
              <strong className="font-mono-tabular text-white">{displayTime}</strong>
            </p>

            {hasCanteenItems && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 text-xs">
                <p className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[var(--amber-progress)]">
                  <Popcorn className="h-3.5 w-3.5" aria-hidden="true" />
                  Pedido da Cantina Vinculado
                </p>
                {order?.canteenSummary && (
                  <p className="mt-1 font-medium text-white">{order.canteenSummary}</p>
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

          {/* Individual QR Cards */}
          {isCanteenOnly ? (
            <div className="flex flex-col items-center rounded-xl border border-white/15 bg-black/30 p-5 text-center sm:max-w-xs">
              <span className="mb-3 rounded-full bg-[var(--amber-progress)]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FCD34D]">
                Retirada no Balcão
              </span>
              <DeterministicQrSvg
                seed={canteenPickupToken}
                label={`QR Code opaco de retirada na cantina ${canteenPickupToken}`}
              />
              <code className="font-mono-tabular mt-3 rounded border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-bold tracking-wider text-white select-all">
                {canteenPickupToken}
              </code>
              <button
                type="button"
                onClick={() => handleCopyToken(canteenPickupToken)}
                className="mt-2.5 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/20 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10"
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
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                QR Codes Individuais por Assento ({seatQrTokens.length})
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {seatQrTokens.map((seatToken) => {
                  const seatMeta = selectedSeats.find((s) => s.seatId === seatToken.seatId);
                  return (
                    <div
                      key={seatToken.qrToken}
                      className="flex flex-col items-center rounded-xl border border-white/15 bg-black/30 p-4 text-center"
                    >
                      <div className="mb-3 flex w-full items-center justify-between gap-2">
                        <span className="font-mono-tabular rounded-md border border-[var(--brand-red)]/50 bg-[var(--brand-red)]/15 px-2.5 py-1 text-xs font-bold text-white">
                          Assento {seatToken.seatId}
                          {seatMeta ? ` · ${seatMeta.tier.toUpperCase()}` : ''}
                        </span>
                        <span className="rounded bg-[var(--success-emerald)]/20 px-2 py-0.5 text-[11px] font-bold text-[#6EE7B7]">
                          {seatToken.status}
                        </span>
                      </div>

                      <DeterministicQrSvg
                        seed={seatToken.qrToken}
                        label={`QR Code opaco do ingresso CineFood assento ${seatToken.seatId} (${seatToken.qrToken})`}
                      />

                      <code className="font-mono-tabular mt-3 w-full break-all rounded border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs font-bold tracking-wider text-white select-all">
                        {seatToken.qrToken}
                      </code>

                      <button
                        type="button"
                        onClick={() => handleCopyToken(seatToken.qrToken)}
                        className="mt-2.5 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
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
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onGoToOrders}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
        >
          <Ticket className="h-4 w-4" aria-hidden="true" />
          <span>Ver em Meus Ingressos</span>
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:border-white/40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Iniciar Nova Simulação</span>
        </button>
      </div>
    </section>
  );
}
