import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  Play,
  RotateCcw,
  ShieldAlert,
  Star,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import { COMPLEX_OPTIONS, DATE_OPTIONS, MovieItem, SessionSlot } from '../data/cinemaData';

export const DETAIL_FORMAT_FILTERS = ['Todos', 'IMAX 3D', 'Dolby Atmos', '2D'] as const;
export type DetailFormatFilter = (typeof DETAIL_FORMAT_FILTERS)[number];

export interface MovieDetailViewProps {
  movie: MovieItem;
  movies?: MovieItem[];
  onSelectMovie?: (movieId: string) => void;
  onBack: () => void;
  onSelectSession: (session: SessionSlot) => void;
  selectedDateId?: string;
  selectedComplex?: string;
  formatFilter?: string;
  onOpenReviews?: (movieId: string) => void;
  communityReviewCount?: number;
}

interface DateSessionGroup {
  dateId: string;
  dateHeading: string;
  sessions: SessionSlot[];
}

interface ComplexSessionGroup {
  complex: string;
  totalSessions: number;
  dates: DateSessionGroup[];
}

const FOCUS_RING_CLASS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]';

const FULL_WEEKDAY_MAP: Record<string, string> = {
  Dom: 'Domingo',
  Seg: 'Segunda',
  Ter: 'Terça',
  Qua: 'Quarta',
  Qui: 'Quinta',
  Sex: 'Sexta',
  Sáb: 'Sábado',
};

function formatGroupDateHeading(dateId: string, fallbackLabel: string): string {
  const meta = DATE_OPTIONS.find((d) => d.id === dateId);
  if (!meta) return fallbackLabel;
  const weekday = FULL_WEEKDAY_MAP[meta.weekday] ?? meta.weekday;
  const datePart = `${meta.day} ${meta.month}`;
  const relativeTag = meta.label === 'Hoje' || meta.label === 'Amanhã' ? ` (${meta.label})` : '';
  return `${weekday} · ${datePart}${relativeTag}`;
}

function groupSessionsByComplexAndDate(sessions: SessionSlot[]): ComplexSessionGroup[] {
  const complexMap = new Map<string, SessionSlot[]>();
  for (const session of sessions) {
    const existing = complexMap.get(session.complex);
    if (existing) {
      existing.push(session);
    } else {
      complexMap.set(session.complex, [session]);
    }
  }

  const canonicalComplexes = COMPLEX_OPTIONS.slice(1);
  const orderedComplexes: string[] = [];
  for (const complex of canonicalComplexes) {
    if (complexMap.has(complex)) {
      orderedComplexes.push(complex);
    }
  }
  for (const complex of complexMap.keys()) {
    if (!orderedComplexes.includes(complex)) {
      orderedComplexes.push(complex);
    }
  }

  const canonicalDateIds = DATE_OPTIONS.map((d) => d.id);

  return orderedComplexes.map((complex) => {
    const complexSessions = complexMap.get(complex) ?? [];
    const dateMap = new Map<string, SessionSlot[]>();
    for (const session of complexSessions) {
      const existing = dateMap.get(session.dateId);
      if (existing) {
        existing.push(session);
      } else {
        dateMap.set(session.dateId, [session]);
      }
    }

    const orderedDateIds: string[] = [];
    for (const dateId of canonicalDateIds) {
      if (dateMap.has(dateId)) {
        orderedDateIds.push(dateId);
      }
    }
    const extraDateIds = Array.from(dateMap.keys()).filter((id) => !orderedDateIds.includes(id));
    extraDateIds.sort((a, b) => {
      const aTime = dateMap.get(a)?.[0]?.startsAt ?? '';
      const bTime = dateMap.get(b)?.[0]?.startsAt ?? '';
      return aTime.localeCompare(bTime);
    });
    orderedDateIds.push(...extraDateIds);

    const dates: DateSessionGroup[] = orderedDateIds.map((dateId) => {
      const daySessions = [...(dateMap.get(dateId) ?? [])].sort(
        (a, b) => a.time.localeCompare(b.time) || a.startsAt.localeCompare(b.startsAt),
      );
      return {
        dateId,
        dateHeading: formatGroupDateHeading(dateId, daySessions[0]?.dateLabel ?? dateId),
        sessions: daySessions,
      };
    });

    return {
      complex,
      totalSessions: complexSessions.length,
      dates,
    };
  });
}

function normalizeFormatFilter(value?: string): DetailFormatFilter {
  if (value && (DETAIL_FORMAT_FILTERS as readonly string[]).includes(value)) {
    return value as DetailFormatFilter;
  }
  return 'Todos';
}

function getSessionStatusLabel(status: SessionSlot['status']): string {
  if (status === 'ENCERRADA') return 'Encerrada';
  if (status === 'INATIVA') return 'Indisponível';
  return 'Disponível';
}

export function MovieDetailView({
  movie,
  movies,
  onSelectMovie,
  onBack,
  onSelectSession,
  selectedDateId,
  selectedComplex,
  formatFilter: initialFormatFilter,
  onOpenReviews,
  communityReviewCount,
}: MovieDetailViewProps) {
  const [formatFilter, setFormatFilter] = useState<DetailFormatFilter>(() =>
    normalizeFormatFilter(initialFormatFilter),
  );
  const [dateFilter, setDateFilter] = useState<string>(() => selectedDateId || 'ALL');
  const [complexFilter, setComplexFilter] = useState<string>(
    () => selectedComplex || COMPLEX_OPTIONS[0],
  );
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const movieCardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setFormatFilter(normalizeFormatFilter(initialFormatFilter));
  }, [initialFormatFilter]);

  useEffect(() => {
    setDateFilter(selectedDateId || 'ALL');
  }, [selectedDateId]);

  useEffect(() => {
    setComplexFilter(selectedComplex || COMPLEX_OPTIONS[0]);
  }, [selectedComplex]);

  useEffect(() => {
    setVideoFailed(false);
  }, [movie.id, movie.previewUrl]);

  useEffect(() => {
    const activeCard = movieCardRefs.current[movie.id];
    if (activeCard && typeof activeCard.scrollIntoView === 'function') {
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [movie.id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (trailerOpen && !dialog.open) {
      dialog.showModal();
    } else if (!trailerOpen && dialog.open) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      dialog.close();
    }
  }, [trailerOpen]);

  const filteredSessions = useMemo(() => {
    return movie.sessions.filter((session) => {
      if (formatFilter !== 'Todos' && session.format !== formatFilter) return false;
      if (dateFilter !== 'ALL' && session.dateId !== dateFilter) return false;
      if (complexFilter !== COMPLEX_OPTIONS[0] && session.complex !== complexFilter) return false;
      return true;
    });
  }, [movie.sessions, formatFilter, dateFilter, complexFilter]);

  const groupedSessions = useMemo(
    () => groupSessionsByComplexAndDate(filteredSessions),
    [filteredSessions],
  );

  const activeMovieIndex = useMemo(() => {
    if (!movies || movies.length === 0) return -1;
    return movies.findIndex((item) => item.id === movie.id);
  }, [movies, movie.id]);

  const handleCycleMovie = (direction: -1 | 1) => {
    if (!movies || movies.length <= 1 || !onSelectMovie) return;
    const currentIdx = activeMovieIndex >= 0 ? activeMovieIndex : 0;
    const nextIdx = (currentIdx + direction + movies.length) % movies.length;
    onSelectMovie(movies[nextIdx].id);
  };

  const hasActiveFilters =
    formatFilter !== 'Todos' || dateFilter !== 'ALL' || complexFilter !== COMPLEX_OPTIONS[0];

  const resetDetailFilters = () => {
    setFormatFilter('Todos');
    setDateFilter('ALL');
    setComplexFilter(COMPLEX_OPTIONS[0]);
  };

  const hasVideoPreview = Boolean(movie.previewUrl && !videoFailed);

  return (
    <section
      className="relative min-h-[calc(100dvh-68px)] overflow-x-hidden"
      aria-label={`Detalhes de ${movie.title}`}
    >
      {/* Full-bleed moody cinema backdrop */}
      <div className="absolute inset-0 z-0">
        <img src={movie.backdropSrc} alt="" className="h-full w-full object-cover object-center" />
        <div
          className="absolute inset-0"
          style={{
            background:
              movie.tone === 'emerald'
                ? 'linear-gradient(105deg, rgba(11, 24, 22, 0.86) 8%, rgba(16, 38, 34, 0.5) 52%, rgba(13, 14, 18, 0.86) 100%)'
                : 'linear-gradient(105deg, rgba(13, 14, 18, 0.88) 10%, rgba(13, 14, 18, 0.48) 54%, rgba(13, 14, 18, 0.88) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-black/30" />
      </div>

      <div className="relative z-10 w-full">
        {/* Editorial grid: Left movie switcher rail (when provided) + Main content + Right metadata rail */}
        <div
          className={
            movies && movies.length > 0
              ? 'grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_288px] xl:grid-cols-[276px_minmax(0,1fr)_312px]'
              : 'grid grid-cols-1 lg:grid-cols-[1fr_340px]'
          }
        >
          {/* Left Multi-movie quick-switcher sidebar */}
          {movies && movies.length > 0 && (
            <div
              className="min-w-0 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/28 px-4 py-4 backdrop-blur-md sm:px-5 lg:min-h-[calc(100dvh-68px)] lg:border-b-0 lg:border-r lg:px-4 lg:py-7"
              role="region"
              aria-label={`Filmes em Cartaz (${movies.length})`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                    Filmes em Cartaz ({movies.length})
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCycleMovie(-1)}
                    disabled={movies.length <= 1 || !onSelectMovie}
                    aria-label="Filme anterior"
                    className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/55 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS}`}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCycleMovie(1)}
                    disabled={movies.length <= 1 || !onSelectMovie}
                    aria-label="Próximo filme"
                    className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/55 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS}`}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mt-4 lg:flex-col lg:snap-none lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
                {movies.map((item) => {
                  const isActive = item.id === movie.id;
                  const primaryFormat = item.sessions[0]?.format;
                  return (
                    <button
                      key={item.id}
                      ref={(el) => {
                        movieCardRefs.current[item.id] = el;
                      }}
                      type="button"
                      aria-current={isActive ? 'true' : undefined}
                      aria-pressed={isActive}
                      onClick={() => onSelectMovie?.(item.id)}
                      className={`flex min-h-[44px] w-[210px] shrink-0 snap-start items-center gap-3 rounded-xl border p-2 text-left backdrop-blur-md transition-colors sm:w-[228px] lg:w-full ${FOCUS_RING_CLASS} ${
                        isActive
                          ? 'border-[var(--brand-red)] bg-[var(--bg-surface)]/55 shadow-[0_0_0_1px_var(--brand-red)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/35 hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/50'
                      }`}
                    >
                      <img
                        src={item.posterSrc}
                        alt=""
                        className="h-14 w-10 shrink-0 rounded-lg border border-white/10 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold uppercase tracking-wide text-[var(--text-primary)] lg:line-clamp-2 lg:whitespace-normal">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--text-secondary)]">
                          {primaryFormat ? `${primaryFormat} · ${item.duration}` : item.duration}
                        </p>
                        {isActive && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--amber-progress)]">
                            Em foco
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Editorial Content */}
          <div className="flex min-w-0 flex-col justify-between px-4 py-8 sm:px-8 lg:min-h-[calc(100dvh-68px)] lg:border-r lg:border-[var(--border-subtle)] lg:px-10 lg:py-10">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/55 hover:text-[var(--text-primary)] ${FOCUS_RING_CLASS}`}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Voltar ao Cartaz</span>
                </button>

                {onOpenReviews && (
                  <button
                    type="button"
                    onClick={() => onOpenReviews(movie.id)}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--amber-progress)]/45 bg-[var(--amber-progress)]/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#FCD34D] transition-colors hover:bg-[var(--amber-progress)]/25 active:scale-95 ${FOCUS_RING_CLASS}`}
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    <span>
                      Ver Comentários da Rede
                      {typeof communityReviewCount === 'number' ? ` (${communityReviewCount})` : ''}
                    </span>
                  </button>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-7"
              >
                <div className="max-w-2xl">
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                    <span className="rounded border border-[var(--border-strong)] bg-white/10 px-2.5 py-0.5 text-[var(--text-primary)]">
                      {movie.rating}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {movie.duration}
                    </span>
                    {typeof movie.ratingAvg === 'number' && (
                      <span className="inline-flex items-center gap-1 text-[#FCD34D]">
                        <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        <span className="font-mono-tabular">{movie.ratingAvg.toFixed(1)}</span>
                      </span>
                    )}
                    <span>·</span>
                    <span>{movie.genre}</span>
                  </div>

                  <h1 className="font-display line-clamp-2 break-words text-4xl font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-[var(--text-primary)] sm:text-7xl lg:text-8xl">
                    {movie.title}
                  </h1>

                  <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                    {movie.synopsis}
                  </p>
                </div>

                {/* Filters: Format, Date & Complex */}
                <div className="mt-7 max-w-3xl space-y-4">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Filtrar por formato
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar sessões por formato">
                      {DETAIL_FORMAT_FILTERS.map((fmt) => {
                        const active = formatFilter === fmt;
                        return (
                          <button
                            key={fmt}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setFormatFilter(fmt)}
                            className={`min-h-[44px] rounded-full border px-4 py-2 text-xs font-semibold backdrop-blur-md transition-colors active:scale-95 ${FOCUS_RING_CLASS} ${
                              active
                                ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/35 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/55 hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {fmt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Filtrar por data
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar sessões por data">
                      <button
                        type="button"
                        aria-pressed={dateFilter === 'ALL'}
                        onClick={() => setDateFilter('ALL')}
                        className={`min-h-[44px] rounded-lg border px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-colors active:scale-95 ${FOCUS_RING_CLASS} ${
                          dateFilter === 'ALL'
                            ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/35 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/55 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Todas as datas
                      </button>
                      {DATE_OPTIONS.map((d) => {
                        const active = dateFilter === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setDateFilter(d.id)}
                            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-colors active:scale-95 ${FOCUS_RING_CLASS} ${
                              active
                                ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/35 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/55 hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <span className="font-mono-tabular font-bold">{d.day}</span>
                            <span>{d.month}</span>
                            <span className={active ? 'text-white/90' : 'text-[var(--text-muted)]'}>· {d.weekday}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Unidade / Complexo
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar sessões por complexo">
                      {COMPLEX_OPTIONS.map((complex) => {
                        const active = complexFilter === complex;
                        return (
                          <button
                            key={complex}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setComplexFilter(complex)}
                            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-colors active:scale-95 ${FOCUS_RING_CLASS} ${
                              active
                                ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/30 text-[var(--text-primary)]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/35 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/55 hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>{complex}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Hierarchical Sessions: Unidade (Complexo) -> Data -> Cards de Horário */}
                <div className="mt-7">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Escolha uma sessão para selecionar assentos
                  </span>

                  {filteredSessions.length === 0 ? (
                    <div className="mt-3 max-w-2xl rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-5 text-sm text-[var(--text-secondary)] backdrop-blur-md">
                      <p>
                        Nenhuma sessão encontrada para os filtros selecionados. Experimente ajustar a data, complexo ou formato acima.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetDetailFilters}
                          className={`mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-strong)] bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-white/15 ${FOCUS_RING_CLASS}`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Mostrar todas as sessões</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-5">
                      {groupedSessions.map((complexGroup) => (
                        <section
                          key={complexGroup.complex}
                          aria-label={complexGroup.complex}
                          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/35 p-4 backdrop-blur-md sm:p-5"
                        >
                          {/* Level 1: Unidade (Complexo) */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                            <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-primary)] sm:text-base">
                              <MapPin className="h-4 w-4 shrink-0 text-[var(--brand-red)]" aria-hidden="true" />
                              <span className="break-words">{complexGroup.complex}</span>
                            </h2>
                            <span className="font-mono-tabular shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/45 px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                              {complexGroup.totalSessions}{' '}
                              {complexGroup.totalSessions === 1 ? 'sessão' : 'sessões'}
                            </span>
                          </div>

                          {/* Level 2: Data */}
                          <div className="mt-4 space-y-5">
                            {complexGroup.dates.map((dateGroup) => (
                              <div key={`${complexGroup.complex}-${dateGroup.dateId}`}>
                                <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--amber-progress)]">
                                  <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                  <span>{dateGroup.dateHeading}</span>
                                </h3>

                                {/* Level 3: Compact Session Cards */}
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                  {dateGroup.sessions.map((session) => {
                                    const highOccupancy = session.occupancyPct >= 75;
                                    const isBlocked = session.status !== 'ATIVA';

                                    return (
                                      <button
                                        key={session.id}
                                        type="button"
                                        disabled={isBlocked}
                                        onClick={() => {
                                          if (!isBlocked) onSelectSession(session);
                                        }}
                                        className={`group flex min-h-[44px] w-full flex-col justify-between rounded-xl border p-3.5 text-left backdrop-blur-md transition-colors ${FOCUS_RING_CLASS} ${
                                          isBlocked
                                            ? 'cursor-not-allowed border-[var(--border-subtle)] bg-[var(--bg-surface)]/25 opacity-60'
                                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/35 hover:border-[var(--brand-red)] hover:bg-[var(--bg-elevated)]/60 active:scale-[0.98]'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              <span className="font-mono-tabular text-xl font-bold text-[var(--text-primary)]">
                                                {session.time}
                                              </span>
                                              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                                                {session.format}
                                              </span>
                                              {isBlocked && (
                                                <span className="rounded border border-rose-400/40 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-200">
                                                  {getSessionStatusLabel(session.status)}
                                                </span>
                                              )}
                                            </div>

                                            <p className="mt-1.5 truncate text-xs text-[var(--text-secondary)]">
                                              {session.room}
                                            </p>
                                          </div>

                                          <div className="flex shrink-0 flex-col items-end gap-1">
                                            <span className="font-mono-tabular inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-200">
                                              <Ticket className="h-3 w-3" aria-hidden="true" />
                                              R$ {session.basePrice}
                                            </span>
                                            {!isBlocked && (
                                              <ArrowRight
                                                className="mt-0.5 h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--text-primary)]"
                                                aria-hidden="true"
                                              />
                                            )}
                                          </div>
                                        </div>

                                        <div className="mt-3">
                                          <div className="flex items-center justify-between gap-2 text-[11px]">
                                            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[var(--text-secondary)]">
                                              <Users className="h-3 w-3 shrink-0" aria-hidden="true" />
                                              Ocupação
                                            </span>
                                            <span
                                              className={`font-mono-tabular font-semibold ${
                                                highOccupancy
                                                  ? 'text-[var(--amber-progress)]'
                                                  : 'text-[var(--text-primary)]'
                                              }`}
                                            >
                                              {session.occupancyPct}%
                                            </span>
                                          </div>
                                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                            <div
                                              className={`h-full rounded-full transition-[width] ${
                                                isBlocked
                                                  ? 'bg-white/25'
                                                  : highOccupancy
                                                    ? 'bg-[var(--amber-progress)]'
                                                    : 'bg-[var(--brand-red)]'
                                              }`}
                                              style={{ width: `${session.occupancyPct}%` }}
                                            />
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-[var(--border-subtle)] pt-5 text-xs text-[var(--text-secondary)]">
              <span className="font-mono-tabular font-bold text-[var(--text-primary)]">
                {movie.indexLabel}
              </span>
              <span>·</span>
              <span>Direção de {movie.director}</span>
              <span>·</span>
              <span>Disponível com entrega da cantina na poltrona</span>
            </div>
          </div>

          {/* Right Metadata Rail + Watch Trailer Card */}
          <aside className="flex flex-col justify-between bg-[var(--bg-elevated)]/28 px-6 py-8 backdrop-blur-md lg:py-10">
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Estreia
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{movie.premiere}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Direção
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{movie.director}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Trilha Sonora
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{movie.musicBy}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Gênero
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{movie.genre}</p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/35 p-3.5 text-xs leading-relaxed text-[var(--text-secondary)] backdrop-blur-md">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                  <ShieldAlert className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                  Regra de entrega no assento
                </span>
                <p className="mt-1">
                  Pedidos da cantina destinados à sala iniciam preparo automaticamente após a validação do QR Code na portaria.
                </p>
              </div>

              {onOpenReviews && (
                <button
                  type="button"
                  onClick={() => onOpenReviews(movie.id)}
                  className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/35 px-4 py-3 text-left text-xs font-semibold text-[var(--text-primary)] backdrop-blur-md transition-colors hover:border-[var(--amber-progress)]/60 hover:bg-[var(--bg-surface)]/55 ${FOCUS_RING_CLASS}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[var(--amber-progress)]" aria-hidden="true" />
                    <span>Ver Comentários da Rede</span>
                  </span>
                  <span className="font-mono-tabular text-[#FCD34D]">
                    {typeof communityReviewCount === 'number' ? `${communityReviewCount} aval.` : 'Abrir'}
                  </span>
                </button>
              )}
            </div>

            {/* Watch Trailer Thumbnail Card */}
            <button
              type="button"
              onClick={() => setTrailerOpen(true)}
              className={`group relative mt-8 min-h-[44px] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-black text-left shadow-xl transition-transform hover:-translate-y-0.5 active:scale-[0.98] ${FOCUS_RING_CLASS}`}
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
      </div>

      {/* Native Accessible Dialog for Trailer Preview */}
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
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 text-[var(--text-secondary)] hover:border-white/40 hover:text-white ${FOCUS_RING_CLASS}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {hasVideoPreview ? (
            <video
              ref={videoRef}
              src={movie.previewUrl}
              poster={movie.backdropSrc}
              controls
              playsInline
              preload="metadata"
              onError={() => setVideoFailed(true)}
              className="h-full w-full bg-black object-contain"
            >
              Seu navegador não suporta a reprodução direta deste vídeo.
            </video>
          ) : (
            <>
              <img
                src={movie.backdropSrc}
                alt={movie.title}
                className="h-full w-full object-cover opacity-85"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-red)] text-white shadow-lg">
                  <Play className="h-6 w-6 fill-current" aria-hidden="true" />
                </span>
                <p className="mt-4 max-w-md text-sm font-medium text-white">{movie.trailerHighlight}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Prévia visual offline — vídeo oficial indisponível neste catálogo
                </p>
              </div>
            </>
          )}
        </div>
      </dialog>
    </section>
  );
}
