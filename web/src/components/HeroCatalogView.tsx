import { type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
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
  SlidersHorizontal,
  Star,
  Ticket,
  X,
} from 'lucide-react';
import { COMPLEX_OPTIONS, DATE_OPTIONS, MovieItem, SessionSlot } from '../data/cinemaData';
import { resolveClassificationSymbol } from '../services/movieCatalogApi';

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

const AUTO_ADVANCE_MS = 6500;

function useHorizontalDragScroll<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const state = dragRef.current;
      const el = containerRef.current;
      if (!state.active || !el) return;
      const dx = e.clientX - state.startX;
      if (!state.moved && Math.abs(dx) > 5) {
        state.moved = true;
        setIsDragging(true);
      }
      if (state.moved) {
        el.scrollLeft = state.scrollLeft - dx;
      }
    };

    const handlePointerUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      setIsDragging(false);
      if (dragRef.current.moved) {
        window.requestAnimationFrame(() => {
          dragRef.current.moved = false;
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<T>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !containerRef.current) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: containerRef.current.scrollLeft,
      moved: false,
    };
  };

  const onClickCapture = (e: ReactMouseEvent<T>) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  return { containerRef, isDragging, onPointerDown, onClickCapture };
}

export function HeroCatalogView({
  movies,
  activeMovieIndex,
  onSelectMovieIndex,
  onOpenDetail,
  onQuickSeats,
  browseMode,
  selectedComplex,
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [localSavedIds, setLocalSavedIds] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const deckDrag = useHorizontalDragScroll<HTMLDivElement>();
  const dateStripDrag = useHorizontalDragScroll<HTMLDivElement>();
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const elapsedRef = useRef(0);
  const activeMobileFilterCount = formatFilter !== 'Todos' ? 1 : 0;

  const effectiveSavedIds = savedMovieIds ?? localSavedIds;
  const safeIndex = movies.length > 0 ? activeMovieIndex % movies.length : 0;
  const activeMovie = movies[safeIndex];

  const isPaused =
    isSearchFocused ||
    searchQuery.trim().length > 0 ||
    deckDrag.isDragging ||
    dateStripDrag.isDragging;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const safeIndexRef = useRef(safeIndex);
  safeIndexRef.current = safeIndex;
  const onSelectMovieIndexRef = useRef(onSelectMovieIndex);
  onSelectMovieIndexRef.current = onSelectMovieIndex;

  const deckMovies = Array.from({ length: Math.max(0, movies.length - 1) }, (_, offset) => {
    const idx = (safeIndex + 1 + offset) % movies.length;
    return { movie: movies[idx], idx };
  });

  useEffect(() => {
    elapsedRef.current = 0;
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = 'scaleX(0)';
    }
    if (movies.length <= 1) return undefined;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(Math.max(now - lastTime, 0), 100);
      lastTime = now;
      if (!isPausedRef.current) {
        elapsedRef.current += dt;
        const ratio = Math.min(1, elapsedRef.current / AUTO_ADVANCE_MS);
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${ratio})`;
        }
        if (elapsedRef.current >= AUTO_ADVANCE_MS) {
          elapsedRef.current = 0;
          onSelectMovieIndexRef.current((safeIndexRef.current + 1) % movies.length);
          return;
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [activeMovie?.id, movies.length]);

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
      aria-label="Filmes em cartaz"
    >
      {/* Top thin amber progress indicator */}
      {activeMovie && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] bg-white/10">
          <div
            ref={progressBarRef}
            data-testid="hero-autoplay-bar"
            className="h-full origin-left bg-[var(--amber-progress)] will-change-transform"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      )}

      {/* Full-bleed atmospheric backdrop */}
      <AnimatePresence mode="sync">
        {activeMovie && (
          <motion.div
            key={activeMovie.id}
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <img
              src={activeMovie.backdropSrc}
              alt=""
              decoding="async"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D0E12]/95 via-[#0D0E12]/70 to-[#0D0E12]/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-[#0D0E12]/50" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Catalog Search & Format Filter Bar (collapsed filter drawer on mobile, full inline on lg+) */}
      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-2 px-3 pt-3 sm:px-8 sm:pt-5 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-1 lg:flex-nowrap lg:gap-2.5">
          <div className="flex w-full min-w-0 items-center gap-2 lg:w-auto lg:min-w-[220px] lg:flex-1 lg:max-w-xs">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onChangeSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Buscar filme..."
                aria-label="Buscar filme, gênero ou diretor"
                className={`min-h-[44px] w-full rounded-full border border-white/15 bg-black/55 pl-10 pr-10 text-base text-white placeholder:text-[var(--text-muted)] backdrop-blur-md focus:border-[var(--focus-ring)] focus:outline-none sm:text-xs ${FOCUS_RING_CLASS}`}
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

            <button
              type="button"
              aria-expanded={mobileFiltersOpen}
              aria-label="Filtros de cinema e formato"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className={`cine-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-colors lg:hidden ${FOCUS_RING_CLASS} ${
                mobileFiltersOpen || activeMobileFilterCount > 0
                  ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/20 text-white'
                  : 'border-white/15 bg-black/55 text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span>Filtros</span>
              {activeMobileFilterCount > 0 && (
                <span className="font-mono-tabular flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--brand-red)] px-1 text-[10px] font-bold text-white">
                  {activeMobileFilterCount}
                </span>
              )}
            </button>
          </div>

          <div
            role="status"
            className="hidden min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-md lg:inline-flex"
          >
            <MapPin className="h-3.5 w-3.5 text-[var(--brand-red)]" aria-hidden="true" />
            <span>CineFood Operações Piloto · 4 Salas</span>
          </div>
        </div>

        <div
          className={`${mobileFiltersOpen ? 'flex' : 'hidden'} flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
          role="group"
          aria-label="Filtrar por formato de sala"
        >
          {CATALOG_FORMATS.map((fmt) => {
            const active = formatFilter === fmt;
            return (
              <button
                key={fmt}
                type="button"
                onClick={() => onChangeFormatFilter(fmt)}
                aria-pressed={active}
                className={`min-h-[44px] shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-colors ${FOCUS_RING_CLASS} ${
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
        <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[1440px] flex-1 flex-col justify-start gap-4 px-3 pb-4 pt-3 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:pb-12 lg:pt-6">
          {/* Featured Movie Spotlight (clean editorial cinema banner on mobile, left copy column on lg+) */}
          <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-[var(--bg-elevated)]/80 p-4 pt-20 shadow-2xl lg:max-w-xl lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            {/* Crisp focal artwork banner strictly on < lg so backdrop doesn't turn to dark mud */}
            <div className="pointer-events-none absolute inset-0 lg:hidden">
              <img
                src={activeMovie.backdropSrc}
                alt=""
                className="h-full w-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E12] via-[#0D0E12]/78 to-black/25" />
            </div>

            <div className="relative z-10">

            <AnimatePresence mode="wait">
              <motion.div
                key={activeMovie.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
              >
                {/* Movie quick facts row: single clean inline line on mobile, badge chips on lg+ */}
                {(() => {
                  const activeClassInfo = resolveClassificationSymbol(
                    activeMovie.rating,
                    activeMovie.genre.split(','),
                  );
                  return (
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-white lg:mb-3">
                      <span
                        title={activeClassInfo.fullDescription}
                        className="inline-flex items-center gap-1.5 rounded border border-white/25 bg-black/55 px-1.5 py-0.5 text-[11px] uppercase tracking-wider lg:px-2 lg:text-xs"
                      >
                        <img
                          src={activeClassInfo.iconSrc}
                          alt={activeClassInfo.fullDescription}
                          className="h-4 w-4 shrink-0 rounded-sm object-contain lg:h-5 lg:w-5"
                        />
                        <span>{activeMovie.rating}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[var(--text-secondary)] lg:rounded lg:bg-black/45 lg:px-2.5 lg:py-1">
                        <Clock className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                        {activeMovie.duration}
                      </span>
                      {typeof activeMovie.ratingAvg === 'number' && (
                        <button
                          type="button"
                          onClick={() => onOpenReviews?.(activeMovie.id)}
                          disabled={!onOpenReviews}
                          aria-label={`Nota da rede ${activeMovie.ratingAvg.toFixed(1)} de 5. Ver comentários`}
                          className={`inline-flex min-h-[28px] items-center gap-1 text-[#FCD34D] transition-colors disabled:cursor-default lg:min-h-[32px] lg:rounded-full lg:border lg:border-[var(--amber-progress)]/40 lg:bg-[var(--amber-progress)]/15 lg:px-2.5 lg:py-1 lg:hover:bg-[var(--amber-progress)]/25 ${FOCUS_RING_CLASS}`}
                        >
                          <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                          <span className="font-mono-tabular font-bold">{activeMovie.ratingAvg.toFixed(1)}</span>
                          <span className="hidden text-[11px] font-medium text-white/80 lg:inline">· Rede</span>
                        </button>
                      )}
                      {activeLowestPrice !== null && (
                        <span className="font-mono-tabular inline-flex items-center gap-1 text-emerald-300 lg:rounded-full lg:border lg:border-emerald-400/35 lg:bg-emerald-500/15 lg:px-3 lg:py-1 lg:text-emerald-200">
                          <Ticket className="hidden h-3.5 w-3.5 lg:inline" aria-hidden="true" />
                          <span className="lg:hidden">· R$ {activeLowestPrice}+</span>
                          <span className="hidden lg:inline">A partir de R$ {activeLowestPrice}</span>
                        </span>
                      )}
                    </div>
                  );
                })()}

                <h1 className="font-display line-clamp-2 break-words text-3xl font-extrabold uppercase leading-[0.94] tracking-[-0.02em] text-white sm:text-5xl lg:text-[4.5rem]">
                  {activeMovie.title}
                </h1>

                <p className="mt-1.5 flex min-w-0 items-center gap-2 text-xs font-semibold tracking-[0.02em] text-[var(--amber-progress)] lg:mt-3 lg:gap-2.5">
                  <span className="hidden h-[2px] w-5 shrink-0 bg-[var(--amber-progress)] lg:inline-block" />
                  <span className="truncate">
                    {activePreferredSession
                      ? `${activePreferredSession.complex} · ${activePreferredSession.time} (${activePreferredSession.format})`
                      : activeMovie.kickerLocation}
                  </span>
                </p>

                <p className="mt-3 hidden line-clamp-3 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)] lg:block lg:text-base">
                  {activeMovie.tagline}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Quick Session Pills for direct time selection (desktop spotlight; mobile goes straight via CTAs) */}
            {heroQuickSessions.length > 0 && (
              <div className="mt-4 hidden lg:block">
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
                        className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-md transition-colors active:scale-95 ${FOCUS_RING_CLASS} ${
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

            <div className="mt-3.5 flex flex-nowrap items-center gap-2 lg:mt-5 lg:flex-wrap lg:gap-3">
              <button
                type="button"
                aria-label="Escolher Assentos"
                onClick={() => onQuickSeats(activeMovie, activePreferredSession)}
                className={`inline-flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[var(--brand-red)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.5)] transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95 lg:order-3 lg:flex-none lg:gap-2 lg:rounded-full lg:px-5 lg:py-2.5 lg:text-xs lg:tracking-[0.14em] ${FOCUS_RING_CLASS}`}
              >
                <span className="lg:hidden">Comprar</span>
                <span className="hidden lg:inline">Escolher Assentos</span>
              </button>

              <button
                type="button"
                aria-label="Ver Detalhes & Horários"
                onClick={() => onOpenDetail(activeMovie, activePreferredSession)}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/30 bg-black/45 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition-[border-color,background-color] hover:border-white hover:bg-white/10 active:scale-95 lg:order-2 lg:gap-2 lg:rounded-full lg:px-5 lg:py-2.5 lg:text-xs lg:tracking-[0.14em] ${FOCUS_RING_CLASS}`}
              >
                <span className="lg:hidden">Sessões</span>
                <span className="hidden lg:inline">Ver Detalhes &amp; Horários</span>
                <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => toggleSave(activeMovie.id)}
                aria-pressed={isSaved}
                aria-label={isSaved ? 'Remover filme da minha lista' : 'Salvar filme na minha lista'}
                className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border transition-colors active:scale-95 lg:order-1 lg:rounded-full ${FOCUS_RING_CLASS} ${
                  isSaved
                    ? 'border-[var(--amber-progress)] bg-[var(--amber-progress)] text-[#0D0E12]'
                    : 'border-white/25 bg-black/45 text-white hover:border-white/50'
                }`}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
              </button>

              {onOpenReviews && (
                <button
                  type="button"
                  onClick={() => onOpenReviews(activeMovie.id)}
                  className={`hidden min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-black/45 px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white active:scale-95 lg:order-4 lg:inline-flex ${FOCUS_RING_CLASS}`}
                >
                  <MessageSquare className="h-4 w-4 text-[var(--amber-progress)]" aria-hidden="true" />
                  <span>Comentários</span>
                </button>
              )}
            </div>
            </div>
          </div>

          {/* Right / Bottom "Em Cartaz" Poster Rail (clean above-the-fold cinema strip on mobile) */}
          <div className="flex w-full min-w-0 max-w-full flex-col gap-2.5 lg:w-auto lg:max-w-[760px] lg:gap-4">
            <div className="flex items-center justify-between px-0.5 lg:hidden">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Em Cartaz ({movies.length})
              </h2>
              <span className="font-mono-tabular text-[11px] font-semibold text-[var(--text-muted)]">
                {String(safeIndex + 1).padStart(2, '0')} / {String(movies.length).padStart(2, '0')}
              </span>
            </div>

            {deckMovies.length > 0 && (
              <div
                ref={deckDrag.containerRef}
                onPointerDown={deckDrag.onPointerDown}
                onClickCapture={deckDrag.onClickCapture}
                className={`flex min-w-0 max-w-full snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-1 pt-0.5 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 lg:snap-none lg:pb-2 lg:pt-2 ${
                  deckDrag.isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              >
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
                  const cardClassInfo = resolveClassificationSymbol(
                    movie.rating,
                    movie.genre.split(','),
                  );
                  return (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => onSelectMovieIndex(idx)}
                      className={`cine-card-hover group flex w-[124px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-white/15 bg-[var(--bg-elevated)]/90 text-left shadow-lg hover:border-white/40 lg:relative lg:h-[268px] lg:w-[184px] lg:rounded-2xl lg:shadow-[0_18px_38px_rgba(0,0,0,0.55)] ${FOCUS_RING_CLASS}`}
                      aria-label={`Selecionar ${movie.title}`}
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black lg:h-full lg:aspect-auto">
                        <img
                          src={movie.posterSrc}
                          alt={movie.title}
                          draggable={false}
                          className="cine-card-media h-full w-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-black/95 via-black/45 to-black/25 lg:block" />

                        {/* Clean corner rating badge on mobile; full pill strip on lg+ */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-1.5 p-1.5 lg:p-2.5">
                          <span className="inline-flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
                            <img
                              src={cardClassInfo.iconSrc}
                              alt=""
                              draggable={false}
                              className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain lg:h-4 lg:w-4"
                            />
                            <span className="hidden lg:inline">{movie.rating}</span>
                          </span>
                          {typeof movie.ratingAvg === 'number' && (
                            <span className="hidden items-center gap-0.5 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-[#FCD34D] backdrop-blur-sm lg:inline-flex">
                              <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                              <span className="font-mono-tabular">{movie.ratingAvg.toFixed(1)}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mobile clean caption BELOW poster + Desktop overlay caption */}
                      <div className="p-2 lg:pointer-events-none lg:absolute lg:inset-x-0 lg:bottom-0 lg:p-3">
                        <span className="hidden truncate text-[10px] font-medium uppercase tracking-wider text-white/75 lg:block">
                          {movie.genre.split(',')[0]} · {movie.duration}
                        </span>
                        <span className="font-display line-clamp-1 block text-sm font-bold uppercase leading-tight text-white lg:mt-0.5 lg:line-clamp-2 lg:text-xl lg:leading-[1.02]">
                          {movie.title}
                        </span>
                        <div className="mt-1 flex items-center justify-between gap-1 text-[10px] lg:mt-2 lg:border-t lg:border-white/15 lg:pt-1.5">
                          {cardPrice !== null && (
                            <span className="font-mono-tabular font-bold text-emerald-300">
                              <span className="lg:hidden">R$ {cardPrice}+</span>
                              <span className="hidden lg:inline">A partir R$ {cardPrice}</span>
                            </span>
                          )}
                          {cardSession && (
                            <span className="font-mono-tabular hidden rounded bg-white/15 px-1.5 py-0.5 font-semibold text-white lg:inline">
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

            {/* Deck Controls + Numerical Indicator (desktop deck controls; mobile swipes poster strip) */}
            <div className="hidden items-center justify-between gap-4 lg:flex">
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
        <div
          ref={dateStripDrag.containerRef}
          onPointerDown={dateStripDrag.onPointerDown}
          onClickCapture={dateStripDrag.onClickCapture}
          className={`mx-auto flex w-full min-w-0 max-w-[1440px] items-center gap-2 overflow-x-auto px-4 py-3 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8 ${
            dateStripDrag.isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
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
