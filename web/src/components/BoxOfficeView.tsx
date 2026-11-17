import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Accessibility,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Lock,
  QrCode,
  Receipt,
  ShieldCheck,
  Ticket,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  buildSeatMap,
  CanteenItem,
  ClientTicketOrder,
  MEIA_CATEGORIES,
  MeiaCategory,
  MovieItem,
  ROOM_CAPACITY,
  ROWS_ORDER,
  SeatNode,
  SeatQrToken,
  TicketTier,
} from '../data/cinemaData';

export interface BoxOfficeViewProps {
  movies: MovieItem[];
  canteenItems: CanteenItem[];
  orders?: ClientTicketOrder[];
  occupiedBySession?: Record<string, string[]>;
  operatorName?: string;
  onEmitBoxOfficeOrder: (order: ClientTicketOrder) => void;
}

export const BoxOfficeView: React.FC<BoxOfficeViewProps> = ({
  movies,
  canteenItems,
  orders = [],
  occupiedBySession,
  operatorName = 'Operador Bilheteria',
  onEmitBoxOfficeOrder,
}) => {
  const [selectedMovieId, setSelectedMovieId] = useState(movies[0]?.id ?? '');
  const selectedMovie = useMemo(
    () => movies.find((m) => m.id === selectedMovieId) ?? movies[0],
    [movies, selectedMovieId],
  );

  const [selectedSessionId, setSelectedSessionId] = useState(
    selectedMovie?.sessions[0]?.id ?? '',
  );
  const selectedSession = useMemo(
    () =>
      selectedMovie?.sessions.find((s) => s.id === selectedSessionId) ??
      selectedMovie?.sessions[0],
    [selectedMovie, selectedSessionId],
  );

  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [seatTiers, setSeatTiers] = useState<Record<string, TicketTier>>({});
  const [defaultTier, setDefaultTier] = useState<TicketTier>('inteira');
  const [meiaCategory, setMeiaCategory] = useState<MeiaCategory>('estudante');
  const [meiaDoc, setMeiaDoc] = useState('');
  const [meiaDocumentChecked, setMeiaDocumentChecked] = useState(false);
  const [selectedComboId, setSelectedComboId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pix'>('card');
  const [customerName, setCustomerName] = useState('Atendimento Balcão');
  const [lastEmitted, setLastEmitted] = useState<ClientTicketOrder | null>(null);

  const seatMap: SeatNode[] = useMemo(() => {
    if (!selectedSession) return [];
    const baseSeats = buildSeatMap(selectedSession.id, selectedSession.occupancyPct);

    const extraOccupied = new Set<string>(occupiedBySession?.[selectedSession.id] ?? []);
    for (const order of orders) {
      if (order.status === 'CANCELADO' || order.orderKind === 'canteen-only') continue;
      const orderSessionId = (order as { sessionId?: string }).sessionId;
      const sameSession = orderSessionId
        ? orderSessionId === selectedSession.id
        : order.movieId === selectedMovie?.id &&
          order.time === selectedSession.time &&
          order.dateLabel === selectedSession.dateLabel &&
          order.room === selectedSession.room;
      if (sameSession) {
        order.seatsLabel.forEach((seatId) => extraOccupied.add(seatId));
      }
    }

    return baseSeats.map((seat) =>
      extraOccupied.has(seat.id) && seat.status === 'available'
        ? { ...seat, status: 'occupied' }
        : seat,
    );
  }, [selectedSession, selectedMovie?.id, occupiedBySession, orders]);

  const handleSelectMovie = (movieId: string) => {
    setSelectedMovieId(movieId);
    setSelectedSeatIds([]);
    setSeatTiers({});
    const nextMovie = movies.find((m) => m.id === movieId);
    if (nextMovie?.sessions[0]) {
      setSelectedSessionId(nextMovie.sessions[0].id);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedSeatIds([]);
    setSeatTiers({});
  };

  const toggleSeat = (seatId: string, disabled: boolean) => {
    if (disabled) return;
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) {
        setSeatTiers((tiers) => {
          const next = { ...tiers };
          delete next[seatId];
          return next;
        });
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length >= 6) return prev;
      setSeatTiers((tiers) => ({ ...tiers, [seatId]: defaultTier }));
      return [...prev, seatId];
    });
  };

  const handleApplyGlobalTier = (tier: TicketTier) => {
    setDefaultTier(tier);
    setSeatTiers((prev) => {
      const next: Record<string, TicketTier> = { ...prev };
      for (const seatId of selectedSeatIds) {
        next[seatId] = tier;
      }
      return next;
    });
  };

  const handleSetSeatTier = (seatId: string, tier: TicketTier) => {
    setSeatTiers((prev) => ({ ...prev, [seatId]: tier }));
  };

  const basePrice = selectedSession?.basePrice ?? 40;
  const meiaPrice = Math.round(basePrice / 2);

  const ticketsSubtotal = useMemo(() => {
    return selectedSeatIds.reduce((sum, seatId) => {
      const tier = seatTiers[seatId] ?? defaultTier;
      return sum + (tier === 'meia' ? meiaPrice : basePrice);
    }, 0);
  }, [selectedSeatIds, seatTiers, defaultTier, meiaPrice, basePrice]);

  const hasMeiaSeat =
    selectedSeatIds.length > 0
      ? selectedSeatIds.some((id) => (seatTiers[id] ?? defaultTier) === 'meia')
      : defaultTier === 'meia';

  const selectedCombo = useMemo(
    () => canteenItems.find((item) => item.id === selectedComboId && item.stock > 0) ?? null,
    [canteenItems, selectedComboId],
  );

  const canteenSubtotal = selectedCombo?.price ?? 0;
  const totalAmount = ticketsSubtotal + canteenSubtotal;

  const isSessionActive = selectedSession?.status === 'ATIVA';
  const isMeiaValid = !hasMeiaSeat || (meiaDoc.trim().length >= 4 && meiaDocumentChecked);

  const canEmit =
    Boolean(selectedMovie && selectedSession && isSessionActive && selectedSeatIds.length > 0) &&
    isMeiaValid;

  const activeMeiaMeta =
    MEIA_CATEGORIES.find((c) => c.id === meiaCategory) ?? MEIA_CATEGORIES[0];

  const handleEmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovie || !selectedSession || !canEmit) return;

    const suffix = Math.floor(1000 + Math.random() * 8999);
    const id = `ORD-${suffix}`;
    const baseToken = `CF-QR-${suffix}-BL`;
    const seatQrTokens: SeatQrToken[] = selectedSeatIds.map((seatId) => ({
      seatId,
      qrToken: `${baseToken}-${seatId}`,
      status: 'ATIVO',
    }));

    const newOrder: ClientTicketOrder = {
      id,
      userId: `balcao-${suffix}`,
      qrToken: baseToken,
      seatQrTokens,
      orderKind: 'ticket',
      movieId: selectedMovie.id,
      movieTitle: selectedMovie.title,
      posterSrc: selectedMovie.posterSrc,
      complex: selectedSession.complex,
      room: selectedSession.room,
      format: selectedSession.format,
      dateLabel: selectedSession.dateLabel,
      time: selectedSession.time,
      seatsLabel: [...selectedSeatIds],
      totalAmount,
      paymentMethod,
      salesChannel: 'boxoffice',
      operatorName,
      meiaCategory: hasMeiaSeat ? meiaCategory : undefined,
      meiaDoc: hasMeiaSeat ? meiaDoc.trim() : undefined,
      purchasedAt: new Date().toISOString(),
      status: 'ATIVO',
      canteenSummary: selectedCombo ? `1× ${selectedCombo.name}` : null,
      canteenStatus: selectedCombo ? 'RETIRADA_NO_BALCAO' : 'NENHUM',
      deliveryMode: 'counter',
      hoursUntilSession: 3.5,
      checkedIn: false,
      sessionEnded: false,
    };

    onEmitBoxOfficeOrder(newOrder);
    setLastEmitted(newOrder);
    setSelectedSeatIds([]);
    setSeatTiers({});
    setMeiaDoc('');
    setMeiaDocumentChecked(false);
    setSelectedComboId('');
  };

  return (
    <form onSubmit={handleEmit} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {/* Left POS Panel: Session + Shared 96-seat Matrix */}
      <section className="space-y-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-5 shadow-xl sm:p-6 lg:col-span-7">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
              Balcão Presencial · Terminal POS
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold uppercase tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Bilheteria Assistida
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Capacidade unificada ({ROOM_CAPACITY} poltronas · A–H), conferência legal de
              Meia-Entrada e emissão de QR individual por assento.
            </p>
          </div>
          <span className="font-mono rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            Operador: <strong className="text-[var(--text-primary)]">{operatorName}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="box-movie"
              className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]"
            >
              Filme em Cartaz
            </label>
            <select
              id="box-movie"
              value={selectedMovie?.id ?? ''}
              onChange={(e) => handleSelectMovie(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-sm"
            >
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.rating})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="box-session"
              className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]"
            >
              Sessão &amp; Sala
            </label>
            <select
              id="box-session"
              value={selectedSession?.id ?? ''}
              onChange={(e) => handleSelectSession(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-sm"
            >
              {(selectedMovie?.sessions ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.dateLabel} · {s.time} · {s.format} (R$ {s.basePrice}) · {s.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSession && !isSessionActive && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/40 bg-red-500/15 px-3.5 py-2.5 text-xs text-red-200"
          >
            Sessão <strong>{selectedSession.status}</strong> — emissão presencial bloqueada para
            esta sessão. Selecione uma sessão ATIVA.
          </div>
        )}

        {/* Shared 96-seat Matrix (A-H x 12) */}
        <div className="space-y-4 overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
            <span className="font-semibold uppercase tracking-[0.16em]">
              Mapa Oficial ({ROOM_CAPACITY} lug.) · {selectedSession?.room}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--seat-available)]" /> Livre
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--brand-red)]" /> Selecionado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--seat-reserved)]" /> Reservado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--seat-occupied)]" /> Ocupado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--pcd-blue)]" /> PcD
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2.5 w-4 rounded-sm border border-sky-300 bg-[var(--pcd-blue)]" />{' '}
                PcD 1.5×
              </span>
            </div>
          </div>

          {/* Screen indicator bar */}
          <div className="mx-auto w-3/4 min-w-[320px] text-center" aria-hidden="true">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">
              Tela
            </p>
          </div>

          <div className="min-w-[460px] space-y-1.5">
            {ROWS_ORDER.map((row) => {
              const rowSeats = seatMap.filter((s) => s.row === row);
              return (
                <div key={row} className="flex items-center justify-center gap-1.5">
                  <span className="font-mono w-4 text-xs text-[var(--text-secondary)]">{row}</span>
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isOccupied = seat.status === 'occupied';
                    const isReserved = seat.status === 'reserved';
                    const isDisabled = seat.status !== 'available' || !isSessionActive;
                    const isPcdWheelchair = seat.category === 'pcd-wheelchair';
                    const isPcdPlus = seat.category === 'pcd-plus';
                    const isPcd = isPcdWheelchair || isPcdPlus;

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleSeat(seat.id, isDisabled)}
                        aria-label={`Poltrona ${seat.id}${
                          isPcdPlus ? ' PcD Obeso 1.5x' : isPcdWheelchair ? ' PcD Cadeirante' : ''
                        } — ${
                          isOccupied
                            ? 'Ocupada'
                            : isReserved
                              ? 'Reservada'
                              : isSelected
                                ? 'Selecionada'
                                : 'Disponível'
                        }`}
                        aria-pressed={isSelected}
                        className={`${
                          isPcdPlus ? 'w-11 px-1' : 'w-7'
                        } cine-press font-mono flex h-7 items-center justify-center gap-0.5 rounded-md text-xs transition ${
                          seat.col === 6 ? 'mr-2.5' : ''
                        } ${
                          isOccupied
                            ? 'cursor-not-allowed bg-[var(--seat-occupied)] text-[var(--text-muted)] opacity-60'
                            : isReserved
                              ? 'cursor-not-allowed border border-rose-400/30 bg-[var(--seat-reserved)] text-rose-200/80'
                              : isSelected
                                ? 'cursor-pointer bg-[var(--brand-red)] font-bold text-white shadow-sm ring-1 ring-red-300'
                                : isPcd
                                  ? 'cursor-pointer border border-sky-400/60 bg-[var(--pcd-blue)]/35 text-sky-100 hover:bg-[var(--pcd-blue)]/60'
                                  : 'cursor-pointer bg-[var(--seat-available)]/50 text-[var(--text-primary)] hover:bg-[var(--seat-available-hover)]'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        ) : isOccupied ? (
                          <X className="h-3 w-3 opacity-70" aria-hidden="true" />
                        ) : isReserved ? (
                          <Lock className="h-3 w-3" aria-hidden="true" />
                        ) : isPcdPlus ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold">
                            <Accessibility className="h-3 w-3" aria-hidden="true" />
                            1.5×
                          </span>
                        ) : isPcdWheelchair ? (
                          <Accessibility className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          seat.col
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Right POS Rail: Legal Meia-Entrada + Combo + Settlement */}
      <aside className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-5 shadow-xl sm:p-6 lg:sticky lg:top-24 lg:col-span-5">
        <div>
          <label
            htmlFor="box-customer-name"
            className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]"
          >
            Identificação no Recibo (opcional)
          </label>
          <input
            id="box-customer-name"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="cine-input min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-sm"
          />
        </div>

        {/* Inteira / Meia-Entrada */}
        <div className="space-y-2.5">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Tarifa Legal (Lei 12.933)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(['inteira', 'meia'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                aria-pressed={defaultTier === tier}
                onClick={() => handleApplyGlobalTier(tier)}
                className={`cine-press min-h-[44px] cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] transition ${
                  defaultTier === tier
                    ? 'border-amber-300 bg-amber-400 text-black shadow-sm'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                }`}
              >
                {tier === 'inteira' ? `Inteira (R$ ${basePrice})` : `Meia 50% (R$ ${meiaPrice})`}
              </button>
            ))}
          </div>

          {selectedSeatIds.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Tarifa por assento selecionado
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedSeatIds.map((seatId) => {
                  const tier = seatTiers[seatId] ?? defaultTier;
                  return (
                    <button
                      key={seatId}
                      type="button"
                      onClick={() =>
                        handleSetSeatTier(seatId, tier === 'inteira' ? 'meia' : 'inteira')
                      }
                      className={`cine-press font-mono cursor-pointer rounded-lg border px-2.5 py-1 text-xs ${
                        tier === 'meia'
                          ? 'border-amber-400/50 bg-amber-400/20 text-amber-200'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                      }`}
                    >
                      {seatId}: {tier === 'meia' ? 'Meia' : 'Inteira'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasMeiaSeat && (
            <div className="space-y-2.5 rounded-xl border border-amber-400/35 bg-[var(--bg-elevated)] p-3.5">
              <div>
                <label htmlFor="box-meia-cat" className="mb-1 block text-xs font-semibold text-amber-200">
                  Modalidade de Benefício
                </label>
                <select
                  id="box-meia-cat"
                  value={meiaCategory}
                  onChange={(e) => setMeiaCategory(e.target.value as MeiaCategory)}
                  className="min-h-[44px] w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
                >
                  {MEIA_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="box-meia-doc" className="mb-1 block text-xs font-semibold text-amber-200">
                  Número do Documento Comprobatório (mín. 4 caracteres)
                </label>
                <input
                  id="box-meia-doc"
                  type="text"
                  required={hasMeiaSeat}
                  minLength={4}
                  value={meiaDoc}
                  onChange={(e) => setMeiaDoc(e.target.value)}
                  placeholder={activeMeiaMeta.docHint}
                  className="cine-input min-h-[44px] w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 font-mono text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-sm"
                />
              </div>

              <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 pt-1 text-xs text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={meiaDocumentChecked}
                  onChange={(e) => setMeiaDocumentChecked(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-emerald-400"
                />
                <span>
                  Documento comprobatório original conferido presencialmente no guichê.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Optional Counter Canteen Combo */}
        <div>
          <label
            htmlFor="box-combo"
            className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]"
          >
            <UtensilsCrossed className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            Adicionar Combo (Retirada no Balcão)
          </label>
          <select
            id="box-combo"
            value={selectedComboId}
            onChange={(e) => setSelectedComboId(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
          >
            <option value="">Sem combo da cantina (apenas ingresso)</option>
            {canteenItems.map((item) => (
              <option key={item.id} value={item.id} disabled={item.stock === 0}>
                {item.name} — R$ {item.price}{' '}
                {item.stock === 0 ? '(Esgotado)' : `(${item.stock} disp.)`}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Forma de Recebimento Presencial
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'card' as const, label: 'POS Cartão', icon: CreditCard },
              { id: 'cash' as const, label: 'Dinheiro', icon: Banknote },
              { id: 'pix' as const, label: 'Pix Balcão', icon: QrCode },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={paymentMethod === opt.id}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`cine-press flex min-h-[48px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                    paymentMethod === opt.id
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary & Emit */}
        <div className="space-y-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>
              Subtotal Ingressos (
              {selectedSeatIds.length > 0 ? selectedSeatIds.join(', ') : 'nenhum assento'})
            </span>
            <span className="font-mono-tabular text-[var(--text-primary)]">R$ {ticketsSubtotal}</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>Subtotal Cantina ({selectedCombo ? selectedCombo.name : 'Sem itens'})</span>
            <span className="font-mono-tabular text-[var(--text-primary)]">R$ {canteenSubtotal}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-[var(--border-subtle)] pt-2">
            <span className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Total no Guichê
            </span>
            <span className="font-mono-tabular text-2xl font-bold text-[var(--text-primary)]">
              R$ {totalAmount}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canEmit}
          className="cine-press inline-flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] py-3 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg transition hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Ticket className="h-4 w-4" aria-hidden="true" />
          Emitir Ingresso na Bilheteria
        </button>

        {lastEmitted && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="space-y-1.5 rounded-2xl border border-emerald-400/40 bg-emerald-500/12 p-4 text-xs text-emerald-100"
          >
            <div className="flex items-center justify-between gap-2 font-bold">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                Ingresso emitido ({lastEmitted.id})
              </span>
              <span className="font-mono inline-flex items-center gap-1 rounded bg-black/35 px-2 py-0.5 text-xs">
                <Receipt className="h-3 w-3" aria-hidden="true" />
                {lastEmitted.qrToken}
              </span>
            </div>
            <p className="text-xs text-emerald-100/80">
              Operador: <strong>{lastEmitted.operatorName}</strong> · QRs individuais:{' '}
              <span className="font-mono">
                {lastEmitted.seatQrTokens.map((sq) => sq.qrToken).join(', ')}
              </span>
            </p>
            <p className="inline-flex items-center gap-1 text-xs text-emerald-200/80">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {lastEmitted.meiaCategory
                ? `Meia conferida (${lastEmitted.meiaCategory} · doc ${lastEmitted.meiaDoc})`
                : 'Tarifa Inteira'}
            </p>
          </motion.div>
        )}
      </aside>
    </form>
  );
};
