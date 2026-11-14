import React, { useMemo, useState } from 'react';
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
    <form onSubmit={handleEmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Session + Shared 96-seat Matrix */}
      <section className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
              RF-14 · RF-16 · Balcão Presencial
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[var(--text-primary)] mt-1">
              Bilheteria Assistida
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Capacidade unificada ({ROOM_CAPACITY} poltronas · A–H), conferência legal de
              Meia-Entrada e emissão de QR individual por assento.
            </p>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            Operador: <strong className="text-[var(--text-primary)]">{operatorName}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="box-movie"
              className="block text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-1.5"
            >
              Filme em Cartaz
            </label>
            <select
              id="box-movie"
              value={selectedMovie?.id ?? ''}
              onChange={(e) => handleSelectMovie(e.target.value)}
              className="w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
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
              className="block text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-1.5"
            >
              Sessão &amp; Sala
            </label>
            <select
              id="box-session"
              value={selectedSession?.id ?? ''}
              onChange={(e) => handleSelectSession(e.target.value)}
              className="w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
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
            className="rounded-lg bg-red-500/15 border border-red-400/40 px-3.5 py-2.5 text-xs text-red-200"
          >
            Sessão <strong>{selectedSession.status}</strong> — emissão presencial bloqueada para
            esta sessão. Selecione uma sessão ATIVA.
          </div>
        )}

        {/* Shared 96-seat Matrix (A-H x 12) */}
        <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 space-y-3 overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
            <span className="uppercase tracking-[0.16em] font-semibold">
              Mapa Oficial ({ROOM_CAPACITY} lug.) · {selectedSession?.room}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--seat-available)] inline-block" /> Livre
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--brand-red)] inline-block" /> Selecionado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--seat-reserved)] inline-block" /> Reservado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--seat-occupied)] inline-block" /> Ocupado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--pcd-blue)] inline-block" /> PcD
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-4 h-2.5 rounded-sm bg-[var(--pcd-blue)] border border-sky-300 inline-block" /> PcD 1.5×
              </span>
            </div>
          </div>

          <div className="min-w-[460px] space-y-1.5">
            {ROWS_ORDER.map((row) => {
              const rowSeats = seatMap.filter((s) => s.row === row);
              return (
                <div key={row} className="flex items-center gap-1.5 justify-center">
                  <span className="font-mono text-xs text-[var(--text-secondary)] w-4">{row}</span>
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
                        } h-7 rounded text-xs font-mono flex items-center justify-center gap-0.5 transition ${
                          seat.col === 6 ? 'mr-2' : ''
                        } ${
                          isOccupied
                            ? 'bg-[var(--seat-occupied)] text-[var(--text-muted)] opacity-60 cursor-not-allowed'
                            : isReserved
                              ? 'bg-[var(--seat-reserved)] text-rose-200/80 border border-rose-400/30 cursor-not-allowed'
                              : isSelected
                                ? 'bg-[var(--brand-red)] text-white font-bold ring-1 ring-red-300 cursor-pointer'
                                : isPcd
                                  ? 'bg-[var(--pcd-blue)]/35 border border-sky-400/60 text-sky-100 hover:bg-[var(--pcd-blue)]/60 cursor-pointer'
                                  : 'bg-[var(--seat-available)]/45 text-[var(--text-primary)] hover:bg-[var(--seat-available-hover)] cursor-pointer'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3 h-3" aria-hidden="true" />
                        ) : isOccupied ? (
                          <X className="w-3 h-3 opacity-70" aria-hidden="true" />
                        ) : isReserved ? (
                          <Lock className="w-3 h-3" aria-hidden="true" />
                        ) : isPcdPlus ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold">
                            <Accessibility className="w-3 h-3" aria-hidden="true" />
                            1.5×
                          </span>
                        ) : isPcdWheelchair ? (
                          <Accessibility className="w-3 h-3" aria-hidden="true" />
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

      {/* Right: Legal Meia-Entrada + Decoupled Combo + Booth Settlement */}
      <aside className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <label
            htmlFor="box-customer-name"
            className="block text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-1.5"
          >
            Identificação no Recibo (opcional)
          </label>
          <input
            id="box-customer-name"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="cine-input w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
          />
        </div>

        {/* Inteira / Meia-Entrada (Global + Per-Seat) */}
        <div className="space-y-2.5">
          <span className="block text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] font-semibold">
            Tarifa Legal (Lei 12.933)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(['inteira', 'meia'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                aria-pressed={defaultTier === tier}
                onClick={() => handleApplyGlobalTier(tier)}
                className={`min-h-[44px] py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-[0.1em] cursor-pointer ${
                  defaultTier === tier
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
              >
                {tier === 'inteira' ? `Inteira (R$ ${basePrice})` : `Meia 50% (R$ ${meiaPrice})`}
              </button>
            ))}
          </div>

          {selectedSeatIds.length > 0 && (
            <div className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-2.5 space-y-1.5">
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
                      className={`px-2.5 py-1 rounded border text-xs font-mono cursor-pointer ${
                        tier === 'meia'
                          ? 'bg-amber-400/20 border-amber-400/50 text-amber-200'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]'
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
            <div className="rounded-lg bg-[var(--bg-elevated)] border border-amber-400/35 p-3 space-y-2.5">
              <div>
                <label htmlFor="box-meia-cat" className="block text-xs text-amber-200 font-semibold mb-1">
                  Modalidade de Benefício
                </label>
                <select
                  id="box-meia-cat"
                  value={meiaCategory}
                  onChange={(e) => setMeiaCategory(e.target.value as MeiaCategory)}
                  className="w-full min-h-[44px] rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-2 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                >
                  {MEIA_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="box-meia-doc" className="block text-xs text-amber-200 font-semibold mb-1">
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
                  className="cine-input w-full min-h-[44px] rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] px-3 py-2 font-mono text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[var(--text-primary)] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={meiaDocumentChecked}
                  onChange={(e) => setMeiaDocumentChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-400 shrink-0"
                />
                <span>
                  Documento comprobatório original conferido presencialmente no guichê.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Optional Decoupled Canteen Combo (ADR-005) */}
        <div>
          <label
            htmlFor="box-combo"
            className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-1.5"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            Adicionar Combo (ADR-005 · Retirada no Balcão)
          </label>
          <select
            id="box-combo"
            value={selectedComboId}
            onChange={(e) => setSelectedComboId(e.target.value)}
            className="w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
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
          <span className="block text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] font-semibold">
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
                  className={`min-h-[44px] flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    paymentMethod === opt.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary & Emit (ADR-005 separated subtotals) */}
        <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 space-y-2">
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>
              Subtotal Ingressos (
              {selectedSeatIds.length > 0 ? selectedSeatIds.join(', ') : 'nenhum assento'})
            </span>
            <span className="font-mono text-[var(--text-primary)]">R$ {ticketsSubtotal}</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>
              Subtotal Cantina (ADR-005 · {selectedCombo ? selectedCombo.name : 'Sem itens'})
            </span>
            <span className="font-mono text-[var(--text-primary)]">R$ {canteenSubtotal}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Total no Guichê
            </span>
            <span className="font-mono text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              R$ {totalAmount}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canEmit}
          className="w-full min-h-[44px] py-3 rounded-lg bg-[var(--brand-red)] hover:bg-[var(--brand-red-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Ticket className="w-4 h-4" />
          Emitir Ingresso na Bilheteria
        </button>

        {lastEmitted && (
          <div
            role="status"
            className="rounded-xl bg-emerald-500/12 border border-emerald-400/40 p-3.5 space-y-1.5 text-xs text-emerald-100"
          >
            <div className="flex items-center justify-between gap-2 font-bold">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Ingresso emitido ({lastEmitted.id})
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs bg-black/35 px-2 py-0.5 rounded">
                <Receipt className="w-3 h-3" />
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
              <ShieldCheck className="w-3 h-3" />
              {lastEmitted.meiaCategory
                ? `Meia conferida (${lastEmitted.meiaCategory} · doc ${lastEmitted.meiaDoc})`
                : 'Tarifa Inteira'}
            </p>
          </div>
        )}
      </aside>
    </form>
  );
};
