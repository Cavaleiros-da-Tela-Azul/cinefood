import { useEffect, useRef, useState } from 'react';
import { Accessibility, AlertCircle, Check, Lock, RotateCcw, Timer, X } from 'lucide-react';
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

  return (
    <section
      className="relative min-h-[calc(100dvh-68px)] bg-[var(--bg-base)] pb-32 lg:pb-14"
      aria-label="Seleção de assentos"
    >
      {/* Top Movie Backdrop Banner */}
      <div className="relative h-56 w-full overflow-hidden sm:h-64">
        <img
          src={movie.backdropSrc}
          alt=""
          className="h-full w-full object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-base)]/35 via-[var(--bg-base)]/65 to-[var(--bg-base)]" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto -mt-32 max-w-[1360px] px-4 sm:-mt-36 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr_190px]">
          {/* Left Column: Overlapping Poster + Selected Seats Ledger */}
          <div className="flex flex-col min-w-0">
            <div className="mx-auto w-[190px] overflow-hidden rounded-xl border border-white/15 bg-[var(--bg-elevated)] shadow-[0_24px_48px_rgba(0,0,0,0.75)] sm:w-[230px] lg:mx-0 lg:w-full">
              <img
                src={movie.posterSrc}
                alt={`Pôster de ${movie.title}`}
                className="aspect-[2/3] w-full object-cover"
              />
            </div>

            {/* Selected Seats List */}
            <div className="mt-6 space-y-2.5">
              {selectedSeats.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/15 bg-[var(--bg-elevated)]/60 p-4 text-center text-xs text-[var(--text-secondary)]">
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
                      className="flex flex-col gap-2 rounded-lg border border-white/15 bg-[var(--bg-elevated)] px-3.5 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-baseline gap-2 text-sm">
                          <span className="font-mono-tabular font-bold text-white">{sel.row}</span>
                          <span className="text-xs text-[var(--text-muted)]">fil.</span>
                          <span className="font-mono-tabular font-bold text-white">{sel.col}</span>
                          <span className="text-xs text-[var(--text-muted)]">assento</span>
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
                          <span className="font-mono-tabular text-xs font-semibold text-white">
                            R$ {unitPrice}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveSeat(sel.seatId)}
                            aria-label={`Remover assento ${sel.seatId}`}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Inteira / Meia-entrada (RF-16) */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onChangeTier(sel.seatId, 'inteira')}
                          className={`min-h-[44px] flex-1 rounded px-2.5 py-2 text-xs font-semibold transition-colors ${
                            sel.tier === 'inteira'
                              ? 'bg-white text-[#0D0E12]'
                              : 'bg-white/5 text-[var(--text-secondary)] hover:text-white'
                          }`}
                        >
                          Inteira (R$ {session.basePrice})
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangeTier(sel.seatId, 'meia')}
                          className={`min-h-[44px] flex-1 rounded px-2.5 py-2 text-xs font-semibold transition-colors ${
                            sel.tier === 'meia'
                              ? 'bg-white text-[#0D0E12]'
                              : 'bg-white/5 text-[var(--text-secondary)] hover:text-white'
                          }`}
                        >
                          Meia (R$ {session.basePrice * 0.5})
                        </button>
                      </div>

                      {/* Meia-entrada legal category & document field (RF-16, #10) */}
                      {sel.tier === 'meia' && (
                        <div className="mt-1 space-y-2.5 border-t border-white/10 pt-2.5">
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
                              className="mt-1 block min-h-[44px] w-full rounded-md border border-white/15 bg-black/50 px-2.5 py-2 text-base text-white focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] sm:text-sm"
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
                              className={`font-mono-tabular mt-1 block min-h-[44px] w-full rounded-md border bg-black/50 px-2.5 py-2 text-base text-white placeholder:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] sm:text-sm ${
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
                className="mt-4 flex items-start gap-2 rounded-lg border border-rose-400/50 bg-rose-500/15 p-3 text-xs text-rose-100"
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
              <span className="text-sm text-[var(--text-secondary)]">Total ingressos:</span>
              <span className="font-mono-tabular text-2xl font-bold text-white">R$ {ticketsTotal}</span>
            </div>

            <div className="mt-5 hidden grid-cols-2 gap-3 lg:grid">
              <button
                type="button"
                onClick={onBack}
                className="min-h-[44px] rounded-md border border-[var(--brand-red)]/60 bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--brand-red)]/15 active:scale-95"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={selectedSeats.length === 0 || isExpired}
                onClick={handleProceedCheckout}
                className="min-h-[44px] rounded-md bg-[var(--brand-red)] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Avançar
              </button>
            </div>
          </div>

          {/* Center Column: Title + 4-Step Stepper + Angled Cinema Screen + Seat Map */}
          <div className="flex min-w-0 flex-col pt-2 lg:pt-10">
            <h1 className="font-display line-clamp-2 break-words text-center text-3xl font-extrabold uppercase tracking-wide text-white sm:text-5xl lg:text-left">
              {movie.title}
            </h1>

            <div className="mt-6">
              <StepperBar current={1} />
            </div>

            {/* Angled Cinema Screen with Glow */}
            <div className="mx-auto mt-10 w-full max-w-[440px] px-4">
              <div className="cinema-screen-arc h-10 w-full rounded-sm" />
              <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--text-muted)]">
                Tela da Sala · {session.format} · {seats.length} Poltronas (A–H)
              </p>
            </div>

            {/* Seat Matrix */}
            <div className="mt-7 overflow-x-auto pb-2">
              <div className="mx-auto flex w-fit flex-col gap-1.5 px-1 sm:gap-2 sm:px-2">
                {rows.map((row) => {
                  const rowSeats = seats
                    .filter((s) => s.row === row)
                    .sort((a, b) => a.col - b.col);
                  return (
                    <div key={row} className="flex items-center gap-[3px] sm:gap-2">
                      <span className="font-mono-tabular w-4 text-right text-[11px] font-semibold text-[var(--text-muted)] sm:w-5 sm:text-xs">
                        {row}
                      </span>
                      <div className="flex items-center gap-[3px] sm:gap-2">
                        {rowSeats.map((seat) => {
                          const isSelected = selectedSeats.some((s) => s.seatId === seat.id);
                          const isOccupied = seat.status === 'occupied';
                          const isReserved = seat.status === 'reserved';
                          const isPcdPlus = seat.category === 'pcd-plus';
                          const isPcd = seat.category !== 'standard';
                          const disabled = isOccupied || isReserved;

                          let bgClass =
                            'bg-[var(--seat-available)] text-white/90 hover:bg-[var(--seat-available-hover)]';
                          if (isOccupied) {
                            bgClass = 'bg-[var(--seat-occupied)] text-[var(--text-muted)] cursor-not-allowed';
                          } else if (isReserved) {
                            bgClass = 'bg-[var(--seat-reserved)] text-rose-200/80 cursor-not-allowed';
                          } else if (isSelected) {
                            bgClass = isPcd
                              ? 'bg-[var(--brand-red)] text-white ring-2 ring-[var(--pcd-blue)] ring-offset-1 ring-offset-[var(--bg-base)] shadow-[0_6px_16px_rgba(0,0,0,0.5)] scale-105'
                              : 'bg-[var(--brand-red)] text-white shadow-[0_6px_16px_rgba(0,0,0,0.5)] scale-105';
                          } else if (isPcdPlus) {
                            bgClass =
                              'bg-[var(--pcd-blue)] text-white ring-1 ring-sky-300/75 hover:bg-blue-500';
                          } else if (isPcd) {
                            bgClass = 'bg-[var(--pcd-blue)] text-white hover:bg-blue-500';
                          }

                          const widthClass = isPcdPlus
                            ? 'h-[24px] w-[36px] sm:h-8 sm:w-12'
                            : 'h-[24px] w-[23px] sm:h-8 sm:w-8';

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
                              className={`relative flex ${widthClass} items-center justify-center rounded-[4px] text-[10px] font-bold transition-transform duration-150 active:scale-90 sm:rounded-[5px] sm:text-[11px] ${bgClass} ${
                                seat.col === 6 ? 'mr-1.5 sm:mr-5' : ''
                              }`}
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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Multimodal Legend (WCAG 2.2 AA) */}
            <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-white/10 bg-[var(--bg-elevated)]/70 px-4 py-3 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-[3px] bg-[var(--seat-available)]" />
                Disponível
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-[var(--brand-red)] text-white">
                  <Check className="h-2.5 w-2.5" aria-hidden="true" />
                </span>
                Selecionado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-[var(--seat-reserved)] text-rose-200">
                  <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                </span>
                Reservado 10m
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-[var(--seat-occupied)] text-[var(--text-muted)]">
                  <X className="h-2.5 w-2.5" aria-hidden="true" />
                </span>
                Ocupado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-[var(--pcd-blue)] text-white">
                  <Accessibility className="h-2.5 w-2.5" aria-hidden="true" />
                </span>
                PCD Cadeirante
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-3.5 w-7 items-center justify-center gap-0.5 rounded-[3px] bg-[var(--pcd-blue)] px-1 text-[8px] font-extrabold text-white ring-1 ring-sky-300/75">
                  <Accessibility className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                  1.5×
                </span>
                PCD Obeso 1.5×
              </span>
            </div>
          </div>

          {/* Right Column: Date, Time, Format & 10-Min Lock Timer (Ref 1 + ADR-002) */}
          <aside className="flex flex-row flex-wrap items-start justify-between gap-4 border-t border-white/10 pt-6 lg:flex-col lg:justify-start lg:border-t-0 lg:pt-24">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Data:</p>
              <div className="mt-1.5 inline-flex flex-col items-center rounded-md border border-white/15 bg-[var(--bg-elevated)] px-4 py-2">
                <span className="font-mono-tabular text-2xl font-bold leading-none text-white">
                  {session.dayNumber}
                </span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                  {session.monthLabel}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Horário:</p>
              <p className="font-mono-tabular mt-1 text-xl font-bold text-white">{session.time}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Sala / Tipo:</p>
              <p className="mt-1 text-sm font-bold uppercase tracking-wide text-white">{session.format}</p>
              <p className="text-xs text-[var(--text-secondary)]">{session.room}</p>
            </div>

            <div
              className={`rounded-xl border p-3.5 ${
                isCriticalTime
                  ? 'border-[var(--brand-red)]/60 bg-[var(--brand-red)]/15'
                  : 'border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/10'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
                <Timer className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                Trava de Reserva
              </div>
              <p
                className={`font-mono-tabular mt-1 text-2xl font-extrabold ${
                  isCriticalTime ? 'text-[#FCA5A5]' : 'text-[#FCD34D]'
                }`}
              >
                {formatTimer(secondsLeft)}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-[var(--text-secondary)]">
                Tempo restante para concluir ingressos e cantina.
              </p>
              {selectedSeats.length > 0 && secondsLeft > 0 && (
                <button
                  type="button"
                  onClick={onSimulateExpire}
                  className="mt-2 inline-flex min-h-[44px] items-center text-left text-[11px] font-semibold text-[var(--amber-progress)] underline-offset-2 hover:underline"
                >
                  Simular fim da trava (00:00)
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Thumb-Zone Sticky Bottom Bar (mobile-native) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-[var(--bg-glass)] px-4 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
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
              className="min-h-[44px] rounded-md border border-white/25 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white active:scale-95"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={selectedSeats.length === 0 || isExpired}
              onClick={handleProceedCheckout}
              className="min-h-[44px] rounded-md bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Avançar
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Timer Expiration Modal (<dialog>, prevent-page-scroll-under-modal-dialog) */}
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
            className="min-h-[44px] rounded-lg border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white"
          >
            Liberar Assentos
          </button>
          <button
            type="button"
            autoFocus
            onClick={onRenewLock}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Renovar Trava (+10m)</span>
          </button>
        </div>
      </dialog>
    </section>
  );
}
