import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Film,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { COMPLEX_OPTIONS, DATE_OPTIONS, MovieItem } from '../data/cinemaData';

export const CATALOG_FORMATS = ['Todos', 'IMAX 3D', 'Dolby Atmos', '2D Legendado'] as const;
export type CatalogFormatFilter = (typeof CATALOG_FORMATS)[number];

interface HeroCatalogViewProps {
  movies: MovieItem[];
  activeMovieIndex: number;
  onSelectMovieIndex: (index: number) => void;
  onOpenDetail: (movie: MovieItem) => void;
  onQuickSeats: (movie: MovieItem) => void;
  browseMode: 'filme' | 'complexo';
  selectedComplex: string;
  onSelectComplex: (complex: string) => void;
  selectedDateId: string;
  onSelectDateId: (id: string) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  formatFilter: CatalogFormatFilter;
  onChangeFormatFilter: (fmt: CatalogFormatFilter) => void;
  onClearFilters: () => void;
}

export function HeroCatalogView({
  movies,
  activeMovieIndex,
  onSelectMovieIndex,
  onOpenDetail,
  onQuickSeats,
  browseMode,
  selectedComplex,
  onSelectComplex,
  selectedDateId,
  onSelectDateId,
  searchQuery,
  onChangeSearchQuery,
  formatFilter,
  onChangeFormatFilter,
  onClearFilters,
}: HeroCatalogViewProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

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
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const isSaved = activeMovie ? savedIds.includes(activeMovie.id) : false;

  return (
    <section
      className="relative flex min-h-[calc(100dvh-68px)] flex-col justify-between overflow-hidden"
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

      {/* Full-bleed atmospheric backdrop (clean GPU crossfade without incompatible layoutId) */}
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D0E12]/95 via-[#0D0E12]/65 to-[#0D0E12]/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-[#0D0E12]/45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Catalog Search & Format Filter Bar */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-8">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
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
            className="h-10 w-full rounded-full border border-white/15 bg-black/55 pl-10 pr-9 text-xs text-white placeholder:text-[var(--text-muted)] backdrop-blur-md focus:border-[var(--focus-ring)] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onChangeSearchQuery('')}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-muted)] hover:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
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
                className={`min-h-[36px] rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md transition-colors ${
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
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Limpar Filtros</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end gap-10 px-4 pb-8 pt-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:pb-12">
          {/* Left Lead Copy & Controls */}
          <div className="min-w-0 max-w-xl">
            {browseMode === 'complexo' && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {COMPLEX_OPTIONS.map((complex) => (
                  <button
                    key={complex}
                    type="button"
                    onClick={() => onSelectComplex(complex)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedComplex === complex
                        ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/20 text-white'
                        : 'border-white/15 bg-black/45 text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {complex}
                  </button>
                ))}
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
                <h1 className="font-display line-clamp-2 break-words text-4xl font-extrabold uppercase leading-[0.94] tracking-[-0.02em] text-white sm:text-6xl lg:text-[4.5rem]">
                  {activeMovie.title}
                </h1>

                <p className="mt-3 flex items-center gap-2.5 text-xs font-semibold tracking-[0.02em] text-[var(--amber-progress)]">
                  <span className="h-[2px] w-5 shrink-0 bg-[var(--amber-progress)]" />
                  <span className="truncate">{activeMovie.kickerLocation}</span>
                </p>

                <p className="mt-3 line-clamp-3 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                  {activeMovie.tagline}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => toggleSave(activeMovie.id)}
                aria-pressed={isSaved}
                aria-label="Salvar filme na minha lista"
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors active:scale-95 ${
                  isSaved
                    ? 'border-[var(--amber-progress)] bg-[var(--amber-progress)] text-[#0D0E12]'
                    : 'border-white/25 bg-black/45 text-white hover:border-white/50'
                }`}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onOpenDetail(activeMovie)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/30 bg-black/45 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-[border-color,background-color] hover:border-white hover:bg-white/10 active:scale-95"
              >
                <span>Ver Detalhes &amp; Horários</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onQuickSeats(activeMovie)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.5)] transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Escolher Assentos</span>
              </button>
            </div>
          </div>

          {/* Right Poster Deck (GPU hover-gated lift without Motion layoutId distortion) */}
          <div className="flex w-full flex-col gap-4 lg:w-auto lg:max-w-[660px]">
            {deckMovies.length > 0 && (
              <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-2 sm:gap-4 lg:overflow-visible lg:pb-0">
                {deckMovies.map(({ movie, idx }) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => onSelectMovieIndex(idx)}
                    className="cine-card-hover relative h-[210px] w-[142px] shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-[var(--bg-elevated)] text-left shadow-[0_18px_38px_rgba(0,0,0,0.55)] hover:border-white/40 focus-visible:outline-none sm:h-[250px] sm:w-[172px]"
                    aria-label={`Selecionar ${movie.title}`}
                  >
                    <img
                      src={movie.posterSrc}
                      alt={movie.title}
                      className="cine-card-media h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3.5">
                      <span className="block h-[2px] w-4 bg-white/75" />
                      <span className="mt-1.5 block truncate text-[11px] font-medium uppercase tracking-wider text-white/80">
                        {movie.genre.split(',')[0]}
                      </span>
                      <span className="font-display mt-0.5 line-clamp-2 block text-lg font-bold uppercase leading-[1.02] text-white sm:text-xl">
                        {movie.title}
                      </span>
                    </div>
                  </button>
                ))}
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition-colors hover:border-white hover:bg-white/10 active:scale-95 disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={movies.length <= 1}
                  aria-label="Próximo filme"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition-colors hover:border-white hover:bg-white/10 active:scale-95 disabled:opacity-35"
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
      <div className="relative z-10 border-t border-white/10 bg-[var(--bg-glass)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-8">
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
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors active:scale-95 ${
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
