import React, { useMemo, useState } from 'react';
import {
  Accessibility,
  Banknote,
  CheckCircle2,
  CreditCard,
  QrCode,
  Receipt,
  ShieldCheck,
  Ticket,
  UtensilsCrossed,
} from 'lucide-react';
import {
  buildSeatMap,
  CanteenItem,
  ClientTicketOrder,
  MEIA_CATEGORIES,
  MeiaCategory,
  MovieItem,
} from '../data/cinemaData';

interface BoxOfficeViewProps {
  movies: MovieItem[];
  canteenItems: CanteenItem[];
  onEmitBoxOfficeOrder: (order: ClientTicketOrder) => void;
}

const ROWS_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const BoxOfficeView: React.FC<BoxOfficeViewProps> = ({
  movies,
  canteenItems,
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

  const seatMap = useMemo(() => buildSeatMap(), []);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(['D6']);
  const [ticketTier, setTicketTier] = useState<'inteira' | 'meia'>('inteira');
  const [meiaCategory, setMeiaCategory] = useState<MeiaCategory>('estudante');
  const [meiaDocumentChecked, setMeiaDocumentChecked] = useState(true);
  const [selectedComboId, setSelectedComboId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pix'>('card');
  const [customerName, setCustomerName] = useState('Atendimento Balcão');
  const [lastEmitted, setLastEmitted] = useState<ClientTicketOrder | null>(null);

  const handleSelectMovie = (movieId: string) => {
    setSelectedMovieId(movieId);
    const nextMovie = movies.find((m) => m.id === movieId);
    if (nextMovie?.sessions[0]) {
      setSelectedSessionId(nextMovie.sessions[0].id);
    }
  };

  const toggleSeat = (seatId: string, disabled: boolean) => {
    if (disabled) return;
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) {
        return prev.length > 1 ? prev.filter((id) => id !== seatId) : prev;
      }
      if (prev.length >= 6) return prev;
      return [...prev, seatId];
    });
  };

  const unitPrice = useMemo(() => {
    const base = selectedSession?.basePrice ?? 44;
    return ticketTier === 'meia' ? Math.round(base / 2) : base;
  }, [selectedSession, ticketTier]);

  const selectedCombo = useMemo(
    () => canteenItems.find((item) => item.id === selectedComboId && item.stock > 0) ?? null,
    [canteenItems, selectedComboId],
  );

  const totalAmount = selectedSeatIds.length * unitPrice + (selectedCombo?.price ?? 0);
  const canEmit =
    Boolean(selectedMovie && selectedSession && selectedSeatIds.length > 0) &&
    (ticketTier === 'inteira' || meiaDocumentChecked);

  const handleEmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovie || !selectedSession || !canEmit) return;

    const suffix = Math.floor(1000 + Math.random() * 8999);
    const id = `ORD-${suffix}`;
    const newOrder: ClientTicketOrder = {
      id,
      qrToken: `CF-QR-${suffix}-BL`,
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
      meiaCategory:
        ticketTier === 'meia'
          ? MEIA_CATEGORIES.find((c) => c.id === meiaCategory)?.label
          : undefined,
      status: 'ATIVO',
      canteenSummary: selectedCombo ? `1× ${selectedCombo.name}` : null,
      canteenStatus: selectedCombo ? 'PRONTO_RETIRADA' : 'NENHUM',
      deliveryMode: 'counter',
      hoursUntilSession: 3.5,
      checkedIn: false,
      sessionEnded: false,
    };

    onEmitBoxOfficeOrder(newOrder);
    setLastEmitted(newOrder);
  };

  return (
    <form onSubmit={handleEmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Session + Compact Seat Picker */}
      <section className="lg:col-span-7 bg-[#15171F] border border-white/10 rounded-xl p-5 sm:p-6 space-y-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
            RF-14 · RF-16 · Balcão Presencial
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mt-1">
            Bilheteria Assistida
          </h2>
          <p className="text-xs text-white/65 mt-1">
            Emissão imediata para atendimento no guichê com conferência legal de Meia-Entrada e
            venda integrada de combos para retirada no balcão.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="box-movie"
              className="block text-xs uppercase tracking-[0.14em] text-white/60 mb-1.5"
            >
              Filme em Cartaz
            </label>
            <select
              id="box-movie"
              value={selectedMovie?.id ?? ''}
              onChange={(e) => handleSelectMovie(e.target.value)}
              className="w-full rounded-lg bg-[#0D0E12] border border-white/15 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400"
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
              className="block text-xs uppercase tracking-[0.14em] text-white/60 mb-1.5"
            >
              Sessão &amp; Sala
            </label>
            <select
              id="box-session"
              value={selectedSession?.id ?? ''}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full rounded-lg bg-[#0D0E12] border border-white/15 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400"
            >
              {(selectedMovie?.sessions ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.dateLabel} · {s.time} · {s.format} (R$ {s.basePrice})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compact Staff Seat Matrix */}
        <div className="rounded-xl bg-[#0D0E12] border border-white/10 p-4 space-y-3 overflow-x-auto">
          <div className="flex items-center justify-between gap-2 text-xs text-white/60">
            <span className="uppercase tracking-[0.16em] font-semibold">
              Mapa Rápido · {selectedSession?.room}
            </span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-white/25 inline-block" /> Livre
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#C40A14] inline-block" /> Selecionado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB] inline-block" /> PcD
              </span>
            </div>
          </div>

          <div className="min-w-[440px] space-y-1.5">
            {ROWS_ORDER.map((row) => {
              const rowSeats = seatMap.filter((s) => s.row === row);
              return (
                <div key={row} className="flex items-center gap-1.5 justify-center">
                  <span className="font-mono text-xs text-white/65 w-4">{row}</span>
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isDisabled = seat.status !== 'available';
                    const isPcd = seat.category !== 'standard';
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleSeat(seat.id, isDisabled)}
                        aria-label={`Poltrona ${seat.id}${isPcd ? ' PcD' : ''}`}
                        aria-pressed={isSelected}
                        className={`w-7 h-7 rounded text-xs font-mono flex items-center justify-center transition ${
                          isDisabled
                            ? 'bg-white/5 text-white/20 cursor-not-allowed'
                            : isSelected
                              ? 'bg-[#C40A14] text-white font-bold ring-1 ring-red-300 cursor-pointer'
                              : isPcd
                                ? 'bg-[#2563EB]/30 border border-blue-400/50 text-blue-100 hover:bg-[#2563EB]/50 cursor-pointer'
                                : 'bg-white/10 text-white/75 hover:bg-white/20 cursor-pointer'
                        }`}
                      >
                        {isPcd && !isSelected ? (
                          <Accessibility className="w-3 h-3" />
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

      {/* Right: Legal Meia-Entrada + Combo + Booth Settlement */}
      <aside className="lg:col-span-5 bg-[#15171F] border border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <label
            htmlFor="box-customer-name"
            className="block text-xs uppercase tracking-[0.14em] text-white/60 mb-1.5"
          >
            Identificação no Recibo (opcional)
          </label>
          <input
            id="box-customer-name"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-lg bg-[#0D0E12] border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Inteira / Meia-Entrada */}
        <div className="space-y-2.5">
          <span className="block text-xs uppercase tracking-[0.14em] text-white/60 font-semibold">
            Tarifa Legal (Lei 12.933)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(['inteira', 'meia'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                aria-pressed={ticketTier === tier}
                onClick={() => setTicketTier(tier)}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-[0.1em] cursor-pointer ${
                  ticketTier === tier
                    ? 'bg-amber-400 text-[#0D0E12] border-amber-300'
                    : 'bg-[#0D0E12] text-white/75 border-white/15 hover:border-white/30'
                }`}
              >
                {tier === 'inteira' ? 'Inteira' : 'Meia-Entrada 50%'}
              </button>
            ))}
          </div>

          {ticketTier === 'meia' && (
            <div className="rounded-lg bg-[#0D0E12] border border-amber-400/35 p-3 space-y-2.5">
              <label htmlFor="box-meia-cat" className="block text-xs text-amber-200 font-semibold">
                Modalidade de Benefício
              </label>
              <select
                id="box-meia-cat"
                value={meiaCategory}
                onChange={(e) => setMeiaCategory(e.target.value as MeiaCategory)}
                className="w-full rounded-md bg-[#15171F] border border-white/15 px-2.5 py-2 text-xs text-white"
              >
                {MEIA_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <label className="flex items-start gap-2 text-xs text-white/85 cursor-pointer">
                <input
                  type="checkbox"
                  checked={meiaDocumentChecked}
                  onChange={(e) => setMeiaDocumentChecked(e.target.checked)}
                  className="mt-0.5 accent-emerald-400"
                />
                <span>Documento comprobatório original conferido pelo atendente no guichê.</span>
              </label>
            </div>
          )}
        </div>

        {/* Optional Canteen Combo */}
        <div>
          <label
            htmlFor="box-combo"
            className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-white/60 mb-1.5"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            Adicionar Combo (Retirada no Balcão)
          </label>
          <select
            id="box-combo"
            value={selectedComboId}
            onChange={(e) => setSelectedComboId(e.target.value)}
            className="w-full rounded-lg bg-[#0D0E12] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
          >
            <option value="">Sem combo da cantina</option>
            {canteenItems.map((item) => (
              <option key={item.id} value={item.id} disabled={item.stock === 0}>
                {item.name} — R$ {item.price} {item.stock === 0 ? '(Esgotado)' : `(${item.stock} disp.)`}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <span className="block text-xs uppercase tracking-[0.14em] text-white/60 font-semibold">
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
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    paymentMethod === opt.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
                      : 'bg-[#0D0E12] border-white/12 text-white/65 hover:border-white/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary & Emit */}
        <div className="rounded-xl bg-[#0D0E12] border border-white/10 p-4 space-y-2">
          <div className="flex justify-between text-xs text-white/65">
            <span>Poltronas ({selectedSeatIds.join(', ')})</span>
            <span className="font-mono text-white">
              {selectedSeatIds.length}× R$ {unitPrice}
            </span>
          </div>
          {selectedCombo && (
            <div className="flex justify-between text-xs text-white/65">
              <span>{selectedCombo.name}</span>
              <span className="font-mono text-white">R$ {selectedCombo.price}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
            <span className="text-xs uppercase tracking-[0.12em] text-white/65">Total no Guichê</span>
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              R$ {totalAmount}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canEmit}
          className="w-full py-3 rounded-lg bg-[#C40A14] hover:bg-[#a50811] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 transition cursor-pointer"
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
              Cliente: <strong>{customerName || 'Balcão'}</strong> · Disponível imediatamente no
              leitor da Portaria QR e em Meus Ingressos.
            </p>
            <p className="inline-flex items-center gap-1 text-xs text-emerald-200/80">
              <ShieldCheck className="w-3 h-3" />
              Meia conferida: {lastEmitted.meiaCategory ?? 'Tarifa Inteira'}
            </p>
          </div>
        )}
      </aside>
    </form>
  );
};
