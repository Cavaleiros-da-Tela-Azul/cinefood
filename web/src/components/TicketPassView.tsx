import { CheckCircle2, Moon, Popcorn, RotateCcw, Ticket } from 'lucide-react';
import { MovieItem, SelectedSeat, SessionSlot } from '../data/cinemaData';
import { CartComboLine, DeliveryMode } from './CanteenSheet';
import { StepperBar } from './StepperBar';

interface TicketPassViewProps {
  movie: MovieItem;
  session: SessionSlot;
  selectedSeats: SelectedSeat[];
  cart: CartComboLine[];
  deliveryMode: DeliveryMode;
  paymentMethod: 'pix' | 'card';
  oledMode: boolean;
  onToggleOled: () => void;
  onGoToOrders: () => void;
  onRestart: () => void;
}

function DeterministicQrSvg({ seed }: { seed: string }) {
  const cells = 15;
  const blocks: { x: number; y: number }[] = [];
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const inFinder =
        (x < 4 && y < 4) || (x >= cells - 4 && y < 4) || (x < 4 && y >= cells - 4);
      const hash = (seed.charCodeAt((x + y) % seed.length) * (x + 3) + y * 17) % 5;
      if (inFinder || hash < 2) {
        blocks.push({ x, y });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${cells} ${cells}`}
      className="h-44 w-44 rounded-lg bg-white p-2.5"
      role="img"
      aria-label="QR Code opaco do ingresso CineFood"
    >
      {blocks.map((b) => (
        <rect key={`${b.x}-${b.y}`} x={b.x} y={b.y} width={0.9} height={0.9} fill="#0D0E12" />
      ))}
    </svg>
  );
}

export function TicketPassView({
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
  const tokenSeed = `CF-${movie.id}-${session.id}-${selectedSeats.map((s) => s.seatId).join('-')}`;

  return (
    <section className="mx-auto max-w-[920px] px-4 py-10 sm:px-8" aria-label="Ingresso Digital Emitido">
      <StepperBar current={4} />

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/15 bg-[var(--bg-elevated)] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/35 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-[var(--success-emerald)]" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--success-emerald)]">
                Ingresso emitido via Sandbox ({paymentMethod === 'pix' ? 'Pix' : 'Cartão'})
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Apresente este QR Code na portaria para validação atômica única.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleOled}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white hover:border-white/40"
          >
            <Moon className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
            <span>{oledMode ? 'Desativar Modo OLED' : 'Ativar Modo Sala Escura (OLED)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded bg-[var(--brand-red)]/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#FCA5A5]">
              <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
              {session.format} · {session.room}
            </div>
            <h1 className="font-display text-4xl font-extrabold uppercase text-white sm:text-5xl">
              {movie.title}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {session.complex} · {session.dateLabel} às{' '}
              <strong className="font-mono-tabular text-white">{session.time}</strong>
            </p>

            <div className="flex flex-wrap gap-2">
              {selectedSeats.map((s) => (
                <span
                  key={s.seatId}
                  className="font-mono-tabular rounded-md border border-[var(--brand-red)]/50 bg-[var(--brand-red)]/15 px-3 py-1.5 text-xs font-bold text-white"
                >
                  Assento {s.seatId} · {s.tier.toUpperCase()}
                </span>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 text-xs">
                <p className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[var(--amber-progress)]">
                  <Popcorn className="h-3.5 w-3.5" aria-hidden="true" />
                  Pedido da Cantina Vinculado
                </p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  {deliveryMode === 'seat'
                    ? 'Status: AGUARDANDO_CHEGADA — o preparo na cozinha inicia assim que seu QR passar na portaria.'
                    : 'Status: PRONTO_PARA_RETIRADA — retire no balcão expresso da bomboniere.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <DeterministicQrSvg seed={tokenSeed} />
            <span className="font-mono-tabular mt-2.5 text-[11px] tracking-widest text-[var(--text-muted)]">
              TOKEN OPACO · USO ÚNICO
            </span>
          </div>
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
