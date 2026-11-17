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
            Gestão em Tempo Real
          </p>
          <h2 className="font-display mt-0.5 text-2xl font-bold uppercase tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Painel Admin · Sessões, Preços &amp; Ocupação
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
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
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2 text-xs text-emerald-100"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
            {adminToast}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-[var(--border-subtle)] border-t-2 border-t-amber-400 bg-[var(--bg-surface)]/95 p-4 shadow-md">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            <BarChart3 className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            Ocupação Média da Rede
          </p>
          <p className="font-mono-tabular mt-1.5 text-3xl font-bold text-[var(--text-primary)]">
            {globalOccupancyPct}%
          </p>
          <p className="font-mono-tabular mt-0.5 text-xs text-[var(--text-muted)]">
            {totalActiveTickets} / {totalCapacity} assentos ativos
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] border-t-2 border-t-emerald-400 bg-[var(--bg-surface)]/95 p-4 shadow-md">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            Vendas Confirmadas
          </p>
          <p className="font-mono-tabular mt-1.5 text-3xl font-bold text-emerald-300">
            R$ {confirmedRevenue}
          </p>
          <p className="font-mono-tabular mt-0.5 text-xs text-[var(--text-muted)]">
            {confirmedOrders.length} pedidos ativos/concluídos
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] border-t-2 border-t-rose-400 bg-[var(--bg-surface)]/95 p-4 shadow-md">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            <RotateCcw className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
            Estornos / Cancelamentos (CDC)
          </p>
          <p className="font-mono-tabular mt-1.5 text-3xl font-bold text-rose-300">
            R$ {refundedTotal}
          </p>
          <p className="font-mono-tabular mt-0.5 text-xs text-[var(--text-muted)]">
            {refundedOrders.length} estornos registrados
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] border-t-2 border-t-white/40 bg-[var(--bg-surface)]/95 p-4 shadow-md">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Sessões Publicadas
          </p>
          <p className="font-mono-tabular mt-1.5 text-3xl font-bold text-[var(--text-primary)]">
            {sessionRows.length}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {sessionRows.filter((r) => r.session.status === 'ATIVA').length} ativas no catálogo
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] border-t-2 border-t-amber-500 bg-[var(--bg-surface)]/95 p-4 shadow-md">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            <Utensils className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            Alertas de Estoque
          </p>
          <p
            className={`font-mono-tabular mt-1.5 text-3xl font-bold ${
              lowStockItems.length > 0 ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {lowStockItems.length}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-muted)]">
            {lowStockItems.length > 0
              ? lowStockItems.map((i) => `${i.name} (${i.stock})`).join(' · ')
              : 'Todos os combos com estoque regular.'}
          </p>
        </div>
      </div>

      {/* Responsive Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3
            id="admin-occupancy-heading"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
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
          className="ops-table-wrapper rounded-2xl"
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
                  <td data-label="Sala & Formato" className="text-xs text-[var(--text-secondary)]">
                    <div>{session.room}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {session.format} · {session.complex}
                    </div>
                  </td>
                  <td data-label="Ativos / Total" className="font-mono-tabular text-xs text-[var(--text-primary)]">
                    {activeTickets} / {ROOM_CAPACITY}
                  </td>
                  <td data-label="Ocupação" className="min-w-[140px]">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full transition-all ${
                            occupancyRate >= 85
                              ? 'bg-[var(--brand-red)]'
                              : occupancyRate >= 55
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, occupancyRate)}%` }}
                        />
                      </div>
                      <span className="font-mono-tabular text-xs font-semibold text-[var(--text-primary)]">
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
                      className={`min-h-[38px] cursor-pointer rounded-lg border px-2.5 py-1.5 font-mono text-xs font-bold focus:border-[var(--focus-ring)] focus:outline-none ${
                        session.status === 'ATIVA'
                          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                          : session.status === 'INATIVA'
                            ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                            : 'border-red-400/40 bg-red-500/15 text-red-200'
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
                        className="cine-press font-mono h-9 w-9 cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                      >
                        -
                      </button>
                      <span className="font-mono-tabular w-14 text-center text-sm font-bold text-[var(--text-primary)]">
                        R$ {session.basePrice}
                      </span>
                      <button
                        type="button"
                        aria-label={`Aumentar preço da sessão ${movie.title} ${session.time}`}
                        onClick={() =>
                          handlePriceStep(movie.id, session.id, session.basePrice, 2)
                        }
                        className="cine-press font-mono h-9 w-9 cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)]"
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
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <form
          key={formKey}
          onSubmit={handleCreateSession}
          className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-5 shadow-md lg:col-span-7"
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-primary)]">
              Publicar Nova Sessão
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="adm-movie" className="mb-1 block text-xs text-[var(--text-secondary)]">
                Filme
              </label>
              <select
                id="adm-movie"
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adm-date" className="mb-1 block text-xs text-[var(--text-secondary)]">
                Data da Programação
              </label>
              <select
                id="adm-date"
                value={newDateId}
                onChange={(e) => setNewDateId(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
              >
                {DATE_OPTIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.day} {d.month} ({d.weekday})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="adm-complex"
                className="mb-1 block text-xs text-[var(--text-secondary)]"
              >
                Complexo
              </label>
              <select
                id="adm-complex"
                value={newComplex}
                onChange={(e) => setNewComplex(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
              >
                {COMPLEX_CHOICES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adm-format" className="mb-1 block text-xs text-[var(--text-secondary)]">
                Formato de Projeção
              </label>
              <select
                id="adm-format"
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value as SessionSlot['format'])}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
              >
                <option value="IMAX 3D">IMAX 3D</option>
                <option value="Dolby Atmos">Dolby Atmos</option>
                <option value="2D">2D</option>
              </select>
            </div>

            <div>
              <label htmlFor="adm-time" className="mb-1 block text-xs text-[var(--text-secondary)]">
                Horário (HH:MM)
              </label>
              <input
                id="adm-time"
                type="text"
                required
                pattern="\d{2}:\d{2}"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="cine-input min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
              />
            </div>

            <div>
              <label htmlFor="adm-price" className="mb-1 block text-xs text-[var(--text-secondary)]">
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
                className="cine-input min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="adm-room" className="mb-1 block text-xs text-[var(--text-secondary)]">
              Sala
            </label>
            <input
              id="adm-room"
              type="text"
              required
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              className="cine-input min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
            />
          </div>

          <button
            type="submit"
            className="cine-press min-h-[44px] cursor-pointer rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-md transition hover:bg-[var(--brand-red-hover)]"
          >
            Adicionar Sessão ao Cartaz
          </button>
        </form>

        <section className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-5 shadow-md lg:col-span-5">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-primary)]">
            <AlertCircle className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Gestão de Estoque da Cantina
          </h3>
          <ul className="space-y-2.5">
            {effectiveCanteenItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2.5 text-xs"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <img
                    src={item.imageSrc}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg border border-white/10 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--text-primary)]">{item.name}</p>
                    <p className="font-mono text-xs text-[var(--text-muted)]">
                      R$ {item.price} · {item.category}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Reduzir estoque de ${item.name}`}
                    disabled={item.stock <= 0}
                    onClick={() => handleStockChange(item, -1)}
                    className="cine-press font-mono h-9 w-9 cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)] disabled:opacity-40"
                  >
                    -1
                  </button>
                  <span
                    className={`font-mono-tabular min-w-[72px] rounded-lg px-2 py-1.5 text-center text-xs font-bold ${
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
                    className="cine-press font-mono h-9 w-9 cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    aria-label={`Repor 5 unidades de ${item.name}`}
                    onClick={() => handleStockChange(item, 5)}
                    className="cine-press font-mono h-9 cursor-pointer rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
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
