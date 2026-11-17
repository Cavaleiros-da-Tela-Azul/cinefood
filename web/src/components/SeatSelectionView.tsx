import { useEffect, useRef, useState } from 'react';
import {
  Accessibility,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Lock,
  MapPin,
  Popcorn,
  RotateCcw,
  Timer,
  Users,
  X,
} from 'lucide-react';
import {
  MEIA_CATEGORIES,
  MeiaCategory,
  MovieItem,
  ROWS_ORDER,
  SeatNode,
  SelectedSeat,
  SessionSlot,
  TicketTier,
} from '../data/cinemaData';
import { StepperBar } from './StepperBar';

export interface SeatSelectionViewProps {
  movie: MovieItem;
  session: SessionSlot;
  seats: SeatNode[];
  selectedSeats: SelectedSeat[];
  onToggleSeat: (seat: SeatNode) => void;
  onChangeTier: (seatId: string, tier: TicketTier) => void;
  onChangeMeiaDetails: (seatId: string, meiaCategory: MeiaCategory, meiaDoc: string) => void;
  onRemoveSeat: (seatId: string) => void;
  secondsLeft: number;
  onSimulateExpire: () => void;
  onRenewLock: () => void;
  onExpireRelease: () => void;
  onBack: () => void;
  onNext: () => void;
}

const FOCUS_RING_CLASS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]';

function formatTimer(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function SeatSelectionView({
  movie,
  session,
  seats,
  selectedSeats,
  onToggleSeat,
  onChangeTier,
  onChangeMeiaDetails,
  onRemoveSeat,
  secondsLeft,
  onSimulateExpire,
  onRenewLock,
  onExpireRelease,
  onBack,
  onNext,
}: SeatSelectionViewProps) {
  const rows = ROWS_ORDER.filter((r) => seats.some((s) => s.row === r));
  const isCriticalTime = secondsLeft <= 120;
  const isExpired = secondsLeft === 0 && selectedSeats.length > 0;
  const expireDialogRef = useRef<HTMLDialogElement>(null);

  const [seatViewMode, setSeatViewMode] = useState<'compact' | 'spacious'>('spacious');
  const [meiaValidationAttempted, setMeiaValidationAttempted] = useState(false);
  const [touchedMeiaDocs, setTouchedMeiaDocs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const dialog = expireDialogRef.current;
    if (!dialog) return;
    if (isExpired && !dialog.open) {
      dialog.showModal();
    } else if (!isExpired && dialog.open) {
      dialog.close();
    }
  }, [isExpired]);

  const invalidMeiaSeats = selectedSeats.filter(
    (s) => s.tier === 'meia' && (s.meiaDoc ?? '').trim().length < 4,
  );

  useEffect(() => {
    if (invalidMeiaSeats.length === 0 && meiaValidationAttempted) {
      setMeiaValidationAttempted(false);
    }
  }, [invalidMeiaSeats.length, meiaValidationAttempted]);

  const handleProceedCheckout = () => {
    if (selectedSeats.length === 0 || isExpired) return;
    if (invalidMeiaSeats.length > 0) {
      setMeiaValidationAttempted(true);
      const firstInput = document.getElementById(`meia-doc-${invalidMeiaSeats[0].seatId}`);
      firstInput?.focus();
      return;
    }
    onNext();
  };

  const ticketsTotal = selectedSeats.reduce((acc, s) => {
    const unit = s.tier === 'meia' ? session.basePrice * 0.5 : session.basePrice;
    return acc + unit;
  }, 0);

  const lockProgressRatio = Math.max(0, Math.min(1, secondsLeft / 600));
  const availableCount = seats.filter((s) => s.status === 'available').length;

  return (
    <section
      className="relative min-h-[calc(100dvh-68px)] overflow-x-hidden bg-[var(--bg-base)] pb-32 lg:pb-14"
      aria-label="Seleção de assentos"
    >
      {/* Full-bleed fixed atmospheric cinema backdrop matching Hero & Sessões */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src={movie.backdropSrc}
          alt=""
          decoding="async"
          className="h-full w-full object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)]/95 via-[var(--bg-base)]/80 to-[var(--bg-base)]/92" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-[var(--bg-base)]/75" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 pt-6 sm:px-8 sm:pt-8">
        {/* Top Navigation + Stepper Rail */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`cine-press inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/65 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] backdrop-blur-md hover:border-[var(--border-strong)] hover:text-white ${FOCUS_RING_CLASS}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Voltar às Sessões</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[var(--bg-elevated)]/65 px-3 py-1.5 backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-[var(--brand-red)]" aria-hidden="true" />
              <span className="truncate font-medium text-white">{session.complex}</span>
            </span>
            <span className="font-mono-tabular inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[var(--bg-elevated)]/65 px-3 py-1.5 backdrop-blur-md">
              <Users className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
              <span>{availableCount} livres</span>
            </span>
          </div>
        </div>

        <div className="mt-5">
          <StepperBar current={1} />
        </div>

        {/* 3-Column CineHub Desktop Architecture (02_ref1 + 02_ref2 + 02_ref3) */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)_340px] xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          {/* LEFT RAIL: Poster + Session Facts + 10-Min Lock Timer */}
          <aside className="order-2 flex flex-col gap-4 lg:order-1">
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/75 p-4 backdrop-blur-md shadow-2xl">
              <div className="flex gap-4 lg:flex-col">
                <div className="w-24 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/40 lg:w-full">
                  <img
                    src={movie.posterSrc}
                    alt={`Pôster de ${movie.title}`}
                    className="aspect-[2/3] w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--amber-progress)]">
                      {session.format} · {session.room}
                    </p>
                    <h2 className="font-display mt-1 line-clamp-2 text-2xl font-extrabold uppercase leading-none text-white">
                      {movie.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
                    <div className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2">
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        <Calendar className="h-3 w-3 text-[var(--amber-progress)]" aria-hidden="true" />
                        Data
                      </span>
                      <span className="font-mono-tabular mt-0.5 block font-bold text-white">
                        {session.dayNumber} {session.monthLabel}
                      </span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2">
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        <Clock className="h-3 w-3 text-[var(--amber-progress)]" aria-hidden="true" />
                        Horário
                      </span>
                      <span className="font-mono-tabular mt-0.5 block font-bold text-white">
                        {session.time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>Ocupação da sala</span>
                    <span className="font-mono-tabular font-bold text-white">{session.occupancyPct}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 10-Min Lock Timer Card */}
            <div
              className={`rounded-2xl border p-4 backdrop-blur-md transition-colors ${
                isCriticalTime
                  ? 'border-[var(--brand-red)]/60 bg-[var(--brand-red)]/15'
                  : 'border-[var(--amber-progress)]/40 bg-[var(--bg-elevated)]/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                  <Timer className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                  Trava de Reserva
                </span>
                <span
                  role="timer"
                  aria-label={`Tempo restante da trava de reserva: ${formatTimer(secondsLeft)}`}
                  className={`font-mono-tabular text-xl font-extrabold ${
                    isCriticalTime ? 'text-[#FCA5A5]' : 'text-[#FCD34D]'
                  }`}
                >
                  {formatTimer(secondsLeft)}
                </span>
              </div>

              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full origin-left rounded-full transition-transform duration-500 ease-linear ${
                    isCriticalTime ? 'bg-[var(--brand-red)]' : 'bg-[var(--amber-progress)]'
                  }`}
                  style={{ transform: `scaleX(${lockProgressRatio})` }}
                />
              </div>

              {isCriticalTime && secondsLeft > 0 && (
                <p role="status" aria-live="polite" className="mt-2 text-[11px] font-semibold text-[#FCA5A5]">
                  Aviso: restam menos de 2 minutos antes da liberação da poltrona.
                </p>
              )}

              <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                Tempo restante para concluir ingressos e bomboniere sem perder seus assentos.
              </p>

              {selectedSeats.length > 0 && secondsLeft > 0 && (
                <button
                  type="button"
                  onClick={onSimulateExpire}
                  className={`mt-2 inline-flex min-h-[44px] items-center text-left text-[11px] font-semibold text-[var(--amber-progress)] underline-offset-2 hover:underline ${FOCUS_RING_CLASS}`}
                >
                  Simular fim da trava (00:00)
                </button>
              )}
            </div>
          </aside>

          {/* CENTER STAGE: Hero Banner Strip + Screen Arc + 96-Seat Matrix + Legend */}
          <div className="order-1 min-w-0 space-y-5 lg:order-2">
            {/* Ambient Movie Banner Strip (02_ref1) */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-xl">
              <img
                src={movie.backdropSrc}
                alt=""
                className="h-32 w-full object-cover object-center opacity-55 sm:h-40"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0D0E12]/95 via-[#0D0E12]/70 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--amber-progress)] backdrop-blur-md">
                    {session.complex}
                  </span>
                  <div
                    role="group"
                    aria-label="Densidade do mapa de assentos"
                    className="hidden items-center rounded-full border border-white/15 bg-black/60 p-0.5 backdrop-blur-md sm:inline-flex"
                  >
                    <button
                      type="button"
                      aria-pressed={seatViewMode === 'compact'}
                      onClick={() => setSeatViewMode('compact')}
                      className={`min-h-[32px] rounded-full px-3 text-[11px] font-semibold transition-colors ${FOCUS_RING_CLASS} ${
                        seatViewMode === 'compact' ? 'bg-[var(--brand-red)] text-white' : 'text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      Compacto
                    </button>
                    <button
                      type="button"
                      aria-pressed={seatViewMode === 'spacious'}
                      onClick={() => setSeatViewMode('spacious')}
                      className={`min-h-[32px] rounded-full px-3 text-[11px] font-semibold transition-colors ${FOCUS_RING_CLASS} ${
                        seatViewMode === 'spacious' ? 'bg-[var(--brand-red)] text-white' : 'text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      Espaçoso
                    </button>
                  </div>
                </div>

                <div>
                  <h1 className="font-display line-clamp-1 break-words text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
                    {movie.title}
                  </h1>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-white">
                      {session.format}
                    </span>
                    <span>{session.room}</span>
                    <span>·</span>
                    <span className="font-mono-tabular font-semibold text-white">
                      {session.dateLabel} · {session.time}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Seat Map Card */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/75 p-4 backdrop-blur-md shadow-2xl sm:p-6">
              {/* Angled Cinema Screen with Glow */}
              <div className="mx-auto w-full max-w-[460px] px-4">
                <div className="cinema-screen-arc h-9 w-full rounded-sm" />
                <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Tela da Sala · {session.format} · {seats.length} Poltronas (A–H)
                </p>
              </div>

              {/* Seat Matrix */}
              <div className="mt-7 overflow-x-auto pb-2">
                <div
                  className={`mx-auto flex w-fit flex-col px-1 sm:px-2 ${
                    seatViewMode === 'spacious' ? 'gap-2 sm:gap-2.5' : 'gap-1.5 sm:gap-1.5'
                  }`}
                >
                  {rows.map((row) => {
                    const rowSeats = seats
                      .filter((s) => s.row === row)
                      .sort((a, b) => a.col - b.col);
                    return (
                      <div
                        key={row}
                        className={`flex items-center ${
                          seatViewMode === 'spacious' ? 'gap-[3px] sm:gap-2' : 'gap-[3px] sm:gap-1.5'
                        }`}
                      >
                        <span className="font-mono-tabular w-4 text-right text-[11px] font-semibold text-[var(--text-muted)] sm:w-5 sm:text-xs">
                          {row}
                        </span>
                        <div
                          className={`flex items-center ${
                            seatViewMode === 'spacious' ? 'gap-[3px] sm:gap-2' : 'gap-[3px] sm:gap-1.5'
                          }`}
                        >
                          {rowSeats.map((seat) => {
                            const isSelected = selectedSeats.some((s) => s.seatId === seat.id);
                            const isOccupied = seat.status === 'occupied';
                            const isReserved = seat.status === 'reserved';
                            const isPcdPlus = seat.category === 'pcd-plus';
                            const isPcd = seat.category !== 'standard';
                            const disabled = isOccupied || isReserved;

                            let bgClass =
                              'bg-[var(--seat-available)] text-white/95 border border-white/15 hover:bg-[var(--seat-available-hover)] hover:border-white/35';
                            if (isOccupied) {
                              bgClass =
                                'bg-[var(--seat-occupied)] text-[var(--text-muted)] border border-white/5 cursor-not-allowed';
                            } else if (isReserved) {
                              bgClass =
                                'bg-[var(--seat-reserved)] text-rose-200/80 border border-rose-400/25 cursor-not-allowed';
                            } else if (isSelected) {
                              bgClass = isPcd
                                ? 'bg-[var(--brand-red)] text-white border border-white/30 ring-2 ring-[var(--pcd-blue)] ring-offset-1 ring-offset-[var(--bg-base)] shadow-[0_6px_16px_rgba(0,0,0,0.5)] scale-105'
                                : 'bg-[var(--brand-red)] text-white border border-white/30 shadow-[0_6px_16px_rgba(0,0,0,0.5)] scale-105';
                            } else if (isPcdPlus) {
                              bgClass =
                                'bg-[var(--pcd-blue)] text-white border border-sky-300/75 hover:bg-blue-500';
                            } else if (isPcd) {
                              bgClass =
                                'bg-[var(--pcd-blue)] text-white border border-sky-400/40 hover:bg-blue-500';
                            }

                            const sizeClass =
                              seatViewMode === 'spacious'
                                ? isPcdPlus
                                  ? 'h-[26px] w-[38px] sm:h-9 sm:w-12'
                                  : 'h-[26px] w-[23px] sm:h-9 sm:w-9'
                                : isPcdPlus
                                  ? 'h-[24px] w-[36px] sm:h-7 sm:w-10'
                                  : 'h-[24px] w-[22px] sm:h-7 sm:w-7';

                            return (
                              <button
                                key={seat.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => onToggleSeat(seat)}
                                aria-pressed={isSelected}
                                aria-label={`Poltrona ${seat.id}${
                                  seat.category === 'pcd-wheelchair'
                                    ? ' PCD Cadeirante'
                                    : isPcdPlus
                                      ? ' PCD Obeso 1.5x'
                                      : ''
                                } — ${
                                  isOccupied
                                    ? 'Ocupada'
                                    : isReserved
                                      ? 'Reservada'
                                      : isSelected
                                        ? 'Selecionada'
                                        : 'Disponível'
                                }`}
                                className={`cine-press relative flex ${sizeClass} items-center justify-center rounded-t-lg rounded-b-[4px] border-b-[3px] text-[10px] font-bold sm:text-[11px] ${bgClass} ${
                                  seat.col === 6 ? 'mr-1.5 sm:mr-5' : ''
                                } ${FOCUS_RING_CLASS}`}
                              >
                                {isSelected ? (
                                  isPcdPlus ? (
                                    <span className="inline-flex items-center gap-0.5">
                                      <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                                      <span className="text-[8px] font-extrabold leading-none sm:text-[9px]">
                                        1.5×
                                      </span>
                                    </span>
                                  ) : (
                                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                  )
                                ) : isOccupied ? (
                                  <X className="h-3 w-3 opacity-60" aria-hidden="true" />
                                ) : isReserved ? (
                                  <Lock className="h-3 w-3" aria-hidden="true" />
                                ) : isPcdPlus ? (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Accessibility className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    <span className="text-[8px] font-extrabold leading-none sm:text-[9px]">
                                      1.5×
                                    </span>
                                  </span>
                                ) : isPcd ? (
                                  <Accessibility className="h-3.5 w-3.5" aria-hidden="true" />
                                ) : (
                                  <span className="font-mono-tabular">{seat.col}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <span className="font-mono-tabular hidden w-4 text-left text-[11px] font-semibold text-[var(--text-muted)] sm:inline sm:w-5 sm:text-xs">
                          {row}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Multimodal Legend (WCAG 2.2 AA) */}
              <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-xs text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-t-[4px] rounded-b-[2px] border border-white/20 bg-[var(--seat-available)]" />
                  Disponível
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-t-[4px] rounded-b-[2px] bg-[var(--brand-red)] text-white">
                    <Check className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                  Selecionado
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-t-[4px] rounded-b-[2px] bg-[var(--seat-reserved)] text-rose-200">
                    <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                  Reservado 10m
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-t-[4px] rounded-b-[2px] bg-[var(--seat-occupied)] text-[var(--text-muted)]">
                    <X className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                  Ocupado
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-t-[4px] rounded-b-[2px] bg-[var(--pcd-blue)] text-white">
                    <Accessibility className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                  PCD Cadeirante
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex h-3.5 w-7 items-center justify-center gap-0.5 rounded-t-[4px] rounded-b-[2px] bg-[var(--pcd-blue)] px-1 text-[8px] font-extrabold text-white ring-1 ring-sky-300/75">
                    <Accessibility className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                    1.5×
                  </span>
                  PCD Obeso 1.5×
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT LEDGER: "Sua Seleção" + Meia-Entrada + Totals + Cantina Teaser (02_ref1) */}
          <aside className="order-3 flex min-w-0 flex-col gap-4">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-5 backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide text-white">
                  Sua Seleção
                </h2>
                <span className="font-mono-tabular rounded-full border border-white/15 bg-black/35 px-2.5 py-0.5 text-xs font-bold text-white">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'assento' : 'assentos'}
                </span>
              </div>

              {/* Selected Seats List */}
              <div className="mt-4 space-y-2.5">
                {selectedSeats.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/15 bg-black/25 p-5 text-center text-xs leading-relaxed text-[var(--text-secondary)]">
                    Selecione ao menos uma poltrona disponível no mapa ao lado para iniciar sua trava de 10 minutos.
                  </div>
                ) : (
                  selectedSeats.map((sel) => {
                    const unitPrice = sel.tier === 'meia' ? session.basePrice * 0.5 : session.basePrice;
                    const currentMeiaMeta =
                      MEIA_CATEGORIES.find((c) => c.id === (sel.meiaCategory ?? 'estudante')) ??
                      MEIA_CATEGORIES[0];
                    const docInputId = `meia-doc-${sel.seatId}`;
                    const docErrId = `meia-err-${sel.seatId}`;
                    const docLen = (sel.meiaDoc ?? '').trim().length;
                    const showDocError =
                      sel.tier === 'meia' &&
                      (meiaValidationAttempted || Boolean(touchedMeiaDocs[sel.seatId])) &&
                      docLen < 4;

                    return (
                      <div
                        key={sel.seatId}
                        className="flex flex-col gap-2.5 rounded-xl border border-white/15 bg-[var(--bg-surface)]/85 px-3.5 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-baseline gap-1.5 text-sm">
                            <span className="font-mono-tabular rounded bg-[var(--brand-red)]/20 px-2 py-0.5 text-xs font-extrabold text-white">
                              {sel.seatId}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                              Fileira {sel.row} · Assento {sel.col}
                            </span>
                            {sel.category === 'pcd-plus' && (
                              <span className="rounded bg-[var(--pcd-blue-soft)] px-1.5 py-0.5 text-[11px] font-bold text-[#93C5FD]">
                                PCD 1.5×
                              </span>
                            )}
                            {sel.category === 'pcd-wheelchair' && (
                              <span className="rounded bg-[var(--pcd-blue-soft)] px-1.5 py-0.5 text-[11px] font-bold text-[#93C5FD]">
                                PCD
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="font-mono-tabular text-xs font-bold text-white">
                              R$ {unitPrice}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemoveSeat(sel.seatId)}
                              aria-label={`Remover assento ${sel.seatId}`}
                              className={`cine-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-white/10 hover:text-white ${FOCUS_RING_CLASS}`}
                            >
                              <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        {/* Inteira / Meia-entrada (Lei 12.933/2013) */}
                        <div className="flex items-center gap-1.5" role="group" aria-label={`Modalidade do assento ${sel.seatId}`}>
                          <button
                            type="button"
                            aria-pressed={sel.tier === 'inteira'}
                            onClick={() => onChangeTier(sel.seatId, 'inteira')}
                            className={`cine-press min-h-[44px] flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${FOCUS_RING_CLASS} ${
                              sel.tier === 'inteira'
                                ? 'bg-white text-[#0D0E12]'
                                : 'bg-black/35 text-[var(--text-secondary)] hover:text-white'
                            }`}
                          >
                            Inteira (R$ {session.basePrice})
                          </button>
                          <button
                            type="button"
                            aria-pressed={sel.tier === 'meia'}
                            onClick={() => onChangeTier(sel.seatId, 'meia')}
                            className={`cine-press min-h-[44px] flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${FOCUS_RING_CLASS} ${
                              sel.tier === 'meia'
                                ? 'bg-white text-[#0D0E12]'
                                : 'bg-black/35 text-[var(--text-secondary)] hover:text-white'
                            }`}
                          >
                            Meia (R$ {session.basePrice * 0.5})
                          </button>
                        </div>

                        {sel.tier === 'meia' && (
                          <div className="mt-0.5 space-y-2.5 border-t border-white/10 pt-2.5">
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                              Categoria Legal (Lei 12.933/2013)
                              <select
                                value={sel.meiaCategory ?? 'estudante'}
                                onChange={(e) =>
                                  onChangeMeiaDetails(
                                    sel.seatId,
                                    e.target.value as MeiaCategory,
                                    sel.meiaDoc ?? '',
                                  )
                                }
                                className={`mt-1 block min-h-[44px] w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-2 text-base text-white sm:text-sm ${FOCUS_RING_CLASS}`}
                              >
                                {MEIA_CATEGORIES.map((cat) => (
                                  <option
                                    key={cat.id}
                                    value={cat.id}
                                    className="bg-[var(--bg-elevated)] text-white"
                                  >
                                    {cat.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <div>
                              <label
                                htmlFor={docInputId}
                                className="block text-[11px] font-semibold text-[var(--text-secondary)]"
                              >
                                Nº Documento / Carteira (obrigatório)
                              </label>
                              <input
                                id={docInputId}
                                type="text"
                                minLength={4}
                                value={sel.meiaDoc ?? ''}
                                placeholder={currentMeiaMeta.docHint}
                                aria-invalid={showDocError}
                                aria-describedby={showDocError ? docErrId : undefined}
                                onBlur={() =>
                                  setTouchedMeiaDocs((prev) => ({ ...prev, [sel.seatId]: true }))
                                }
                                onChange={(e) =>
                                  onChangeMeiaDetails(
                                    sel.seatId,
                                    sel.meiaCategory ?? 'estudante',
                                    e.target.value,
                                  )
                                }
                                className={`font-mono-tabular mt-1 block min-h-[44px] w-full rounded-lg border bg-black/50 px-2.5 py-2 text-base text-white placeholder:text-[var(--text-muted)] sm:text-sm ${FOCUS_RING_CLASS} ${
                                  showDocError
                                    ? 'border-rose-400 bg-rose-500/10'
                                    : 'border-white/15'
                                }`}
                              />
                              {showDocError && (
                                <p
                                  id={docErrId}
                                  role="alert"
                                  className="mt-1.5 flex items-center gap-1.5 text-xs text-[#FCA5A5]"
                                >
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                  <span>
                                    Informe ao menos 4 caracteres do documento de meia-entrada para a poltrona {sel.seatId}.
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {meiaValidationAttempted && invalidMeiaSeats.length > 0 && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/50 bg-rose-500/15 p-3 text-xs text-rose-100"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
                  <span>
                    Preencha o documento de meia-entrada (mín. 4 caracteres) para{' '}
                    <strong>{invalidMeiaSeats.map((s) => s.seatId).join(', ')}</strong> antes de avançar.
                  </span>
                </div>
              )}

              {/* Total & Desktop Primary Actions */}
              <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-4">
                <span className="text-sm text-[var(--text-secondary)]">Total ingressos</span>
                <span className="font-mono-tabular text-3xl font-extrabold text-white">R$ {ticketsTotal}</span>
              </div>

              <div className="mt-4 hidden grid-cols-[auto_1fr] gap-2.5 lg:grid">
                <button
                  type="button"
                  onClick={onBack}
                  className={`cine-press min-h-[44px] rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white hover:border-white/40 ${FOCUS_RING_CLASS}`}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={selectedSeats.length === 0 || isExpired}
                  onClick={handleProceedCheckout}
                  className={`cine-press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.45)] hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${FOCUS_RING_CLASS}`}
                >
                  <span>Avançar</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* CineHub-style Cantina Dine-In Preview Card (02_ref1) */}
            <div className="rounded-2xl border border-[var(--amber-progress)]/30 bg-gradient-to-br from-[var(--amber-progress)]/12 via-[var(--bg-elevated)]/85 to-[var(--bg-surface)]/85 p-4 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/15 text-[var(--amber-progress)]">
                  <Popcorn className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#FCD34D]">
                    Próxima etapa · Cantina Dine-In
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    Adicione combos com entrega na poltrona ou retirada expressa no balcão logo ao avançar.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Thumb-Zone Sticky Bottom Bar (mobile-native + 02_ref2/02_ref4) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-[var(--bg-glass)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text-secondary)]">
              <span>{selectedSeats.length} assento(s)</span>
              <span>·</span>
              <span
                className={`font-mono-tabular font-bold ${
                  isCriticalTime ? 'text-[#FCA5A5]' : 'text-[#FCD34D]'
                }`}
              >
                {formatTimer(secondsLeft)}
              </span>
            </div>
            <p className="font-mono-tabular text-lg font-extrabold text-white">R$ {ticketsTotal}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className={`cine-press min-h-[44px] rounded-xl border border-white/25 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white ${FOCUS_RING_CLASS}`}
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={selectedSeats.length === 0 || isExpired}
              onClick={handleProceedCheckout}
              className={`cine-press min-h-[44px] rounded-xl bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS}`}
            >
              Avançar
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Timer Expiration Modal (<dialog>) */}
      <dialog
        ref={expireDialogRef}
        aria-label="Trava temporária expirada"
        onCancel={(e) => {
          e.preventDefault();
          onRenewLock();
        }}
        className="m-auto w-[min(92vw,440px)] rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-6 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-red)]/20 text-[#FCA5A5]">
            <Timer className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase text-white">
              Trava de 10 minutos expirada
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
              O tempo limite para reservar os assentos{' '}
              <strong className="text-white">{selectedSeats.map((s) => s.seatId).join(', ')}</strong> encerrou.
              Caso continuem disponíveis, você pode renovar por mais 10 minutos.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={onExpireRelease}
            className={`cine-press min-h-[44px] rounded-lg border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white ${FOCUS_RING_CLASS}`}
          >
            Liberar Assentos
          </button>
          <button
            type="button"
            autoFocus
            onClick={onRenewLock}
            className={`cine-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)] ${FOCUS_RING_CLASS}`}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Renovar Trava (+10m)</span>
          </button>
        </div>
      </dialog>
    </section>
  );
}
