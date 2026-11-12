import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  PlusCircle,
  SlidersHorizontal,
  Utensils,
} from 'lucide-react';
import {
  CanteenItem,
  ClientTicketOrder,
  MovieItem,
  ROOM_CAPACITY,
  SessionSlot,
} from '../data/cinemaData';

interface AdminOccupancyViewProps {
  movies: MovieItem[];
  canteenItems: CanteenItem[];
  orders: ClientTicketOrder[];
  onUpdateSessionPrice: (movieId: string, sessionId: string, newPrice: number) => void;
  onAddSession: (movieId: string, slot: SessionSlot) => void;
}

export const AdminOccupancyView: React.FC<AdminOccupancyViewProps> = ({
  movies,
  canteenItems,
  orders,
  onUpdateSessionPrice,
  onAddSession,
}) => {
  const [selectedMovieId, setSelectedMovieId] = useState(movies[0]?.id ?? '');
  const [newTime, setNewTime] = useState('23:10');
  const [newRoom, setNewRoom] = useState('Sala 03 · Atmos');
  const [newFormat, setNewFormat] = useState<SessionSlot['format']>('Dolby Atmos');
  const [newPrice, setNewPrice] = useState('46');
  const [formKey, setFormKey] = useState(0);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const sessionRows = useMemo(() => {
    return movies.flatMap((movie) =>
      movie.sessions.map((session) => {
        const baselineTickets = Math.round((session.occupancyPct / 100) * ROOM_CAPACITY);
        const activeOrderSeats = orders
          .filter(
            (o) =>
              o.movieId === movie.id &&
              o.time === session.time &&
              o.status !== 'CANCELADO',
          )
          .reduce((acc, o) => acc + o.seatsLabel.length, 0);

        const activeTickets = Math.min(ROOM_CAPACITY, baselineTickets + activeOrderSeats);
        const occupancyRate = Number(((activeTickets / ROOM_CAPACITY) * 100).toFixed(1));

        return {
          movie,
          session,
          activeTickets,
          occupancyRate,
        };
      }),
    );
  }, [movies, orders]);

  const totalCapacity = sessionRows.length * ROOM_CAPACITY;
  const totalActiveTickets = sessionRows.reduce((acc, r) => acc + r.activeTickets, 0);
  const globalOccupancyPct =
    totalCapacity > 0 ? ((totalActiveTickets / totalCapacity) * 100).toFixed(1) : '0.0';
  const lowStockItems = canteenItems.filter((item) => item.stock <= 2);

  const handlePriceStep = (movieId: string, sessionId: string, currentPrice: number, delta: number) => {
    const updated = Math.max(20, Math.min(120, currentPrice + delta));
    onUpdateSessionPrice(movieId, sessionId, updated);
    setAdminToast(`Tarifa atualizada para R$ ${updated}.`);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMovie = movies.find((m) => m.id === selectedMovieId) ?? movies[0];
    if (!targetMovie) return;

    const parsedPrice = Math.max(20, Number(newPrice) || 44);
    const createdSlot: SessionSlot = {
      id: `${targetMovie.id}-adm-${Date.now()}`,
      complex: targetMovie.complexes[0] ?? 'CineFood Paulista IMAX',
      room: newRoom.trim() || 'Sala 03 · Atmos',
      format: newFormat,
      dateId: '14-dez',
      dateLabel: '14 DEZ',
      dayNumber: '14',
      monthLabel: 'DEZ',
      time: newTime,
      occupancyPct: 12,
      basePrice: parsedPrice,
    };

    onAddSession(targetMovie.id, createdSlot);
    setFormKey((k) => k + 1);
    setAdminToast(
      `Nova sessão ${createdSlot.time} (${createdSlot.format}) publicada em ${targetMovie.title}.`,
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
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white mt-0.5">
            Painel Admin · Sessões, Preços &amp; Ocupação
          </h2>
          <p className="text-xs text-white/65 mt-1">
            Fórmula oficial de ocupação:{' '}
            <span className="font-mono text-white">
              ingressos ativos ÷ assentos totais ({ROOM_CAPACITY}/sala) × 100
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#15171F] border border-white/10 rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-white/70 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            Ocupação Média da Rede
          </p>
          <p className="font-mono text-3xl font-bold text-white mt-1 tabular-nums">
            {globalOccupancyPct}%
          </p>
          <p className="font-mono text-xs text-white/65 mt-0.5">
            {totalActiveTickets} / {totalCapacity} assentos ativos
          </p>
        </div>

        <div className="bg-[#15171F] border border-white/10 rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-white/70">
            Sessões Publicadas
          </p>
          <p className="font-mono text-3xl font-bold text-white mt-1 tabular-nums">
            {sessionRows.length}
          </p>
          <p className="text-xs text-white/65 mt-0.5">
            Alterações refletem imediatamente no catálogo do cliente.
          </p>
        </div>

        <div className="bg-[#15171F] border border-white/10 rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-white/70 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            Alertas de Estoque Cantina
          </p>
          <p
            className={`font-mono text-3xl font-bold mt-1 tabular-nums ${
              lowStockItems.length > 0 ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {lowStockItems.length}
          </p>
          <p className="text-xs text-white/65 mt-0.5">
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
            className="text-xs font-bold uppercase tracking-[0.16em] text-white/75 flex items-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            Grade de Sessões &amp; Precificação Dinâmica
          </h3>
          <span className="font-mono text-xs text-white/65">
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
                <th scope="col">Inteira (R$)</th>
              </tr>
            </thead>
            <tbody>
              {sessionRows.map(({ movie, session, activeTickets, occupancyRate }) => (
                <tr key={session.id}>
                  <th scope="row">
                    <div className="text-sm font-bold text-white">{movie.title}</div>
                    <div className="font-mono text-xs text-white/70">
                      {session.dateLabel} · {session.time}
                    </div>
                  </th>
                  <td data-label="Sala &amp; Formato" className="text-xs text-white/80">
                    <div>{session.room}</div>
                    <div className="text-xs text-white/65">{session.format}</div>
                  </td>
                  <td data-label="Ativos / Total" className="font-mono text-xs text-white tabular-nums">
                    {activeTickets} / {ROOM_CAPACITY}
                  </td>
                  <td data-label="Ocupação" className="min-w-[150px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancyRate >= 85
                              ? 'bg-[#C40A14]'
                              : occupancyRate >= 55
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, occupancyRate)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-white tabular-nums">
                        {occupancyRate}%
                      </span>
                    </div>
                  </td>
                  <td data-label="Inteira (R$)">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Diminuir preço da sessão ${movie.title} ${session.time}`}
                        onClick={() =>
                          handlePriceStep(movie.id, session.id, session.basePrice, -2)
                        }
                        className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono text-sm font-bold text-white w-14 text-center tabular-nums">
                        R$ {session.basePrice}
                      </span>
                      <button
                        type="button"
                        aria-label={`Aumentar preço da sessão ${movie.title} ${session.time}`}
                        onClick={() =>
                          handlePriceStep(movie.id, session.id, session.basePrice, 2)
                        }
                        className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs cursor-pointer"
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

      {/* Create New Session + Canteen Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          key={formKey}
          onSubmit={handleCreateSession}
          className="lg:col-span-7 bg-[#15171F] border border-white/10 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white">
              Publicar Nova Sessão (RF-10)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="adm-movie" className="block text-xs text-white/60 mb-1">
                Filme
              </label>
              <select
                id="adm-movie"
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
                className="w-full rounded-lg bg-[#0D0E12] border border-white/15 px-3 py-2 text-xs text-white"
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adm-format" className="block text-xs text-white/60 mb-1">
                Formato de Projeção
              </label>
              <select
                id="adm-format"
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value as SessionSlot['format'])}
                className="w-full rounded-lg bg-[#0D0E12] border border-white/15 px-3 py-2 text-xs text-white"
              >
                <option value="IMAX 3D">IMAX 3D</option>
                <option value="Dolby Atmos">Dolby Atmos</option>
                <option value="2D Legendado">2D Legendado</option>
              </select>
            </div>

            <div>
              <label htmlFor="adm-time" className="block text-xs text-white/60 mb-1">
                Horário (14 DEZ)
              </label>
              <input
                id="adm-time"
                type="text"
                required
                pattern="\d{2}:\d{2}"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="cine-input w-full rounded-lg bg-[#0D0E12] border border-white/15 px-3 py-2 font-mono text-xs text-white"
              />
            </div>

            <div>
              <label htmlFor="adm-price" className="block text-xs text-white/60 mb-1">
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
                className="cine-input w-full rounded-lg bg-[#0D0E12] border border-white/15 px-3 py-2 font-mono text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="adm-room" className="block text-xs text-white/60 mb-1">
              Sala / Complexo
            </label>
            <input
              id="adm-room"
              type="text"
              required
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              className="cine-input w-full rounded-lg bg-[#0D0E12] border border-white/15 px-3 py-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#C40A14] hover:bg-[#a50811] text-white text-xs font-bold uppercase tracking-[0.12em] transition cursor-pointer"
          >
            Adicionar Sessão ao Cartaz
          </button>
        </form>

        <section className="lg:col-span-5 bg-[#15171F] border border-white/10 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Estoque Atual da Cantina
          </h3>
          <ul className="space-y-2">
            {canteenItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-[#0D0E12] border border-white/10 px-3 py-2.5 text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="font-mono text-xs text-white/65">R$ {item.price}</p>
                </div>
                <span
                  className={`font-mono text-xs font-bold px-2.5 py-1 rounded ${
                    item.stock === 0
                      ? 'bg-red-500/20 text-red-300'
                      : item.stock <= 2
                        ? 'bg-amber-500/20 text-amber-200'
                        : 'bg-emerald-500/20 text-emerald-200'
                  }`}
                >
                  {item.stock === 0 ? 'ESGOTADO' : `${item.stock} un`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
