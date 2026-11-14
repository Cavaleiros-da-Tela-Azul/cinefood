import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Film,
  Loader2,
  Lock,
  MessageSquare,
  Pencil,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Trash2,
  UserCheck,
  WifiOff,
  X,
} from 'lucide-react';
import {
  ClientTicketOrder,
  CommunityReviewItem,
  CustomerUser,
  MovieItem,
} from '../data/cinemaData';
import {
  CatalogExternalRatings,
  CatalogGenreOption,
  ExtendedCatalogEntry,
  fetchExtendedCatalogPage,
  fetchMovieExternalRatings,
} from '../services/movieCatalogApi';

export interface CommunityReviewsViewProps {
  movies: MovieItem[];
  reviews: CommunityReviewItem[];
  orders: ClientTicketOrder[];
  currentUser: CustomerUser | null;
  initialMovieFilter?: string;
  initialSubTab?: 'overview' | 'comments';
  onAddReview: (orderId: string, movieId: string, rating: number, comment: string) => void;
  onEditReview: (reviewId: string, rating: number, comment: string) => void;
  onDeleteReview: (reviewId: string) => void;
  onNavigateToAuth: () => void;
  onBackToCatalog: () => void;
  onSelectMovieForSessions?: (movieId: string) => void;
}

type ReviewSortMode = 'recent' | 'highest' | 'lowest';
type CatalogSubTab = 'overview' | 'comments';

const SORT_OPTIONS: { id: ReviewSortMode; label: string }[] = [
  { id: 'recent', label: 'Mais recentes' },
  { id: 'highest', label: 'Maior nota' },
  { id: 'lowest', label: 'Menor nota' },
];

const FOCUS_RING_CLASS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]';

function normalizeTitle(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function splitGenres(rawGenre: string): string[] {
  return rawGenre
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function movieToCatalogEntry(movie: MovieItem): ExtendedCatalogEntry {
  return {
    id: movie.id,
    title: movie.title,
    synopsis: movie.synopsis,
    genres: splitGenres(movie.genre),
    posterSrc: movie.posterSrc,
    backdropSrc: movie.backdropSrc,
    releaseDate: movie.premiere,
    runtime: movie.duration,
    advisoryRating: movie.rating,
    director: movie.director,
  };
}

function findMatchedTheaterMovie(
  entry: ExtendedCatalogEntry,
  movies: MovieItem[],
): MovieItem | undefined {
  const normalizedEntryTitle = normalizeTitle(entry.title);
  return movies.find(
    (movie) =>
      movie.id === entry.id || normalizeTitle(movie.title) === normalizedEntryTitle,
  );
}

function extractReleaseYear(rawDate: string | undefined): string | undefined {
  if (!rawDate) return undefined;
  const match = /\b(19|20)\d{2}\b/.exec(rawDate);
  return match ? match[0] : undefined;
}

function formatReviewDate(rawDate: string): string {
  const parsed = Date.parse(rawDate);
  if (Number.isNaN(parsed)) return rawDate;
  return new Date(parsed).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getReviewTimestamp(rawDate: string): number {
  const parsed = Date.parse(rawDate);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function resolveCatalogSourceLabel(source: 'tmdb-api' | 'itunes-api' | 'fallback'): {
  label: string;
  isOfflineFallback: boolean;
} {
  if (source === 'tmdb-api') {
    return { label: 'TMDB ao vivo', isOfflineFallback: false };
  }
  if (source === 'itunes-api') {
    return { label: 'Acervo público iTunes + CineFood', isOfflineFallback: false };
  }
  return { label: 'Modo offline / acervo local', isOfflineFallback: true };
}

export function CommunityReviewsView({
  movies,
  reviews,
  orders,
  currentUser,
  initialMovieFilter,
  initialSubTab,
  onAddReview,
  onEditReview,
  onDeleteReview,
  onNavigateToAuth,
  onBackToCatalog,
  onSelectMovieForSessions,
}: CommunityReviewsViewProps) {
  // Level 1: Extended catalog grid state
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [selectedGenreId, setSelectedGenreId] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [catalogItems, setCatalogItems] = useState<ExtendedCatalogEntry[]>(() =>
    movies.map(movieToCatalogEntry),
  );
  const [genreOptions, setGenreOptions] = useState<CatalogGenreOption[]>([]);
  const [catalogSource, setCatalogSource] = useState<'tmdb-api' | 'itunes-api' | 'fallback'>(
    'fallback',
  );
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [brokenPosters, setBrokenPosters] = useState<Record<string, boolean>>({});

  // Level 2: Selected movie sheet & sub-tab state
  const [selectedEntry, setSelectedEntry] = useState<ExtendedCatalogEntry | null>(() => {
    if (!initialMovieFilter || initialMovieFilter === 'ALL') return null;
    const matched = movies.find((m) => m.id === initialMovieFilter);
    return matched ? movieToCatalogEntry(matched) : null;
  });
  const [activeSubTab, setActiveSubTab] = useState<CatalogSubTab>(() => {
    if (initialSubTab) return initialSubTab;
    return initialMovieFilter && initialMovieFilter !== 'ALL' ? 'comments' : 'overview';
  });

  // On-demand external ratings state (IMDb / Rotten Tomatoes)
  const [externalRatings, setExternalRatings] = useState<CatalogExternalRatings | null>(null);
  const [isLoadingRatings, setIsLoadingRatings] = useState<boolean>(false);

  // Comments sub-tab state (RF-13 Option A)
  const [sortMode, setSortMode] = useState<ReviewSortMode>('recent');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Reset pagination when query or genre changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, selectedGenreId]);

  // Fetch paginated extended catalog
  useEffect(() => {
    let cancelled = false;
    const loadingFirstPage = page === 1;

    if (loadingFirstPage) {
      setIsLoadingPage(true);
    } else {
      setIsLoadingMore(true);
    }
    setCatalogError(null);

    fetchExtendedCatalogPage({
      page,
      query: debouncedQuery || undefined,
      genreId: selectedGenreId !== 'ALL' ? selectedGenreId : undefined,
      fallbackMovies: movies,
    })
      .then((result) => {
        if (cancelled) return;
        setCatalogSource(result.source);
        setTotalPages(Math.max(1, result.totalPages));
        if (result.genres.length > 0) {
          setGenreOptions(result.genres);
        }
        setCatalogItems((prev) => {
          if (loadingFirstPage) return result.items;
          const seen = new Set(prev.map((item) => item.id));
          const merged = [...prev];
          for (const item of result.items) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              merged.push(item);
            }
          }
          return merged;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setCatalogError('Catálogo externo indisponível no momento; exibindo acervo local.');
        setCatalogSource('fallback');
        if (loadingFirstPage) {
          const normalizedQ = debouncedQuery.toLowerCase();
          const localFallback = movies
            .map(movieToCatalogEntry)
            .filter((entry) => {
              const matchesQuery =
                !normalizedQ || entry.title.toLowerCase().includes(normalizedQ);
              const matchesGenre =
                selectedGenreId === 'ALL' ||
                entry.genres.some(
                  (g) => g.toLowerCase() === selectedGenreId.toLowerCase(),
                );
              return matchesQuery && matchesGenre;
            });
          setCatalogItems(localFallback);
          setTotalPages(1);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingPage(false);
        setIsLoadingMore(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery, selectedGenreId, movies]);

  // Sync deep-link props (e.g., "Ver Comentários da Rede" from MovieDetailView)
  useEffect(() => {
    if (!initialMovieFilter || initialMovieFilter === 'ALL') {
      if (initialMovieFilter === 'ALL') {
        setSelectedEntry(null);
      }
      return;
    }

    const fromMovies = movies.find((m) => m.id === initialMovieFilter);
    const fromCatalog = catalogItems.find(
      (item) =>
        item.id === initialMovieFilter ||
        (fromMovies && normalizeTitle(item.title) === normalizeTitle(fromMovies.title)),
    );

    if (fromCatalog) {
      setSelectedEntry(fromCatalog);
      setActiveSubTab(initialSubTab ?? 'comments');
    } else if (fromMovies) {
      setSelectedEntry(movieToCatalogEntry(fromMovies));
      setActiveSubTab(initialSubTab ?? 'comments');
    }
  }, [initialMovieFilter, initialSubTab, movies]);

  // Enrich active selectedEntry when catalogItems finishes loading
  useEffect(() => {
    if (!selectedEntry) return;
    const enriched = catalogItems.find(
      (item) =>
        item.id === selectedEntry.id ||
        normalizeTitle(item.title) === normalizeTitle(selectedEntry.title),
    );
    if (enriched && (enriched.tmdbId !== selectedEntry.tmdbId || enriched.imdbId !== selectedEntry.imdbId)) {
      setSelectedEntry(enriched);
    }
  }, [catalogItems, selectedEntry]);

  // Fetch external ratings (IMDb / Rotten Tomatoes) on demand when Level 2 opens
  useEffect(() => {
    if (!selectedEntry) {
      setExternalRatings(null);
      setIsLoadingRatings(false);
      return;
    }

    let cancelled = false;
    setIsLoadingRatings(true);
    setExternalRatings(
      selectedEntry.initialRatings
        ? {
            imdbScore: selectedEntry.initialRatings.imdbScore ?? null,
            imdbVotes: selectedEntry.initialRatings.imdbVotes ?? null,
            rottenTomatoes: selectedEntry.initialRatings.rottenTomatoes ?? null,
            tmdbScore: selectedEntry.initialRatings.tmdbScore ?? null,
            source: selectedEntry.initialRatings.source ?? 'unavailable',
          }
        : null,
    );

    fetchMovieExternalRatings({
      id: selectedEntry.id,
      tmdbId: selectedEntry.tmdbId,
      imdbId: selectedEntry.imdbId,
      title: selectedEntry.title,
      year: extractReleaseYear(selectedEntry.releaseDate),
    })
      .then((ratings) => {
        if (!cancelled) {
          setExternalRatings(ratings);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExternalRatings({
            imdbScore: null,
            rottenTomatoes: null,
            tmdbScore: null,
            source: 'unavailable',
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRatings(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedEntry]);

  // Derived genre options (API genres or fallback derived from movies)
  const effectiveGenreOptions = useMemo<CatalogGenreOption[]>(() => {
    if (genreOptions.length > 0) return genreOptions;
    const seen = new Map<string, CatalogGenreOption>();
    for (const movie of movies) {
      for (const genre of splitGenres(movie.genre)) {
        const key = genre.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, { id: genre, name: genre });
        }
      }
    }
    return Array.from(seen.values());
  }, [genreOptions, movies]);

  // Level 2 derived data
  const matchedTheaterMovie = useMemo(
    () => (selectedEntry ? findMatchedTheaterMovie(selectedEntry, movies) : undefined),
    [selectedEntry, movies],
  );

  const filmReviews = useMemo(() => {
    if (!selectedEntry) return [];
    const normalizedSelectedTitle = normalizeTitle(selectedEntry.title);
    const list = reviews.filter(
      (review) =>
        review.movieId === selectedEntry.id ||
        (matchedTheaterMovie && review.movieId === matchedTheaterMovie.id) ||
        normalizeTitle(review.movieTitle) === normalizedSelectedTitle,
    );

    list.sort((a, b) => {
      if (sortMode === 'highest') {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return getReviewTimestamp(b.createdAt) - getReviewTimestamp(a.createdAt);
      }
      if (sortMode === 'lowest') {
        if (a.rating !== b.rating) return a.rating - b.rating;
        return getReviewTimestamp(b.createdAt) - getReviewTimestamp(a.createdAt);
      }
      return getReviewTimestamp(b.createdAt) - getReviewTimestamp(a.createdAt);
    });

    return list;
  }, [selectedEntry, matchedTheaterMovie, reviews, sortMode]);

  const cinefoodAverageRating = useMemo(() => {
    if (filmReviews.length === 0) return null;
    const sum = filmReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / filmReviews.length).toFixed(1);
  }, [filmReviews]);

  const userOrders = useMemo(
    () => (currentUser ? orders.filter((o) => o.userId === currentUser.id) : []),
    [currentUser, orders],
  );

  const reviewedOrderIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of reviews) {
      if (r.orderId) set.add(r.orderId);
    }
    return set;
  }, [reviews]);

  const eligibleOrdersForFilm = useMemo(() => {
    if (!selectedEntry) return [];
    const normalizedSelectedTitle = normalizeTitle(selectedEntry.title);
    return userOrders.filter(
      (order) =>
        order.checkedIn &&
        order.sessionEnded &&
        order.status !== 'CANCELADO' &&
        order.orderKind !== 'canteen-only' &&
        !reviewedOrderIds.has(order.id) &&
        (order.movieId === selectedEntry.id ||
          (matchedTheaterMovie && order.movieId === matchedTheaterMovie.id) ||
          normalizeTitle(order.movieTitle) === normalizedSelectedTitle),
    );
  }, [selectedEntry, matchedTheaterMovie, userOrders, reviewedOrderIds]);

  const hasPendingCheckInForFilm = useMemo(() => {
    if (!selectedEntry) return false;
    const normalizedSelectedTitle = normalizeTitle(selectedEntry.title);
    return userOrders.some(
      (order) =>
        order.status === 'ATIVO' &&
        !order.checkedIn &&
        order.orderKind !== 'canteen-only' &&
        (order.movieId === selectedEntry.id ||
          (matchedTheaterMovie && order.movieId === matchedTheaterMovie.id) ||
          normalizeTitle(order.movieTitle) === normalizedSelectedTitle),
    );
  }, [selectedEntry, matchedTheaterMovie, userOrders]);

  const hasOwnReviewForFilm = useMemo(
    () => Boolean(currentUser && filmReviews.some((r) => r.userId === currentUser.id)),
    [currentUser, filmReviews],
  );

  useEffect(() => {
    if (eligibleOrdersForFilm.length === 0) {
      setSelectedOrderId('');
      return;
    }
    if (!eligibleOrdersForFilm.some((o) => o.id === selectedOrderId)) {
      setSelectedOrderId(eligibleOrdersForFilm[0].id);
    }
  }, [eligibleOrdersForFilm, selectedOrderId]);

  const resetReviewFormState = () => {
    setNewComment('');
    setNewRating(5);
    setCreateError(null);
    setCreateSuccess(null);
    setEditingReviewId(null);
    setEditError(null);
    setConfirmDeleteId(null);
  };

  const handleOpenMovieSheet = (entry: ExtendedCatalogEntry, subTab: CatalogSubTab = 'overview') => {
    resetReviewFormState();
    setSelectedEntry(entry);
    setActiveSubTab(subTab);
  };

  const handleBackToGrid = () => {
    resetReviewFormState();
    setSelectedEntry(null);
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDebouncedQuery(searchInput.trim());
    setPage(1);
  };

  const handleSubTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveSubTab((prev) => (prev === 'overview' ? 'comments' : 'overview'));
    }
  };

  const handlePublishSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateSuccess(null);

    if (!currentUser) {
      setCreateError('Faça login para publicar uma avaliação verificada (RF-13).');
      return;
    }

    const chosenOrder = eligibleOrdersForFilm.find((o) => o.id === selectedOrderId);
    if (!chosenOrder) {
      setCreateError(
        'Nenhum ingresso elegível encontrado para este filme. É necessário possuir entrada validada na portaria e sessão encerrada.',
      );
      return;
    }

    const trimmed = newComment.trim();
    if (trimmed.length < 5) {
      setCreateError('Escreva um comentário com pelo menos 5 caracteres sobre a sessão.');
      return;
    }

    setCreateError(null);
    onAddReview(chosenOrder.id, chosenOrder.movieId, newRating, trimmed);
    setNewComment('');
    setNewRating(5);
    setCreateSuccess(`Avaliação verificada publicada para ${chosenOrder.movieTitle}.`);
  };

  const startEditing = (review: CommunityReviewItem) => {
    setConfirmDeleteId(null);
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditError(null);
  };

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>, reviewId: string) => {
    e.preventDefault();
    const trimmed = editComment.trim();
    if (trimmed.length < 5) {
      setEditError('O comentário deve ter pelo menos 5 caracteres.');
      return;
    }
    setEditError(null);
    onEditReview(reviewId, editRating, trimmed);
    setEditingReviewId(null);
  };

  const sourceInfo = resolveCatalogSourceLabel(catalogSource);

  // =========================================================================
  // LEVEL 2: SELECTED MOVIE SHEET + OVERVIEW / COMMENTS SUB-TABS
  // =========================================================================
  if (selectedEntry) {
    const posterBroken = Boolean(brokenPosters[selectedEntry.id]);
    const entryGenres =
      selectedEntry.genres.length > 0
        ? selectedEntry.genres
        : matchedTheaterMovie
          ? splitGenres(matchedTheaterMovie.genre)
          : [];
    const synopsisText =
      selectedEntry.synopsis.trim() ||
      matchedTheaterMovie?.synopsis ||
      'Sinopse detalhada indisponível para este título no momento.';

    return (
      <section
        className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8 sm:py-10"
        aria-label={`Ficha do filme ${selectedEntry.title}`}
      >
        {/* Top back bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackToGrid}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-[var(--bg-elevated)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:border-white/35 hover:text-[var(--text-primary)] ${FOCUS_RING_CLASS}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Voltar ao Catálogo</span>
          </button>

          {matchedTheaterMovie && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-red)]/50 bg-[var(--brand-red)]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              <Ticket className="h-3.5 w-3.5 text-[#FCA5A5]" aria-hidden="true" />
              Em Cartaz na Rede CineFood
            </span>
          )}
        </div>

        {/* Movie Hero / Technical Header */}
        <div className="relative mt-5 overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 sm:p-7">
          <div className="grid gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
            {/* Poster */}
            <div className="mx-auto w-44 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-[var(--bg-surface)] md:mx-0 md:w-full">
              {selectedEntry.posterSrc && !posterBroken ? (
                <img
                  src={selectedEntry.posterSrc}
                  alt={`Pôster de ${selectedEntry.title}`}
                  onError={() =>
                    setBrokenPosters((prev) => ({ ...prev, [selectedEntry.id]: true }))
                  }
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 p-4 text-center text-[var(--text-muted)]">
                  <Film className="h-8 w-8" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {selectedEntry.title}
                  </span>
                </div>
              )}
            </div>

            {/* Info & Ratings */}
            <div className="min-w-0 flex flex-col justify-between gap-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {entryGenres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-white/15 bg-[var(--bg-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                    >
                      {genre}
                    </span>
                  ))}
                  {selectedEntry.advisoryRating && (
                    <span className="rounded-full border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FCD34D]">
                      {selectedEntry.advisoryRating}
                    </span>
                  )}
                </div>

                <h1 className="font-display mt-3 break-words text-3xl font-extrabold uppercase tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                  {selectedEntry.title}
                </h1>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-secondary)]">
                  {selectedEntry.releaseDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                      {selectedEntry.releaseDate}
                    </span>
                  )}
                  {(selectedEntry.runtime || matchedTheaterMovie?.duration) && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                      {selectedEntry.runtime || matchedTheaterMovie?.duration}
                    </span>
                  )}
                  {(selectedEntry.director || matchedTheaterMovie?.director) && (
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                      Dir. {selectedEntry.director || matchedTheaterMovie?.director}
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                  {synopsisText}
                </p>
              </div>

              {/* 3-Rating Comparative Panel */}
              <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                aria-label="Comparativo de notas do filme"
              >
                {/* IMDb */}
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3.5">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    IMDb
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    {isLoadingRatings && !externalRatings ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)]">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Consultando...
                      </span>
                    ) : (
                      <span className="font-mono-tabular text-2xl font-extrabold text-[#FCD34D]">
                        {externalRatings?.imdbScore ?? 'N/D'}
                      </span>
                    )}
                    {externalRatings?.imdbVotes && (
                      <span className="text-[11px] text-[var(--text-muted)]">
                        ({externalRatings.imdbVotes})
                      </span>
                    )}
                  </div>
                </div>

                {/* Rotten Tomatoes */}
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3.5">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Rotten Tomatoes
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    {isLoadingRatings && !externalRatings ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)]">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Consultando...
                      </span>
                    ) : (
                      <span className="font-mono-tabular inline-flex items-center gap-1.5 text-2xl font-extrabold text-[var(--text-primary)]">
                        <Award className="h-4 w-4 text-[var(--brand-red)]" aria-hidden="true" />
                        {externalRatings?.rottenTomatoes ?? 'N/D'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Usuários CineFood */}
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3.5">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Usuários CineFood
                  </span>
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                    {cinefoodAverageRating ? (
                      <>
                        <span className="font-mono-tabular inline-flex items-center gap-1 text-2xl font-extrabold text-[var(--success-emerald)]">
                          <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                          {cinefoodAverageRating}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          / 5 ({filmReviews.length}{' '}
                          {filmReviews.length === 1 ? 'nota' : 'notas'})
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-[var(--text-secondary)]">
                        Sem notas
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action CTA for in-theater movies */}
              {matchedTheaterMovie && (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectMovieForSessions?.(matchedTheaterMovie.id)}
                    className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95 ${FOCUS_RING_CLASS}`}
                  >
                    <Ticket className="h-4 w-4" aria-hidden="true" />
                    <span>Ver Sessões / Comprar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-tabs: Visão Geral / Ficha vs Comentários */}
        <div
          role="tablist"
          aria-label="Seções da ficha do filme"
          className="mt-6 flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-4"
        >
          <button
            id="catalog-tab-overview"
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'overview'}
            aria-controls="catalog-panel-overview"
            onClick={() => setActiveSubTab('overview')}
            onKeyDown={handleSubTabKeyDown}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${FOCUS_RING_CLASS} ${
              activeSubTab === 'overview'
                ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                : 'border-white/15 bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-white/35 hover:text-[var(--text-primary)]'
            }`}
          >
            <Film className="h-4 w-4" aria-hidden="true" />
            <span>Visão Geral / Ficha</span>
          </button>

          <button
            id="catalog-tab-comments"
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'comments'}
            aria-controls="catalog-panel-comments"
            onClick={() => setActiveSubTab('comments')}
            onKeyDown={handleSubTabKeyDown}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${FOCUS_RING_CLASS} ${
              activeSubTab === 'comments'
                ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                : 'border-white/15 bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-white/35 hover:text-[var(--text-primary)]'
            }`}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>Comentários ({filmReviews.length})</span>
          </button>
        </div>

        {/* Sub-tab 1: Visão Geral / Ficha */}
        {activeSubTab === 'overview' && (
          <div
            id="catalog-panel-overview"
            role="tabpanel"
            aria-labelledby="catalog-tab-overview"
            className="mt-6 space-y-5"
          >
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--amber-progress)]">
                  Sinopse &amp; Detalhes
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                  {synopsisText}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)] pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('comments')}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-[var(--bg-surface)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] transition-colors hover:border-white/40 ${FOCUS_RING_CLASS}`}
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    <span>Ler Comentários da Rede ({filmReviews.length})</span>
                  </button>
                  {matchedTheaterMovie && (
                    <button
                      type="button"
                      onClick={() => onSelectMovieForSessions?.(matchedTheaterMovie.id)}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--brand-red-hover)] ${FOCUS_RING_CLASS}`}
                    >
                      <Ticket className="h-4 w-4" aria-hidden="true" />
                      <span>Ver Sessões / Comprar</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--amber-progress)]">
                  Ficha Técnica
                </h2>
                <dl className="mt-4 space-y-3 text-sm">
                  {selectedEntry.originalTitle &&
                    normalizeTitle(selectedEntry.originalTitle) !==
                      normalizeTitle(selectedEntry.title) && (
                      <div className="flex justify-between gap-3 border-b border-[var(--border-subtle)] pb-2">
                        <dt className="text-[var(--text-muted)]">Título original</dt>
                        <dd className="text-right font-semibold text-[var(--text-primary)]">
                          {selectedEntry.originalTitle}
                        </dd>
                      </div>
                    )}
                  <div className="flex justify-between gap-3 border-b border-[var(--border-subtle)] pb-2">
                    <dt className="text-[var(--text-muted)]">Lançamento</dt>
                    <dd className="text-right font-semibold text-[var(--text-primary)]">
                      {selectedEntry.releaseDate || 'N/D'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-[var(--border-subtle)] pb-2">
                    <dt className="text-[var(--text-muted)]">Duração</dt>
                    <dd className="text-right font-semibold text-[var(--text-primary)]">
                      {selectedEntry.runtime || matchedTheaterMovie?.duration || 'N/D'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-[var(--border-subtle)] pb-2">
                    <dt className="text-[var(--text-muted)]">Direção</dt>
                    <dd className="text-right font-semibold text-[var(--text-primary)]">
                      {selectedEntry.director || matchedTheaterMovie?.director || 'N/D'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-[var(--border-subtle)] pb-2">
                    <dt className="text-[var(--text-muted)]">Categorias</dt>
                    <dd className="text-right font-semibold text-[var(--text-primary)]">
                      {entryGenres.length > 0 ? entryGenres.join(', ') : 'N/D'}
                    </dd>
                  </div>
                  {externalRatings?.tmdbScore && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--text-muted)]">TMDB</dt>
                      <dd className="font-mono-tabular text-right font-semibold text-[var(--text-primary)]">
                        {externalRatings.tmdbScore}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 2: Comentários Verificados do Filme (RF-13 Option A) */}
        {activeSubTab === 'comments' && (
          <div
            id="catalog-panel-comments"
            role="tabpanel"
            aria-labelledby="catalog-tab-comments"
            className="mt-6 space-y-5"
          >
            {/* RF-13 Publish / Eligibility Gate Panel */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 sm:p-6">
              {!currentUser ? (
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/15 text-[#FCD34D]">
                      <Lock className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[var(--text-primary)]">
                        Quer compartilhar sua opinião sobre este filme?
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Para comentar, é necessário entrar na conta CineFood, possuir ingresso validado na portaria e sessão encerrada na rede CineFood (RF-13).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToAuth}
                    className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95 ${FOCUS_RING_CLASS}`}
                  >
                    <UserCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Entrar para Avaliar</span>
                  </button>
                </div>
              ) : eligibleOrdersForFilm.length > 0 ? (
                <form onSubmit={handlePublishSubmit} noValidate className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="inline-flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
                        <ShieldCheck className="h-5 w-5 text-[var(--success-emerald)]" aria-hidden="true" />
                        <span>Publicar Avaliação de Sessão Assistida</span>
                      </h2>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                        Você possui {eligibleOrdersForFilm.length}{' '}
                        {eligibleOrdersForFilm.length === 1
                          ? 'sessão validada pronta'
                          : 'sessões validadas prontas'}{' '}
                        para avaliar <strong className="text-[var(--text-primary)]">{selectedEntry.title}</strong> como{' '}
                        <strong className="text-[var(--text-primary)]">{currentUser.name}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <label
                        htmlFor="review-eligible-order"
                        className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                      >
                        Sessão elegível (check-in confirmado)
                      </label>
                      <select
                        id="review-eligible-order"
                        value={selectedOrderId}
                        onChange={(e) => setSelectedOrderId(e.target.value)}
                        className={`mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-[var(--bg-surface)] px-3.5 py-2 text-base text-[var(--text-primary)] sm:text-sm ${FOCUS_RING_CLASS}`}
                      >
                        {eligibleOrdersForFilm.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.movieTitle} · {order.complex} ({order.dateLabel} {order.time} · #{order.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Sua nota (1 a 5)
                      </span>
                      <div
                        className="mt-1.5 flex items-center gap-1"
                        role="group"
                        aria-label="Selecionar nota de 1 a 5 estrelas"
                      >
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = star <= newRating;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewRating(star)}
                              aria-pressed={newRating === star}
                              aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
                              className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border transition-colors ${FOCUS_RING_CLASS} ${
                                active
                                  ? 'border-[var(--amber-progress)]/60 bg-[var(--amber-progress)]/15 text-[#FCD34D]'
                                  : 'border-white/15 bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white'
                              }`}
                            >
                              <Star className={`h-5 w-5 ${active ? 'fill-current' : ''}`} aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="review-comment-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                    >
                      Seu comentário sobre o filme e a sala
                    </label>
                    <textarea
                      id="review-comment-input"
                      rows={3}
                      value={newComment}
                      onChange={(e) => {
                        setNewComment(e.target.value);
                        if (createError) setCreateError(null);
                      }}
                      placeholder="Conte como foi a projeção, o som da sala e a experiência na sessão..."
                      className={`mt-1.5 w-full rounded-xl border border-white/15 bg-[var(--bg-surface)] px-3.5 py-2.5 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] sm:text-sm ${FOCUS_RING_CLASS}`}
                    />
                  </div>

                  {createError && (
                    <p
                      role="alert"
                      className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2.5 text-xs font-medium text-rose-200"
                    >
                      {createError}
                    </p>
                  )}

                  {createSuccess && (
                    <p
                      role="status"
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-medium text-emerald-200"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{createSuccess}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="submit"
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95 ${FOCUS_RING_CLASS}`}
                    >
                      <MessageSquare className="h-4 w-4" aria-hidden="true" />
                      <span>Publicar Comentário Verificado</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[var(--bg-surface)] text-[var(--amber-progress)]">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      Pré-requisito de entrada validada na portaria (RF-13)
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      Para comentar, é necessário ingresso validado na portaria e sessão encerrada na rede CineFood.
                      {!matchedTheaterMovie &&
                        ' Este título não está em cartaz na rede CineFood no momento.'}
                      {hasPendingCheckInForFilm &&
                        ' Você possui ingresso ativo deste filme aguardando check-in na portaria.'}
                      {hasOwnReviewForFilm &&
                        ' Sua sessão encerrada deste filme já foi avaliada — você pode editar ou excluir seu comentário diretamente abaixo.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Toolbar for this film's reviews */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                  Avaliações Verificadas · {selectedEntry.title}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {filmReviews.length === 0
                    ? 'Nenhuma avaliação registrada ainda'
                    : `${filmReviews.length} ${
                        filmReviews.length === 1 ? 'avaliação verificada' : 'avaliações verificadas'
                      }`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  Ordenar
                </span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ordenar comentários">
                  {SORT_OPTIONS.map((opt) => {
                    const active = sortMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSortMode(opt.id)}
                        className={`min-h-[44px] rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${FOCUS_RING_CLASS} ${
                          active
                            ? 'border-[var(--amber-progress)] bg-[var(--amber-progress)]/20 text-[#FCD34D]'
                            : 'border-white/15 bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Film Reviews List */}
            {filmReviews.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 text-center">
                <MessageSquare className="mx-auto h-9 w-9 text-[var(--text-muted)]" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-bold text-[var(--text-primary)]">
                  Ainda não há comentários para este filme
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-secondary)]">
                  Apenas espectadores com ingresso validado na portaria e sessão encerrada na rede CineFood podem publicar notas e comentários.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filmReviews.map((review) => {
                  const isOwner = Boolean(currentUser && review.userId === currentUser.id);
                  const isEditing = editingReviewId === review.id;
                  const isConfirmingDelete = confirmDeleteId === review.id;

                  return (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 transition-colors hover:border-white/20"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-[var(--text-primary)]">
                              {review.authorDisplayName}
                            </span>
                            {review.verifiedCheckIn && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                Sessão Assistida · Entrada Validada
                              </span>
                            )}
                            {isOwner && (
                              <span className="rounded-full border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#FCD34D]">
                                Sua avaliação
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                            <span className="inline-flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {review.complex}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                              {formatReviewDate(review.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[var(--bg-surface)] px-3 py-1"
                          aria-label={`Nota ${review.rating} de 5 estrelas`}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= review.rating
                                  ? 'fill-[#FCD34D] text-[#FCD34D]'
                                  : 'text-[var(--text-muted)]'
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                          <span className="font-mono-tabular ml-1 text-xs font-bold text-[var(--text-primary)]">
                            {review.rating}.0
                          </span>
                        </div>
                      </div>

                      {isEditing ? (
                        <form
                          onSubmit={(e) => handleEditSubmit(e, review.id)}
                          className="mt-4 space-y-3 rounded-xl border border-white/15 bg-[var(--bg-surface)] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                              Editar sua nota e comentário
                            </span>
                            <div
                              className="flex items-center gap-1"
                              role="group"
                              aria-label="Editar nota de 1 a 5 estrelas"
                            >
                              {[1, 2, 3, 4, 5].map((star) => {
                                const active = star <= editRating;
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setEditRating(star)}
                                    aria-pressed={editRating === star}
                                    aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
                                    className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-colors ${FOCUS_RING_CLASS} ${
                                      active
                                        ? 'border-[var(--amber-progress)]/60 bg-[var(--amber-progress)]/15 text-[#FCD34D]'
                                        : 'border-white/15 bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                                    }`}
                                  >
                                    <Star
                                      className={`h-4 w-4 ${active ? 'fill-current' : ''}`}
                                      aria-hidden="true"
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <textarea
                            rows={3}
                            value={editComment}
                            onChange={(e) => {
                              setEditComment(e.target.value);
                              if (editError) setEditError(null);
                            }}
                            aria-label="Editar texto do comentário"
                            className={`w-full rounded-xl border border-white/15 bg-[var(--bg-elevated)] px-3.5 py-2.5 text-base text-[var(--text-primary)] sm:text-sm ${FOCUS_RING_CLASS}`}
                          />

                          {editError && (
                            <p
                              role="alert"
                              className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-200"
                            >
                              {editError}
                            </p>
                          )}

                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingReviewId(null);
                                setEditError(null);
                              }}
                              className={`inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-white ${FOCUS_RING_CLASS}`}
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className={`inline-flex min-h-[44px] items-center rounded-full bg-[var(--brand-red)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)] ${FOCUS_RING_CLASS}`}
                            >
                              Salvar Alterações
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="mt-3">
                          {review.title && (
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">
                              {review.title}
                            </h3>
                          )}
                          <p className="mt-1 break-words text-sm leading-relaxed text-[var(--text-secondary)]">
                            {review.comment}
                          </p>
                        </div>
                      )}

                      {isOwner && !isEditing && (
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                          <button
                            type="button"
                            onClick={() => startEditing(review)}
                            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/20 bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-white/40 ${FOCUS_RING_CLASS}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Editar</span>
                          </button>

                          {!isConfirmingDelete ? (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(review.id)}
                              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-rose-400/35 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 ${FOCUS_RING_CLASS}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Excluir</span>
                            </button>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-rose-200">
                                Confirmar exclusão?
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteReview(review.id);
                                  setConfirmDeleteId(null);
                                }}
                                className={`inline-flex min-h-[44px] items-center rounded-full bg-rose-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 ${FOCUS_RING_CLASS}`}
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className={`inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-white ${FOCUS_RING_CLASS}`}
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  // =========================================================================
  // LEVEL 1: EXTENDED CATALOG POSTER GRID
  // =========================================================================
  return (
    <section
      className="mx-auto max-w-[1320px] px-4 py-6 sm:px-8 sm:py-10"
      aria-label="Catálogo extenso de filmes CineFood"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBackToCatalog}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-[var(--bg-elevated)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:border-white/35 hover:text-[var(--text-primary)] ${FOCUS_RING_CLASS}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Voltar ao Cartaz</span>
          </button>

          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--amber-progress)]">
            Vitrine Completa · IMDb · Rotten Tomatoes · RF-13
          </p>
          <h1 className="font-display mt-1 text-4xl font-extrabold uppercase tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Catálogo de Filmes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
            Explore lançamentos e acervo completo, compare notas do IMDb, Rotten Tomatoes e espectadores verificados da rede CineFood.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              sourceInfo.isOfflineFallback || catalogError
                ? 'border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/15 text-[#FCD34D]'
                : 'border-white/15 bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            {sourceInfo.isOfflineFallback || catalogError ? (
              <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--amber-progress)]" aria-hidden="true" />
            )}
            <span>{sourceInfo.label}</span>
          </span>
        </div>
      </div>

      {/* Search & Genre Filter Controls */}
      <div className="mt-6 space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <label htmlFor="catalog-search-input" className="sr-only">
              Buscar filmes por título
            </label>
            <input
              id="catalog-search-input"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar filmes por título..."
              className={`min-h-[44px] w-full rounded-xl border border-white/15 bg-[var(--bg-surface)] py-2.5 pl-10 pr-11 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] sm:text-sm ${FOCUS_RING_CLASS}`}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedQuery('');
                }}
                aria-label="Limpar busca"
                className={`absolute right-1 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-white ${FOCUS_RING_CLASS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>

        <div>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Filtrar por categoria
          </span>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar catálogo por categoria"
          >
            <button
              type="button"
              aria-pressed={selectedGenreId === 'ALL'}
              onClick={() => setSelectedGenreId('ALL')}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${FOCUS_RING_CLASS} ${
                selectedGenreId === 'ALL'
                  ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                  : 'border-white/15 bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-white/35 hover:text-[var(--text-primary)]'
              }`}
            >
              Todos
            </button>
            {effectiveGenreOptions.map((genre) => {
              const active = selectedGenreId === genre.id;
              return (
                <button
                  key={genre.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedGenreId(genre.id)}
                  className={`min-h-[44px] rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${FOCUS_RING_CLASS} ${
                    active
                      ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white'
                      : 'border-white/15 bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-white/35 hover:text-[var(--text-primary)]'
                  }`}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {catalogError && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--amber-progress)]/40 bg-[var(--amber-progress)]/15 px-4 py-3 text-xs font-medium text-[#FCD34D]"
        >
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{catalogError}</span>
        </div>
      )}

      {/* Loading Skeleton or Poster Grid */}
      {isLoadingPage ? (
        <div className="mt-6">
          <p role="status" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--amber-progress)]" aria-hidden="true" />
            Carregando catálogo de filmes...
          </p>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
              >
                <div className="aspect-[2/3] w-full animate-pulse bg-[var(--bg-surface)]" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--bg-surface)]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--bg-surface)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : catalogItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 text-center">
          <Film className="mx-auto h-9 w-9 text-[var(--text-muted)]" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-[var(--text-primary)]">
            Nenhum filme encontrado no catálogo
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Tente outro termo de busca ou remova o filtro de categoria selecionado.
          </p>
          {(debouncedQuery || selectedGenreId !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setDebouncedQuery('');
                setSelectedGenreId('ALL');
              }}
              className={`mt-5 inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-white/10 ${FOCUS_RING_CLASS}`}
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5">
            {catalogItems.map((entry) => {
              const matchedMovie = findMatchedTheaterMovie(entry, movies);
              const posterBroken = Boolean(brokenPosters[entry.id]);
              const releaseYear = extractReleaseYear(entry.releaseDate);
              const primaryGenre = entry.genres[0] ?? matchedTheaterMovie?.genre.split(',')[0]?.trim();

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => handleOpenMovieSheet(entry, 'overview')}
                  className={`cine-card-hover group flex min-h-[44px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-left transition-colors hover:border-white/30 ${FOCUS_RING_CLASS}`}
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-[var(--bg-surface)]">
                    {entry.posterSrc && !posterBroken ? (
                      <img
                        src={entry.posterSrc}
                        alt={`Pôster de ${entry.title}`}
                        loading="lazy"
                        onError={() =>
                          setBrokenPosters((prev) => ({ ...prev, [entry.id]: true }))
                        }
                        className="cine-card-media h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-[var(--text-muted)]">
                        <Film className="h-7 w-7" aria-hidden="true" />
                        <span className="line-clamp-3 text-xs font-semibold uppercase tracking-wider">
                          {entry.title}
                        </span>
                      </div>
                    )}

                    {matchedMovie && (
                      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[var(--brand-red)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                        Em Cartaz
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5 p-3">
                    <h2 className="font-display line-clamp-2 break-words text-lg font-bold uppercase leading-tight text-[var(--text-primary)] group-hover:text-white">
                      {entry.title}
                    </h2>
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {[primaryGenre, releaseYear].filter(Boolean).join(' · ') || 'Catálogo CineFood'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-6 sm:flex-row">
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Exibindo {catalogItems.length}{' '}
              {catalogItems.length === 1 ? 'filme' : 'filmes'} · Página {page} de {totalPages}
            </p>

            {page < totalPages && (
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={() => setPage((prev) => prev + 1)}
                className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/20 bg-[var(--bg-elevated)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] transition-colors hover:border-white/40 hover:bg-white/10 disabled:opacity-60 ${FOCUS_RING_CLASS}`}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Carregando mais...</span>
                  </>
                ) : (
                  <span>Carregar mais filmes</span>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
