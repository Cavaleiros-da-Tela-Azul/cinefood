import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  MapPin,
  MessageSquare,
  RotateCcw,
  Search,
  Star,
  Ticket,
  X,
} from 'lucide-react';
import { COMPLEX_OPTIONS, DATE_OPTIONS, MovieItem, SessionSlot } from '../data/cinemaData';

export const CATALOG_FORMATS = ['Todos', 'IMAX 3D', 'Dolby Atmos', '2D'] as const;
export type CatalogFormatFilter = (typeof CATALOG_FORMATS)[number];

export interface HeroCatalogViewProps {
  movies: MovieItem[];
  activeMovieIndex: number;
  onSelectMovieIndex: (index: number) => void;
  onOpenDetail: (movie: MovieItem, session?: SessionSlot) => void;
  onQuickSeats: (movie: MovieItem, session?: SessionSlot) => void;
  browseMode: 'filme' | 'complexo';
  onChangeBrowseMode: (mode: 'filme' | 'complexo') => void;
  selectedComplex: string;
  onSelectComplex: (complex: string) => void;
  selectedDateId: string;
  onSelectDateId: (id: string) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  formatFilter: CatalogFormatFilter;
  onChangeFormatFilter: (fmt: CatalogFormatFilter) => void;
  onClearFilters: () => void;
  catalogSource?: 'itunes-api' | 'tmdb-api' | 'fallback' | string;
  savedMovieIds?: string[];
  onToggleSaveMovie?: (id: string) => void;
  onOpenReviews?: (movieId: string) => void;
}

function getMatchingSessions(
  movie: MovieItem,
  selectedDateId: string,
  formatFilter: CatalogFormatFilter,
  browseMode: 'filme' | 'complexo',
  selectedComplex: string,
): SessionSlot[] {
  return movie.sessions.filter((session) => {
    if (selectedDateId && session.dateId !== selectedDateId) return false;
    if (formatFilter !== 'Todos' && session.format !== formatFilter) return false;
    if (
      browseMode === 'complexo' &&
      selectedComplex &&
      selectedComplex !== COMPLEX_OPTIONS[0] &&
      session.complex !== selectedComplex
    ) {
      return false;
    }
    return true;
  });
}

function pickPreferredSession(movie: MovieItem, matchingSessions: SessionSlot[]): SessionSlot | undefined {
  return (
    matchingSessions.find((s) => s.status === 'ATIVA') ??
    matchingSessions[0] ??
    movie.sessions.find((s) => s.status === 'ATIVA') ??
    movie.sessions[0]
  );
}

function getLowestPrice(movie: MovieItem, matchingSessions: SessionSlot[]): number | null {
  const pool =
    matchingSessions.filter((s) => s.status === 'ATIVA').length > 0
      ? matchingSessions.filter((s) => s.status === 'ATIVA')
      : matchingSessions.length > 0
        ? matchingSessions
        : movie.sessions;
  if (pool.length === 0) return null;
  return Math.min(...pool.map((s) => s.basePrice));
}

const FOCUS_RING_CLASS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]';

export function HeroCatalogView({
  movies,
  activeMovieIndex,
  onSelectMovieIndex,
  onOpenDetail,
  onQuickSeats,
  browseMode,
  onChangeBrowseMode,
  selectedComplex,
  onSelectComplex,
  selectedDateId,
  onSelectDateId,
  searchQuery,
  onChangeSearchQuery,
  formatFilter,
  onChangeFormatFilter,
  onClearFilters,
  savedMovieIds,
  onToggleSaveMovie,
  onOpenReviews,
}: HeroCatalogViewProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [localSavedIds, setLocalSavedIds] = useState<string[]>([]);

  const effectiveSavedIds = savedMovieIds ?? localSavedIds;
  const safeIndex = movies.length > 0 ? activeMovieIndex % movies.length : 0;
  const activeMovie = movies[safeIndex];

  const deckMovies = movies
    .map((m, idx) => ({ movie: m, idx }))
    .filter(({ idx }) => idx !== safeIndex);

  useEffect(() => {
    if (isPaused || movies.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      onSelectMovieIndex((safeIndex + 1) % movies.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [safeIndex, isPaused, movies.length, onSelectMovieIndex]);

  const handlePrev = () => {
    if (movies.length === 0) return;
    onSelectMovieIndex((safeIndex - 1 + movies.length) % movies.length);
  };

  const handleNext = () => {
    if (movies.length === 0) return;
    onSelectMovieIndex((safeIndex + 1) % movies.length);
  };

  const toggleSave = (id: string) => {
    if (onToggleSaveMovie) {
      onToggleSaveMovie(id);
      return;
    }
    setLocalSavedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const isSaved = activeMovie ? effectiveSavedIds.includes(activeMovie.id) : false;

  const activeMatchingSessions = activeMovie
    ? getMatchingSessions(activeMovie, selectedDateId, formatFilter, browseMode, selectedComplex)
    : [];
  const activePreferredSession = activeMovie
    ? pickPreferredSession(activeMovie, activeMatchingSessions)
    : undefined;
  const activeLowestPrice = activeMovie
    ? getLowestPrice(activeMovie, activeMatchingSessions)
    : null;
  const heroQuickSessions =
    activeMatchingSessions.length > 0 ? activeMatchingSessions.slice(0, 4) : activeMovie?.sessions.slice(0, 4) ?? [];

  return (
    <section
      className="relative flex min-h-[calc(100dvh-68px)] w-full min-w-0 flex-col justify-between overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Filmes em cartaz"
    >
      {/* Top thin amber progress indicator */}
      {activeMovie && (
        <div className="absolute inset-x-0 top-0 z-20 h-[3px] bg-white/10">
          <motion.div
            key={`${activeMovie.id}-${isPaused ? 'paused' : 'run'}`}
            className="h-full origin-left bg-[var(--amber-progress)]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isPaused ? 0.35 : 1 }}
            transition={{ duration: isPaused ? 0.25 : 6.5, ease: 'linear' }}
          />
        </div>
      )}

      {/* Full-bleed atmospheric backdrop */}
      <AnimatePresence mode="sync">
        {activeMovie && (
          <motion.div
            key={activeMovie.id}
            className="pointer-events-none absolute inset-0 z-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          >
            <img
              src={activeMovie.backdropSrc}
              alt=""
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D0E12]/95 via-[#0D0E12]/70 to-[#0D0E12]/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-[#0D0E12]/50" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Catalog Search & Format Filter Bar */}
      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-8">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-0 w-full sm:w-auto sm:min-w-[220px] sm:flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Buscar filme, gênero ou diretor..."
              aria-label="Buscar filme, gênero ou diretor"
              className={`min-h-[44px] w-full rounded-full border border-white/15 bg-black/55 pl-10 pr-11 text-base text-white placeholder:text-[var(--text-muted)] backdrop-blur-md focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs ${FOCUS_RING_CLASS}`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onChangeSearchQuery('')}
                aria-label="Limpar busca"
                className={`absolute right-1.5 top-1/2 inline-flex min-h-[36px] min-w-[36px] -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-white ${FOCUS_RING_CLASS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Modo de descoberta"
            className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 bg-black/45 p-1 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => onChangeBrowseMode('filme')}
              aria-pressed={browseMode === 'filme'}
              className={`min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${FOCUS_RING_CLASS} ${
                browseMode === 'filme' ? 'bg-white text-[#0D0E12]' : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Por Filme
            </button>
            <button
              type="button"
              onClick={() => onChangeBrowseMode('complexo')}
              aria-pressed={browseMode === 'complexo'}
              className={`min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${FOCUS_RING_CLASS} ${
                browseMode === 'complexo' ? 'bg-white text-[#0D0E12]' : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Por Complexo
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por formato de sala">
          {CATALOG_FORMATS.map((fmt) => {
            const active = formatFilter === fmt;
            return (
              <button
                key={fmt}
                type="button"
                onClick={() => onChangeFormatFilter(fmt)}
                aria-pressed={active}
                className={`min-h-[44px] rounded-full border px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-colors ${FOCUS_RING_CLASS} ${
                  active
                    ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                    : 'border-white/15 bg-black/45 text-[var(--text-secondary)] hover:border-white/35 hover:text-white'
                }`}
              >
                {fmt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Hero Grid OR Clean Empty State */}
      {!activeMovie ? (
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
          <div className="max-w-md rounded-2xl border border-white/15 bg-[var(--bg-elevated)]/90 p-8 shadow-2xl backdrop-blur-md">
            <Film className="mx-auto h-10 w-10 text-[var(--amber-progress)]" aria-hidden="true" />
            <h1 className="font-display mt-4 text-3xl font-extrabold uppercase text-white">
              Nenhuma sessão encontrada
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Não há sessões em cartaz combinando a data, formato ou termo pesquisado no momento.
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className={`mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95 ${FOCUS_RING_CLASS}`}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Limpar Filtros</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[1440px] flex-1 flex-col justify-end gap-8 px-4 pb-8 pt-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:pb-12">
          {/* Left Lead Copy & Controls */}
          <div className="w-full min-w-0 max-w-xl">
            {browseMode === 'complexo' && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {COMPLEX_OPTIONS.map((complex) => {
                  const isSelected = selectedComplex === complex;
                  return (
                    <button
                      key={complex}
                      type="button"
                      onClick={() => onSelectComplex(complex)}
                      aria-pressed={isSelected}
                      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${FOCUS_RING_CLASS} ${
                        isSelected
                          ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/25 text-white'
                          : 'border-white/15 bg-black/45 text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{complex}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeMovie.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
              >
                {/* Movie quick facts row: Rating, Duration, Network Avg Rating, Base Price */}
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-white">
                  <span className="rounded border border-white/25 bg-black/50 px-2.5 py-1 uppercase tracking-wider">
                    {activeMovie.rating}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-black/45 px-2.5 py-1 text-[var(--text-secondary)]">
                    <Clock className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                    {activeMovie.duration}
                  </span>
                  {typeof activeMovie.ratingAvg === 'number' && (
                    <button
                      type="button"
                      onClick={() => onOpenReviews?.(activeMovie.id)}
                      disabled={!onOpenReviews}
                      aria-label={`Nota da rede ${activeMovie.ratingAvg.toFixed(1)} de 5. Ver comentários`}
                      className={`inline-flex min-h-[32px] items-center gap-1 rounded-full border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/15 px-2.5 py-1 text-[#FCD34D] transition-colors hover:bg-[var(--amber-progress)]/25 disabled:cursor-default ${FOCUS_RING_CLASS}`}
                    >
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      <span className="font-mono-tabular font-bold">{activeMovie.ratingAvg.toFixed(1)}</span>
                      <span className="text-[11px] font-medium text-white/80">· Rede</span>
                    </button>
                  )}
                  {activeLowestPrice !== null && (
                    <span className="font-mono-tabular inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-emerald-200">
                      <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                      A partir de R$ {activeLowestPrice}
                    </span>
                  )}
                </div>

                <h1 className="font-display line-clamp-2 break-words text-4xl font-extrabold uppercase leading-[0.94] tracking-[-0.02em] text-white sm:text-6xl lg:text-[4.5rem]">
                  {activeMovie.title}
                </h1>

                <p className="mt-3 flex min-w-0 items-center gap-2.5 text-xs font-semibold tracking-[0.02em] text-[var(--amber-progress)]">
                  <span className="h-[2px] w-5 shrink-0 bg-[var(--amber-progress)]" />
                  <span className="truncate">
                    {activePreferredSession
                      ? `${activePreferredSession.complex} · ${activePreferredSession.dateLabel} · ${activePreferredSession.time} (${activePreferredSession.format})`
                      : activeMovie.kickerLocation}
                  </span>
                </p>

                <p className="mt-3 line-clamp-3 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                  {activeMovie.tagline}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Quick Session Pills for direct time selection */}
            {heroQuickSessions.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Horários rápidos {formatFilter !== 'Todos' ? `· ${formatFilter}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {heroQuickSessions.map((session) => {
                    const unavailable = session.status !== 'ATIVA';
                    return (
                      <button
                        key={session.id}
                        type="button"
                        disabled={unavailable}
                        onClick={() => onQuickSeats(activeMovie, session)}
                        title={
                          unavailable
                            ? 'Sessão indisponível para compra'
                            : `Selecionar assentos para ${session.time} (${session.format})`
                        }
                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-md transition-colors active:scale-95 ${FOCUS_RING_CLASS} ${
                          unavailable
                            ? 'cursor-not-allowed border-white/10 bg-black/40 text-[var(--text-muted)] opacity-60'
                            : 'border-white/20 bg-black/55 text-white hover:border-[var(--brand-red)] hover:bg-[var(--brand-red)]/25'
                        }`}
                      >
                        <span className="font-mono-tabular font-bold">{session.time}</span>
                        <span className="text-[11px] text-[var(--text-secondary)]">{session.format}</span>
                        <span className="font-mono-tabular rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-emerald-200">
                          {unavailable ? (session.status === 'ENCERRADA' ? 'Encerrada' : 'Indisp.') : `R$ ${session.basePrice}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => toggleSave(activeMovie.id)}
                aria-pressed={isSaved}
                aria-label={isSaved ? 'Remover filme da minha lista' : 'Salvar filme na minha lista'}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors active:scale-95 ${FOCUS_RING_CLASS} ${
                  isSaved
                    ? 'border-[var(--amber-progress)] bg-[var(--amber-progress)] text-[#0D0E12]'
                    : 'border-white/25 bg-black/45 text-white hover:border-white/50'
                }`}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onOpenDetail(activeMovie, activePreferredSession)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/30 bg-black/45 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-[border-color,background-color] hover:border-white hover:bg-white/10 active:scale-95 ${FOCUS_RING_CLASS}`}
              >
                <span>Ver Detalhes &amp; Horários</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onQuickSeats(activeMovie, activePreferredSession)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.5)] transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95 ${FOCUS_RING_CLASS}`}
              >
                <span>Escolher Assentos</span>
              </button>

              {onOpenReviews && (
                <button
                  type="button"
                  onClick={() => onOpenReviews(activeMovie.id)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-black/45 px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white active:scale-95 ${FOCUS_RING_CLASS}`}
                >
                  <MessageSquare className="h-4 w-4 text-[var(--amber-progress)]" aria-hidden="true" />
                  <span>Comentários</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Poster Deck with comparative metadata */}
          <div className="flex w-full min-w-0 max-w-full flex-col gap-4 lg:w-auto lg:max-w-[680px]">
            {deckMovies.length > 0 && (
              <div className="flex min-w-0 max-w-full items-stretch gap-3 overflow-x-auto pb-2 pt-2 sm:gap-4 lg:overflow-visible lg:pb-0">
                {deckMovies.map(({ movie, idx }) => {
                  const cardMatching = getMatchingSessions(
                    movie,
                    selectedDateId,
                    formatFilter,
                    browseMode,
                    selectedComplex,
                  );
                  const cardSession = pickPreferredSession(movie, cardMatching);
                  const cardPrice = getLowestPrice(movie, cardMatching);
                  return (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => onSelectMovieIndex(idx)}
                      className={`cine-card-hover relative h-[236px] w-[156px] shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-[var(--bg-elevated)] text-left shadow-[0_18px_38px_rgba(0,0,0,0.55)] hover:border-white/40 sm:h-[268px] sm:w-[184px] ${FOCUS_RING_CLASS}`}
                      aria-label={`Selecionar ${movie.title}`}
                    >
                      <img
                        src={movie.posterSrc}
                        alt={movie.title}
                        className="cine-card-media h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25" />

                      {/* Top comparative pills: Classificação & Nota */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-1.5 p-2.5">
                        <span className="rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
                          {movie.rating}
                        </span>
                        {typeof movie.ratingAvg === 'number' && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-[#FCD34D] backdrop-blur-sm">
                            <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                            <span className="font-mono-tabular">{movie.ratingAvg.toFixed(1)}</span>
                          </span>
                        )}
                      </div>

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
                        <span className="block truncate text-[10px] font-medium uppercase tracking-wider text-white/75">
                          {movie.genre.split(',')[0]} · {movie.duration}
                        </span>
                        <span className="font-display mt-0.5 line-clamp-2 block text-lg font-bold uppercase leading-[1.02] text-white sm:text-xl">
                          {movie.title}
                        </span>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-white/15 pt-1.5 text-[10px]">
                          {cardPrice !== null && (
                            <span className="font-mono-tabular font-bold text-emerald-300">
                              A partir R$ {cardPrice}
                            </span>
                          )}
                          {cardSession && (
                            <span className="font-mono-tabular rounded bg-white/15 px-1.5 py-0.5 font-semibold text-white">
                              {cardSession.time}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Deck Controls + Numerical Indicator */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={movies.length <= 1}
                  aria-label="Filme anterior"
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition-colors hover:border-white hover:bg-white/10 active:scale-95 disabled:opacity-35 ${FOCUS_RING_CLASS}`}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={movies.length <= 1}
                  aria-label="Próximo filme"
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition-colors hover:border-white hover:bg-white/10 active:scale-95 disabled:opacity-35 ${FOCUS_RING_CLASS}`}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="ml-2 hidden h-[1px] w-36 bg-white/20 sm:block">
                  <div
                    className="h-full bg-[var(--amber-progress)] transition-[width] duration-300"
                    style={{ width: `${((safeIndex + 1) / movies.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="font-display text-4xl font-extrabold leading-none tracking-tight text-white">
                {String(safeIndex + 1).padStart(2, '0')}
                <span className="ml-1 text-base font-semibold text-white/45">
                  / {String(movies.length).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky-feel Date Strip */}
      <div className="relative z-10 w-full min-w-0 border-t border-white/10 bg-[var(--bg-glass)] backdrop-blur-md">
        <div className="mx-auto flex w-full min-w-0 max-w-[1440px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-8">
          <span className="mr-2 shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Programação:
          </span>
          {DATE_OPTIONS.map((d) => {
            const active = selectedDateId === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectDateId(d.id)}
                aria-pressed={active}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors active:scale-95 ${FOCUS_RING_CLASS} ${
                  active
                    ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                    : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/25 hover:text-white'
                }`}
              >
                <span className="font-mono-tabular font-bold">{d.day}</span>
                <span>{d.month}</span>
                <span className={active ? 'text-white/90' : 'text-[var(--text-muted)]'}>· {d.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
