import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  DollarSign,
  PlusCircle,
  RotateCcw,
  SlidersHorizontal,
  Utensils,
} from 'lucide-react';
import {
  CanteenItem,
  ClientTicketOrder,
  COMPLEX_OPTIONS,
  DATE_OPTIONS,
  MovieItem,
  ROOM_CAPACITY,
  SessionSlot,
  SessionStatus,
} from '../data/cinemaData';

export interface AdminOccupancyViewProps {
  movies: MovieItem[];
  canteenItems: CanteenItem[];
  orders: ClientTicketOrder[];
  onUpdateSessionPrice: (movieId: string, sessionId: string, newPrice: number) => void;
  onAddSession: (movieId: string, slot: SessionSlot) => void;
  onToggleSessionStatus?: (movieId: string, sessionId: string, status: SessionStatus) => void;
  onUpdateCanteenStock?: (itemId: string, stock: number) => void;
}

const COMPLEX_CHOICES = COMPLEX_OPTIONS.filter((c) => c !== 'Todos os Complexos');

export const AdminOccupancyView: React.FC<AdminOccupancyViewProps> = ({
  movies,
  canteenItems,
  orders,
  onUpdateSessionPrice,
  onAddSession,
  onToggleSessionStatus,
  onUpdateCanteenStock,
}) => {
  const [selectedMovieId, setSelectedMovieId] = useState(movies[0]?.id ?? '');
  const [newDateId, setNewDateId] = useState(DATE_OPTIONS[0]?.id ?? '14-dez');
  const [newComplex, setNewComplex] = useState(COMPLEX_CHOICES[0] ?? 'CineFood Paulista IMAX');
  const [newTime, setNewTime] = useState('23:10');
  const [newRoom, setNewRoom] = useState('Sala 03 · Atmos');
  const [newFormat, setNewFormat] = useState<SessionSlot['format']>('Dolby Atmos');
  const [newPrice, setNewPrice] = useState('46');
  const [formKey, setFormKey] = useState(0);
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, SessionStatus>>({});
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});

  const sessionRows = useMemo(() => {
    return movies.flatMap((movie) =>
      movie.sessions.map((session) => {
        const effectiveStatus = statusOverrides[session.id] ?? session.status;
        const activeTickets = orders
          .filter((o) => {
            if (o.status === 'CANCELADO' || o.canteenStatus === 'PENDENTE_PAGAMENTO') {
              return false;
            }
            if (o.orderKind === 'canteen-only') {
              return false;
            }
            const orderSessionId = (o as { sessionId?: string }).sessionId;
            if (orderSessionId) {
              return orderSessionId === session.id;
            }
            return (
              o.movieId === movie.id &&
              o.time === session.time &&
              o.dateLabel === session.dateLabel &&
              o.room === session.room
            );
          })
          .reduce((acc, o) => acc + o.seatsLabel.length, 0);

        const clampedTickets = Math.min(ROOM_CAPACITY, activeTickets);
        const occupancyRate = Number(((clampedTickets / ROOM_CAPACITY) * 100).toFixed(1));

        return {
          movie,
          session: { ...session, status: effectiveStatus },
          activeTickets: clampedTickets,
          occupancyRate,
        };
      }),
    );
  }, [movies, orders, statusOverrides]);

  const effectiveCanteenItems = useMemo(
    () =>
      canteenItems.map((item) => ({
        ...item,
        stock: stockOverrides[item.id] ?? item.stock,
      })),
    [canteenItems, stockOverrides],
  );

  const totalCapacity = sessionRows.length * ROOM_CAPACITY;
  const totalActiveTickets = sessionRows.reduce((acc, r) => acc + r.activeTickets, 0);
  const globalOccupancyPct =
    totalCapacity > 0 ? ((totalActiveTickets / totalCapacity) * 100).toFixed(1) : '0.0';
  const lowStockItems = effectiveCanteenItems.filter((item) => item.stock <= 2);

  const confirmedOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status !== 'CANCELADO' && o.canteenStatus !== 'PENDENTE_PAGAMENTO',
      ),
    [orders],
  );
  const confirmedRevenue = useMemo(
    () => confirmedOrders.reduce((acc, o) => acc + o.totalAmount, 0),
    [confirmedOrders],
  );

  const refundedOrders = useMemo(
    () => orders.filter((o) => o.status === 'CANCELADO'),
    [orders],
  );
  const refundedTotal = useMemo(
    () => refundedOrders.reduce((acc, o) => acc + o.totalAmount, 0),
    [refundedOrders],
  );

  const handlePriceStep = (
    movieId: string,
    sessionId: string,
    currentPrice: number,
    delta: number,
  ) => {
    const updated = Math.max(20, Math.min(120, currentPrice + delta));
    onUpdateSessionPrice(movieId, sessionId, updated);
    setAdminToast(`Tarifa atualizada para R$ ${updated}.`);
  };

  const handleStatusChange = (
    movieId: string,
    sessionId: string,
    nextStatus: SessionStatus,
  ) => {
    setStatusOverrides((prev) => ({ ...prev, [sessionId]: nextStatus }));
    onToggleSessionStatus?.(movieId, sessionId, nextStatus);
    setAdminToast(`Status da sessão alterado para ${nextStatus}.`);
  };

  const handleStockChange = (item: CanteenItem, delta: number) => {
    const current = stockOverrides[item.id] ?? item.stock;
    const nextStock = Math.max(0, current + delta);
    setStockOverrides((prev) => ({ ...prev, [item.id]: nextStock }));
    onUpdateCanteenStock?.(item.id, nextStock);
    setAdminToast(`Estoque de "${item.name}" atualizado para ${nextStock} un.`);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMovie = movies.find((m) => m.id === selectedMovieId) ?? movies[0];
    if (!targetMovie) return;

    const chosenDate =
      DATE_OPTIONS.find((d) => d.id === newDateId) ?? DATE_OPTIONS[0];
    const parsedPrice = Math.max(20, Math.min(120, Number(newPrice) || 44));
    const createdSlot: SessionSlot = {
      id: `${targetMovie.id}-adm-${Date.now()}`,
      complex: newComplex,
      room: newRoom.trim() || 'Sala 03 · Atmos',
      format: newFormat,
      dateId: chosenDate.id,
      dateLabel: `${chosenDate.day} ${chosenDate.month}`,
      dayNumber: chosenDate.day,
      monthLabel: chosenDate.month,
      time: newTime,
      startsAt: `2026-12-${chosenDate.day}T${newTime}:00-03:00`,
      status: 'ATIVA',
      occupancyPct: 0,
      basePrice: parsedPrice,
    };

    onAddSession(targetMovie.id, createdSlot);
    setFormKey((k) => k + 1);
    setAdminToast(
      `Nova sessão ${createdSlot.dateLabel} · ${createdSlot.time} (${createdSlot.format}) publicada em ${targetMovie.title}.`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + KPI Strip */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
            RF-10 · RF-15 · Gestão em Tempo Real
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[var(--text-primary)] mt-0.5">
            Painel Admin · Sessões, Preços &amp; Ocupação
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Fórmula oficial de ocupação:{' '}
            <span className="font-mono text-[var(--text-primary)]">
              ingressos ativos por sessionId ÷ {ROOM_CAPACITY} poltronas/sala × 100
            </span>
            .
          </p>
        </div>

        {adminToast && (
          <div
            role="status"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-xs text-emerald-100"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            {adminToast}
          </div>
        )}
      </div>

      {/* KPI Cards (Occupancy, Sales, Refunds, Sessions, Stock) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            Ocupação Média da Rede
          </p>
          <p className="font-mono text-3xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">
            {globalOccupancyPct}%
          </p>
          <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">
            {totalActiveTickets} / {totalCapacity} assentos ativos
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Vendas Confirmadas
          </p>
          <p className="font-mono text-3xl font-bold text-emerald-300 mt-1 tabular-nums">
            R$ {confirmedRevenue}
          </p>
          <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">
            {confirmedOrders.length} pedidos ativos/concluídos
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            Estornos / Cancelamentos (CDC)
          </p>
          <p className="font-mono text-3xl font-bold text-rose-300 mt-1 tabular-nums">
            R$ {refundedTotal}
          </p>
          <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">
            {refundedOrders.length} estornos registrados
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Sessões Publicadas
          </p>
          <p className="font-mono text-3xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">
            {sessionRows.length}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {sessionRows.filter((r) => r.session.status === 'ATIVA').length} ativas no catálogo
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            Alertas de Estoque
          </p>
          <p
            className={`font-mono text-3xl font-bold mt-1 tabular-nums ${
              lowStockItems.length > 0 ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {lowStockItems.length}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {lowStockItems.length > 0
              ? lowStockItems.map((i) => `${i.name} (${i.stock})`).join(' · ')
              : 'Todos os combos com estoque regular.'}
          </p>
        </div>
      </div>

      {/* Responsive Table (modern-web-guidance: responsive-table) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3
            id="admin-occupancy-heading"
            className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)] flex items-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            Grade de Sessões, Status &amp; Precificação Dinâmica
          </h3>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            Capacidade padrão: {ROOM_CAPACITY} poltronas
          </span>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-labelledby="admin-occupancy-heading"
          className="ops-table-wrapper"
        >
          <table className="ops-table">
            <thead>
              <tr>
                <th scope="col">Filme / Sessão</th>
                <th scope="col">Sala &amp; Formato</th>
                <th scope="col">Ativos / Total</th>
                <th scope="col">Taxa de Ocupação</th>
                <th scope="col">Status</th>
                <th scope="col">Inteira (R$)</th>
              </tr>
            </thead>
            <tbody>
              {sessionRows.map(({ movie, session, activeTickets, occupancyRate }) => (
                <tr key={session.id}>
                  <th scope="row">
                    <div className="text-sm font-bold text-[var(--text-primary)]">{movie.title}</div>
                    <div className="font-mono text-xs text-[var(--text-secondary)]">
                      {session.dateLabel} · {session.time}
                    </div>
                  </th>
                  <td data-label="Sala &amp; Formato" className="text-xs text-[var(--text-secondary)]">
                    <div>{session.room}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {session.format} · {session.complex}
                    </div>
                  </td>
                  <td data-label="Ativos / Total" className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                    {activeTickets} / {ROOM_CAPACITY}
                  </td>
                  <td data-label="Ocupação" className="min-w-[140px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancyRate >= 85
                              ? 'bg-[var(--brand-red)]'
                              : occupancyRate >= 55
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, occupancyRate)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-[var(--text-primary)] tabular-nums">
                        {occupancyRate}%
                      </span>
                    </div>
                  </td>
                  <td data-label="Status">
                    <select
                      aria-label={`Status da sessão ${movie.title} ${session.time}`}
                      value={session.status}
                      onChange={(e) =>
                        handleStatusChange(movie.id, session.id, e.target.value as SessionStatus)
                      }
                      className={`rounded-md border px-2 py-1.5 font-mono text-xs font-bold focus:outline-none focus:border-[var(--focus-ring)] cursor-pointer ${
                        session.status === 'ATIVA'
                          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                          : session.status === 'INATIVA'
                            ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                            : 'bg-red-500/15 border-red-400/40 text-red-200'
                      }`}
                    >
                      <option value="ATIVA">ATIVA</option>
                      <option value="INATIVA">INATIVA</option>
                      <option value="ENCERRADA">ENCERRADA</option>
                    </select>
                  </td>
                  <td data-label="Inteira (R$)">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Diminuir preço da sessão ${movie.title} ${session.time}`}
                        onClick={() =>
                          handlePriceStep(movie.id, session.id, session.basePrice, -2)
                        }
                        className="w-8 h-8 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-mono text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono text-sm font-bold text-[var(--text-primary)] w-14 text-center tabular-nums">
                        R$ {session.basePrice}
                      </span>
                      <button
                        type="button"
                        aria-label={`Aumentar preço da sessão ${movie.title} ${session.time}`}
                        onClick={() =>
                          handlePriceStep(movie.id, session.id, session.basePrice, 2)
                        }
                        className="w-8 h-8 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-mono text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create New Session + Editable Canteen Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          key={formKey}
          onSubmit={handleCreateSession}
          className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-primary)]">
              Publicar Nova Sessão (RF-10)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="adm-movie" className="block text-xs text-[var(--text-secondary)] mb-1">
                Filme
              </label>
              <select
                id="adm-movie"
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
                className="w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adm-date" className="block text-xs text-[var(--text-secondary)] mb-1">
                Data da Programação
              </label>
              <select
                id="adm-date"
                value={newDateId}
                onChange={(e) => setNewDateId(e.target.value)}
                className="w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
              >
                {DATE_OPTIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.day} {d.month} ({d.weekday})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adm-complex" className="block text-xs text-[var(--text-secondary)] mb-1">
                Complexo
              </label>
              <select
                id="adm-complex"
                value={newComplex}
                onChange={(e) => setNewComplex(e.target.value)}
                className="w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
              >
                {COMPLEX_CHOICES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adm-format" className="block text-xs text-[var(--text-secondary)] mb-1">
                Formato de Projeção
              </label>
              <select
                id="adm-format"
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value as SessionSlot['format'])}
                className="w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
              >
                <option value="IMAX 3D">IMAX 3D</option>
                <option value="Dolby Atmos">Dolby Atmos</option>
                <option value="2D">2D</option>
              </select>
            </div>

            <div>
              <label htmlFor="adm-time" className="block text-xs text-[var(--text-secondary)] mb-1">
                Horário (HH:MM)
              </label>
              <input
                id="adm-time"
                type="text"
                required
                pattern="\d{2}:\d{2}"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="cine-input w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 font-mono text-base sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
              />
            </div>

            <div>
              <label htmlFor="adm-price" className="block text-xs text-[var(--text-secondary)] mb-1">
                Inteira (R$)
              </label>
              <input
                id="adm-price"
                type="number"
                required
                min={20}
                max={120}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="cine-input w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 font-mono text-base sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="adm-room" className="block text-xs text-[var(--text-secondary)] mb-1">
              Sala
            </label>
            <input
              id="adm-room"
              type="text"
              required
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              className="cine-input w-full min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
            />
          </div>

          <button
            type="submit"
            className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[var(--brand-red)] hover:bg-[var(--brand-red-hover)] text-white text-xs font-bold uppercase tracking-[0.12em] transition cursor-pointer"
          >
            Adicionar Sessão ao Cartaz
          </button>
        </form>

        <section className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-primary)] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Gestão de Estoque da Cantina
          </h3>
          <ul className="space-y-2">
            {effectiveCanteenItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2.5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-primary)] truncate">{item.name}</p>
                  <p className="font-mono text-xs text-[var(--text-muted)]">
                    R$ {item.price} · {item.category}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label={`Reduzir estoque de ${item.name}`}
                    disabled={item.stock <= 0}
                    onClick={() => handleStockChange(item, -1)}
                    className="w-8 h-8 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] disabled:opacity-40 text-[var(--text-primary)] font-mono text-xs cursor-pointer"
                  >
                    -1
                  </button>
                  <span
                    className={`min-w-[68px] text-center font-mono text-xs font-bold px-2 py-1 rounded ${
                      item.stock === 0
                        ? 'bg-red-500/20 text-red-300'
                        : item.stock <= 2
                          ? 'bg-amber-500/20 text-amber-200'
                          : 'bg-emerald-500/20 text-emerald-200'
                    }`}
                  >
                    {item.stock === 0 ? 'ESGOTADO' : `${item.stock} un`}
                  </span>
                  <button
                    type="button"
                    aria-label={`Aumentar estoque de ${item.name}`}
                    onClick={() => handleStockChange(item, 1)}
                    className="w-8 h-8 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-mono text-xs cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    aria-label={`Repor 5 unidades de ${item.name}`}
                    onClick={() => handleStockChange(item, 5)}
                    className="px-2 h-8 rounded bg-emerald-500/15 border border-emerald-400/35 hover:bg-emerald-500/25 text-emerald-200 font-mono text-xs font-semibold cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
