import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Clock, Play, ShieldAlert, Users, X } from 'lucide-react';
import { MovieItem, SessionSlot } from '../data/cinemaData';

interface MovieDetailViewProps {
  movie: MovieItem;
  onBack: () => void;
  onSelectSession: (session: SessionSlot) => void;
}

const FORMAT_FILTERS = ['Todos', 'IMAX 3D', 'Dolby Atmos', '2D Legendado'] as const;

export function MovieDetailView({ movie, onBack, onSelectSession }: MovieDetailViewProps) {
  const [formatFilter, setFormatFilter] = useState<(typeof FORMAT_FILTERS)[number]>('Todos');
  const [trailerOpen, setTrailerOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (trailerOpen && !dialog.open) {
      dialog.showModal();
    } else if (!trailerOpen && dialog.open) {
      dialog.close();
    }
  }, [trailerOpen]);

  const filteredSessions =
    formatFilter === 'Todos'
      ? movie.sessions
      : movie.sessions.filter((session) => session.format === formatFilter);

  return (
    <section className="relative min-h-[calc(100dvh-68px)] overflow-hidden" aria-label={`Detalhes de ${movie.title}`}>
      {/* Full-bleed moody cinema backdrop matching Ref 2 (Joker layout) */}
      <div className="absolute inset-0 z-0">
        <img src={movie.backdropSrc} alt="" className="h-full w-full object-cover object-center" />
        <div
          className="absolute inset-0"
          style={{
            background:
              movie.tone === 'emerald'
                ? 'linear-gradient(105deg, rgba(11, 24, 22, 0.94) 10%, rgba(16, 38, 34, 0.72) 55%, rgba(13, 14, 18, 0.94) 100%)'
                : 'linear-gradient(105deg, rgba(13, 14, 18, 0.95) 12%, rgba(13, 14, 18, 0.7) 58%, rgba(13, 14, 18, 0.95) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-black/35" />
      </div>

      {/* Editorial 2-column grid */}
      <div className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[1fr_340px]">
        {/* Left Main Editorial Content */}
        <div className="flex flex-col justify-between px-4 py-8 sm:px-8 lg:min-h-[calc(100dvh-68px)] lg:border-r lg:border-white/10 lg:py-12">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[40px] items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Voltar ao Cartaz</span>
            </button>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 max-w-2xl"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                <span className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-white">
                  {movie.rating}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {movie.duration}
                </span>
                <span>·</span>
                <span>{movie.genre}</span>
              </div>

              <h1 className="font-display line-clamp-2 break-words text-5xl font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-white sm:text-7xl lg:text-8xl">
                {movie.title}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                {movie.synopsis}
              </p>

              {/* Format filter pills */}
              <div className="mt-8">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Filtrar por formato
                </span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {FORMAT_FILTERS.map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormatFilter(fmt)}
                      className={`min-h-[38px] rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors active:scale-95 ${
                        formatFilter === fmt
                          ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                          : 'border-white/15 bg-black/40 text-[var(--text-secondary)] hover:border-white/35 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sessions with live occupancy bar */}
              <div className="mt-6">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Escolha uma sessão para selecionar assentos
                </span>

                {filteredSessions.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-[var(--text-secondary)]">
                    Nenhuma sessão encontrada neste formato para hoje. Experimente selecionar outro filtro acima.
                  </div>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
                    {filteredSessions.map((session) => {
                      const highOccupancy = session.occupancyPct >= 75;
                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => onSelectSession(session)}
                          className="group flex flex-col justify-between rounded-xl border border-white/15 bg-[var(--bg-elevated)]/90 p-4 text-left backdrop-blur-sm transition-colors hover:border-[var(--brand-red)] hover:bg-[var(--bg-surface)] active:scale-[0.98]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="font-mono-tabular text-2xl font-bold text-white">
                                {session.time}
                              </span>
                              <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                                {session.format}
                              </span>
                              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                {session.complex} · {session.room}
                              </p>
                            </div>
                            <ArrowRight
                              className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-white"
                              aria-hidden="true"
                            />
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                                <Users className="h-3 w-3" aria-hidden="true" />
                                Ocupação em tempo real
                              </span>
                              <span
                                className={`font-mono-tabular font-semibold ${
                                  highOccupancy ? 'text-[var(--amber-progress)]' : 'text-white'
                                }`}
                              >
                                {session.occupancyPct}%
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full transition-[width] ${
                                  highOccupancy ? 'bg-[var(--amber-progress)]' : 'bg-[var(--brand-red)]'
                                }`}
                                style={{ width: `${session.occupancyPct}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-5 text-xs text-[var(--text-secondary)]">
            <span className="font-mono-tabular font-bold text-white">{movie.indexLabel}</span>
            <span>·</span>
            <span>Direção de {movie.director}</span>
            <span>·</span>
            <span>Disponível com entrega da cantina na poltrona</span>
          </div>
        </div>

        {/* Right Metadata Rail + Watch Trailer Card (matching Ref 2) */}
        <aside className="flex flex-col justify-between bg-black/35 px-6 py-8 backdrop-blur-sm lg:py-12">
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Estreia
              </p>
              <p className="mt-1 text-sm font-medium text-white">{movie.premiere}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Direção
              </p>
              <p className="mt-1 text-sm font-medium text-white">{movie.director}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Trilha Sonora
              </p>
              <p className="mt-1 text-sm font-medium text-white">{movie.musicBy}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Gênero
              </p>
              <p className="mt-1 text-sm font-medium text-white">{movie.genre}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                <ShieldAlert className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                Regra de entrega no assento
              </span>
              <p className="mt-1">
                Pedidos da cantina destinados à sala iniciam preparo automaticamente após a validação do QR Code na portaria.
              </p>
            </div>
          </div>

          {/* Watch Trailer Thumbnail Card */}
          <button
            type="button"
            onClick={() => setTrailerOpen(true)}
            className="group relative mt-8 overflow-hidden rounded-xl border border-white/15 bg-black text-left shadow-xl transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <img
              src={movie.backdropSrc}
              alt={`Prévia do trailer de ${movie.title}`}
              className="h-36 w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition-colors group-hover:bg-black/20">
              <span className="inline-flex items-center gap-2.5 rounded-full bg-black/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                </span>
                Assistir Trailer ({movie.trailerDuration})
              </span>
            </div>
          </button>
        </aside>
      </div>

      {/* Native Accessible Dialog for Trailer Preview (modern-web-guidance) */}
      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          setTrailerOpen(false);
        }}
        className="m-auto w-[min(92vw,760px)] rounded-2xl border border-white/15 bg-[var(--bg-elevated)] p-0 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--amber-progress)]">
              Prévia Oficial · {movie.trailerDuration}
            </p>
            <h2 className="font-display text-2xl font-bold uppercase">{movie.title}</h2>
          </div>
          <button
            type="button"
            onClick={() => setTrailerOpen(false)}
            aria-label="Fechar prévia do trailer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[var(--text-secondary)] hover:border-white/40 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <img src={movie.backdropSrc} alt={movie.title} className="h-full w-full object-cover opacity-85" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 p-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-red)] text-white shadow-lg">
              <Play className="h-6 w-6 fill-current" aria-hidden="true" />
            </span>
            <p className="mt-4 max-w-md text-sm font-medium text-white">{movie.trailerHighlight}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Player demonstrativo offline do protótipo CineFood
            </p>
          </div>
        </div>
      </dialog>
    </section>
  );
}
