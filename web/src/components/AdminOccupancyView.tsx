import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Film,
  PlusCircle,
  RotateCcw,
  SlidersHorizontal,
  Users,
  Utensils,
} from 'lucide-react';
import {
  CanteenCategory,
  CanteenItem,
  ClientTicketOrder,
  DATE_OPTIONS,
  MovieItem,
  PILOT_ROOMS,
  PILOT_UNIT_NAME,
  ROOM_CAPACITY,
  SessionSlot,
  SessionStatus,
  STAFF_PROFILES,
  StaffOperatorProfile,
} from '../data/cinemaData';

export interface AdminOccupancyViewProps {
  movies: MovieItem[];
  canteenItems: CanteenItem[];
  orders: ClientTicketOrder[];
  operators?: StaffOperatorProfile[];
  onUpdateSessionPrice: (movieId: string, sessionId: string, newPrice: number) => void;
  onAddSession: (movieId: string, slot: SessionSlot) => void;
  onToggleSessionStatus?: (movieId: string, sessionId: string, status: SessionStatus) => void;
  onUpdateCanteenStock?: (itemId: string, stock: number) => void;
  onAddMovie?: (movie: MovieItem) => void;
  onAddCanteenItem?: (item: CanteenItem) => void;
  onUpsertOperator?: (op: StaffOperatorProfile) => void;
}

const COMPLEX_CHOICES = [PILOT_UNIT_NAME];

export const AdminOccupancyView: React.FC<AdminOccupancyViewProps> = ({
  movies,
  canteenItems,
  orders,
  operators = STAFF_PROFILES,
  onUpdateSessionPrice,
  onAddSession,
  onToggleSessionStatus,
  onUpdateCanteenStock,
  onAddMovie,
  onAddCanteenItem,
  onUpsertOperator,
}) => {
  const [selectedMovieId, setSelectedMovieId] = useState(movies[0]?.id ?? '');
  const [newDateId, setNewDateId] = useState(DATE_OPTIONS[0]?.id ?? '14-dez');
  const [newComplex, setNewComplex] = useState(COMPLEX_CHOICES[0]);
  const [newTime, setNewTime] = useState('23:10');
  const [newRoom, setNewRoom] = useState<string>(PILOT_ROOMS[2]);
  const [newFormat, setNewFormat] = useState<SessionSlot['format']>('Dolby Atmos');
  const [newPrice, setNewPrice] = useState('46');
  const [formKey, setFormKey] = useState(0);
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, SessionStatus>>({});
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>({});
  const [roomCapacities, setRoomCapacities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const r of PILOT_ROOMS) init[r] = ROOM_CAPACITY;
    return init;
  });
  const [adminMovieFilter, setAdminMovieFilter] = useState<string>('ALL');
  const [showAllMobileSessions, setShowAllMobileSessions] = useState(false);

  // RF-10 extra CRUD states
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [newMovieDirector, setNewMovieDirector] = useState('');
  const [newMovieDuration, setNewMovieDuration] = useState('120');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<CanteenCategory>('combos');
  const [newItemPrice, setNewItemPrice] = useState('35');
  const [newItemStock, setNewItemStock] = useState('15');
  const [newOpName, setNewOpName] = useState('');
  const [newOpRole, setNewOpRole] = useState<StaffOperatorProfile['role']>('OPERADOR_BILHETERIA');

  const sessionRows = useMemo(() => {
    return movies.flatMap((movie) =>
      movie.sessions.map((session) => {
        const effectiveStatus = statusOverrides[session.id] ?? session.status;
        const sellableSeats = roomCapacities[session.room] ?? ROOM_CAPACITY;
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

        const clampedTickets = sellableSeats > 0 ? Math.min(sellableSeats, activeTickets) : activeTickets;
        const occupancyRate: number | null =
          sellableSeats > 0 ? Number(((clampedTickets / sellableSeats) * 100).toFixed(1)) : null;

        return {
          movie,
          session: { ...session, status: effectiveStatus },
          sellableSeats,
          activeTickets: clampedTickets,
          occupancyRate,
        };
      }),
    );
  }, [movies, orders, statusOverrides, roomCapacities]);

  const effectiveCanteenItems = useMemo(
    () =>
      canteenItems.map((item) => ({
        ...item,
        stock: stockOverrides[item.id] ?? item.stock,
      })),
    [canteenItems, stockOverrides],
  );

  const totalCapacity = sessionRows.reduce((acc, r) => acc + r.sellableSeats, 0);
  const totalActiveTickets = sessionRows.reduce((acc, r) => acc + r.activeTickets, 0);
  const globalOccupancyDisplay =
    totalCapacity > 0
      ? `${((totalActiveTickets / totalCapacity) * 100).toFixed(1)}%`
      : 'não aplicável';
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
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
        <div className="rounded-2xl border border-[var(--border-subtle)] border-t-2 border-t-amber-400 bg-[var(--bg-surface)]/95 p-3 shadow-md sm:p-4">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)] sm:text-xs sm:tracking-[0.14em]">
            <BarChart3 className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
            <span className="truncate">Ocupação Média</span>
          </p>
          <p className="font-mono-tabular mt-1 text-xl font-bold text-[var(--text-primary)] sm:mt-1.5 sm:text-3xl">
            {globalOccupancyDisplay}
          </p>
          <p className="font-mono-tabular mt-0.5 text-[11px] text-[var(--text-muted)] sm:text-xs">
            {totalActiveTickets} / {totalCapacity} assentos
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] border-t-2 border-t-emerald-400 bg-[var(--bg-surface)]/95 p-3 shadow-md sm:p-4">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)] sm:text-xs sm:tracking-[0.14em]">
            <DollarSign className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
            <span className="truncate">Vendas Confirmadas</span>
          </p>
          <p className="font-mono-tabular mt-1 text-xl font-bold text-emerald-300 sm:mt-1.5 sm:text-3xl">
            R$ {confirmedRevenue}
          </p>
          <p className="font-mono-tabular mt-0.5 text-[11px] text-[var(--text-muted)] sm:text-xs">
            {confirmedOrders.length} pedidos
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] border-t-2 border-t-rose-400 bg-[var(--bg-surface)]/95 p-3 shadow-md sm:p-4">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)] sm:text-xs sm:tracking-[0.14em]">
            <RotateCcw className="h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
            <span className="truncate">Estornos / Cancelamentos (CDC)</span>
          </p>
          <p className="font-mono-tabular mt-1 text-xl font-bold text-rose-300 sm:mt-1.5 sm:text-3xl">
            R$ {refundedTotal}
          </p>
          <p className="font-mono-tabular mt-0.5 text-[11px] text-[var(--text-muted)] sm:text-xs">
            {refundedOrders.length} estornos
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] border-t-2 border-t-white/40 bg-[var(--bg-surface)]/95 p-3 shadow-md sm:p-4">
          <p className="truncate text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)] sm:text-xs sm:tracking-[0.14em]">
            Sessões Publicadas
          </p>
          <p className="font-mono-tabular mt-1 text-xl font-bold text-[var(--text-primary)] sm:mt-1.5 sm:text-3xl">
            {sessionRows.length}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)] sm:text-xs">
            {sessionRows.filter((r) => r.session.status === 'ATIVA').length} ativas no catálogo
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border border-[var(--border-subtle)] border-t-2 border-t-amber-500 bg-[var(--bg-surface)]/95 p-3 shadow-md sm:col-span-1 sm:p-4">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)] sm:text-xs sm:tracking-[0.14em]">
            <Utensils className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
            Alertas de Estoque
          </p>
          <p
            className={`font-mono-tabular mt-1 text-xl font-bold sm:mt-1.5 sm:text-3xl ${
              lowStockItems.length > 0 ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {lowStockItems.length}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--text-muted)] sm:text-xs">
            {lowStockItems.length > 0
              ? lowStockItems.map((i) => `${i.name} (${i.stock})`).join(' · ')
              : 'Todos os combos com estoque regular.'}
          </p>
        </div>
      </div>

      {/* Responsive Table */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
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
          className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filtrar grade por filme"
        >
          <button
            type="button"
            aria-pressed={adminMovieFilter === 'ALL'}
            onClick={() => {
              setAdminMovieFilter('ALL');
              setShowAllMobileSessions(false);
            }}
            className={`min-h-[38px] shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              adminMovieFilter === 'ALL'
                ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Todos ({sessionRows.length})
          </button>
          {movies.map((m) => {
            const active = adminMovieFilter === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setAdminMovieFilter(m.id);
                  setShowAllMobileSessions(true);
                }}
                className={`min-h-[38px] shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {m.title}
              </button>
            );
          })}
        </div>

        {(() => {
          const filteredRows =
            adminMovieFilter === 'ALL'
              ? sessionRows
              : sessionRows.filter((r) => r.movie.id === adminMovieFilter);
          const hiddenMobileCount =
            !showAllMobileSessions && filteredRows.length > 5 ? filteredRows.length - 5 : 0;

          return (
            <>
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
                    {filteredRows.map(({ movie, session, sellableSeats, activeTickets, occupancyRate }, idx) => (
                      <tr
                        key={session.id}
                        className={!showAllMobileSessions && idx >= 5 ? 'hidden sm:table-row' : undefined}
                      >
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
                          {activeTickets} / {sellableSeats}
                        </td>
                        <td data-label="Ocupação" className="min-w-[140px]">
                          {occupancyRate === null ? (
                            <span className="font-mono text-xs font-semibold text-amber-300">
                              não aplicável
                            </span>
                          ) : (
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
                          )}
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

              {filteredRows.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllMobileSessions((prev) => !prev)}
                  className="cine-press flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:border-[var(--border-strong)] sm:hidden"
                >
                  {hiddenMobileCount > 0
                    ? `Mostrar mais ${hiddenMobileCount} sessões (total ${filteredRows.length})`
                    : 'Recolher grade para 5 sessões'}
                </button>
              )}
            </>
          );
        })()}
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
              Sala (Unidade Piloto · 4 Salas)
            </label>
            <select
              id="adm-room"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-base text-[var(--text-primary)] focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs"
            >
              {PILOT_ROOMS.map((roomName) => (
                <option key={roomName} value={roomName}>
                  {roomName}
                </option>
              ))}
            </select>
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

      {/* RF-10 Complete Operational Management Grid (Filmes, Salas/Assentos, Cantina, Operadores) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-5 shadow-md">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-primary)]">
            <Film className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Salas &amp; Assentos Comercializáveis (RF-10 / RF-15)
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {PILOT_ROOMS.map((roomName) => {
              const cap = roomCapacities[roomName] ?? ROOM_CAPACITY;
              return (
                <div
                  key={roomName}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{roomName}</p>
                    <p className="font-mono text-[11px] text-[var(--text-muted)]">
                      {cap === 0 ? 'Ocupação: não aplicável' : `${cap} assentos ativos`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Zerar assentos comercializáveis de ${roomName}`}
                      onClick={() => {
                        setRoomCapacities((prev) => ({ ...prev, [roomName]: 0 }));
                        setAdminToast(`${roomName} marcada com 0 assentos comercializáveis (não aplicável).`);
                      }}
                      className="cine-press min-h-[36px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:text-white"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      aria-label={`Restaurar 96 assentos de ${roomName}`}
                      onClick={() => {
                        setRoomCapacities((prev) => ({ ...prev, [roomName]: ROOM_CAPACITY }));
                        setAdminToast(`${roomName} restaurada para ${ROOM_CAPACITY} assentos.`);
                      }}
                      className="cine-press min-h-[36px] rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-200"
                    >
                      96
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {onAddMovie && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newMovieTitle.trim()) return;
                const createdMovie: MovieItem = {
                  id: `mov-adm-${Date.now()}`,
                  indexLabel: String(movies.length + 1).padStart(2, '0'),
                  kickerLocation: `${PILOT_ROOMS[0]} · ${PILOT_UNIT_NAME}`,
                  title: newMovieTitle.trim().toUpperCase(),
                  tagline: 'Estreia cadastrada pelo painel administrativo da unidade piloto.',
                  synopsis: 'Filme cadastrado na programação operacional do CineFood.',
                  premiere: '18 Dezembro 2026',
                  director: newMovieDirector.trim() || 'Direção Piloto',
                  musicBy: 'Trilha Original',
                  genre: 'Drama',
                  duration: `${Math.max(60, Number(newMovieDuration) || 120)} min`,
                  rating: '12 anos',
                  complexes: [PILOT_UNIT_NAME],
                  tone: 'amber',
                  backdropSrc: '/assets/horizon-backdrop.jpg',
                  posterSrc: '/assets/horizon-poster.jpg',
                  trailerDuration: '01:45',
                  trailerHighlight: 'Estreia piloto',
                  sessions: [],
                };
                onAddMovie(createdMovie);
                setSelectedMovieId(createdMovie.id);
                setNewMovieTitle('');
                setNewMovieDirector('');
                setAdminToast(`Filme "${createdMovie.title}" cadastrado no catálogo (RF-10).`);
              }}
              className="space-y-2.5 border-t border-[var(--border-subtle)] pt-4"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Cadastrar Novo Filme
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  type="text"
                  required
                  placeholder="Título do filme"
                  aria-label="Título do novo filme"
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  className="cine-input min-h-[44px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)]"
                />
                <input
                  type="text"
                  placeholder="Direção"
                  aria-label="Direção do novo filme"
                  value={newMovieDirector}
                  onChange={(e) => setNewMovieDirector(e.target.value)}
                  className="cine-input min-h-[44px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)]"
                />
                <input
                  type="number"
                  min={60}
                  max={240}
                  aria-label="Duração em minutos"
                  value={newMovieDuration}
                  onChange={(e) => setNewMovieDuration(e.target.value)}
                  className="cine-input min-h-[44px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
                />
              </div>
              <button
                type="submit"
                className="cine-press min-h-[44px] rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
              >
                Cadastrar Filme
              </button>
            </form>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-5 shadow-md">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-primary)]">
            <Users className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Produtos da Cantina &amp; Operadores RBAC (RF-10)
          </h3>

          {onAddCanteenItem && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newItemName.trim()) return;
                const item: CanteenItem = {
                  id: `cnt-adm-${Date.now()}`,
                  name: newItemName.trim(),
                  description: 'Item adicionado pelo painel administrativo (RF-10).',
                  category: newItemCategory,
                  price: Math.max(5, Number(newItemPrice) || 25),
                  tag: 'Novo',
                  stock: Math.max(0, Number(newItemStock) || 10),
                  imageSrc: '/assets/combo-cinema.jpg',
                  addons: [],
                };
                onAddCanteenItem(item);
                setNewItemName('');
                setAdminToast(`Produto "${item.name}" adicionado ao cardápio da cantina.`);
              }}
              className="space-y-2.5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Novo Produto na Cantina
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <input
                  type="text"
                  required
                  placeholder="Nome do combo/item"
                  aria-label="Nome do novo produto da cantina"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="cine-input col-span-2 min-h-[44px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)]"
                />
                <select
                  aria-label="Categoria do novo produto"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as CanteenCategory)}
                  className="min-h-[44px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs text-[var(--text-primary)]"
                >
                  <option value="combos">Combos</option>
                  <option value="pipocas">Pipocas</option>
                  <option value="bebidas">Bebidas</option>
                  <option value="doces">Doces</option>
                </select>
                <input
                  type="number"
                  min={5}
                  placeholder="R$"
                  aria-label="Preço do novo produto"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="cine-input min-h-[44px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  aria-label="Estoque inicial do novo produto"
                  value={newItemStock}
                  onChange={(e) => setNewItemStock(e.target.value)}
                  className="cine-input min-h-[44px] w-28 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
                />
                <button
                  type="submit"
                  className="cine-press min-h-[44px] rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
                >
                  Adicionar Produto
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Operadores Autorizados ({operators.length})
            </p>
            <ul className="space-y-1.5 text-xs">
              {operators.map((op) => (
                <li
                  key={`${op.role}-${op.operatorName}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2"
                >
                  <span className="font-semibold text-[var(--text-primary)]">{op.operatorName}</span>
                  <span className="font-mono text-[11px] text-amber-300">{op.role}</span>
                </li>
              ))}
            </ul>
            {onUpsertOperator && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newOpName.trim()) return;
                  const base = operators.find((o) => o.role === newOpRole) ?? operators[0];
                  onUpsertOperator({
                    ...base,
                    role: newOpRole,
                    operatorName: newOpName.trim(),
                  });
                  setNewOpName('');
                  setAdminToast(`Operador "${newOpName.trim()}" atribuído ao papel ${newOpRole}.`);
                }}
                className="flex flex-wrap gap-2 pt-1"
              >
                <input
                  type="text"
                  required
                  placeholder="Nome do operador"
                  aria-label="Nome do operador"
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  className="cine-input min-h-[44px] flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)]"
                />
                <select
                  aria-label="Papel RBAC do operador"
                  value={newOpRole}
                  onChange={(e) => setNewOpRole(e.target.value as StaffOperatorProfile['role'])}
                  className="min-h-[44px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs text-[var(--text-primary)]"
                >
                  <option value="OPERADOR_BILHETERIA">OPERADOR_BILHETERIA</option>
                  <option value="OPERADOR_PORTARIA">OPERADOR_PORTARIA</option>
                  <option value="OPERADOR_CANTINA">OPERADOR_CANTINA</option>
                  <option value="RUNNER">RUNNER</option>
                  <option value="ADMIN_CINEMA">ADMIN_CINEMA</option>
                </select>
                <button
                  type="submit"
                  className="cine-press min-h-[44px] rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
                >
                  Salvar Operador
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
