import type { MovieItem, SessionSlot } from '../data/cinemaData';

export type CatalogSource = 'itunes-api' | 'tmdb-api' | 'fallback';

export interface CatalogLoadResult {
  movies: MovieItem[];
  source: CatalogSource;
  loadedAt: string;
}

export interface FetchMovieCatalogOptions {
  forceRefresh?: boolean;
  timeoutMs?: number;
}

export interface CatalogGenreOption {
  id: string;
  name: string;
}

export interface CatalogExternalRatings {
  imdbScore: string | null;
  imdbVotes?: string | null;
  rottenTomatoes: string | null;
  tmdbScore?: string | null;
  source: 'omdb-api' | 'curated-fallback' | 'unavailable';
}

export interface ClassificationSymbolInfo {
  code: 'L' | '6' | '10' | '12' | '14' | '16' | '18';
  displayCode: string;
  label: string;
  fullDescription: string;
  isAutoClassification: boolean;
  iconSrc: string;
  boxSrc: string;
}

export interface ExtendedCatalogEntry {
  id: string;
  tmdbId?: number;
  imdbId?: string;
  title: string;
  originalTitle?: string;
  synopsis: string;
  genres: string[];
  posterSrc: string;
  backdropSrc: string;
  releaseDate: string;
  runtime?: string;
  advisoryRating?: string;
  director?: string;
  initialRatings?: Partial<CatalogExternalRatings>;
}

export interface ExtendedCatalogPageResult {
  items: ExtendedCatalogEntry[];
  genres: CatalogGenreOption[];
  page: number;
  totalPages: number;
  source: 'tmdb-api' | 'itunes-api' | 'fallback';
}

interface ItunesRssImage {
  label?: string;
}

interface ItunesRssEntry {
  id?: {
    attributes?: {
      'im:id'?: string;
    };
  };
  'im:name'?: { label?: string };
  'im:artist'?: { label?: string };
  summary?: { label?: string };
  'im:image'?: ItunesRssImage[];
  category?: {
    attributes?: {
      label?: string;
      term?: string;
    };
  };
  'im:releaseDate'?: {
    label?: string;
    attributes?: {
      label?: string;
    };
  };
}

interface ItunesRssResponse {
  feed?: {
    entry?: ItunesRssEntry[];
  };
}

interface ItunesTrackItem {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  longDescription?: string;
  shortDescription?: string;
  primaryGenreName?: string;
  contentAdvisoryRating?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  previewUrl?: string;
}

interface ItunesSearchResponse {
  resultCount?: number;
  results?: ItunesTrackItem[];
}

interface TmdbMovieResult {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  genre_ids?: number[];
  vote_average?: number;
}

interface TmdbNowPlayingResponse {
  page?: number;
  total_pages?: number;
  results?: TmdbMovieResult[];
}

interface TmdbGenreListResponse {
  genres?: Array<{ id: number; name: string }>;
}

interface TmdbExternalIdsResponse {
  id?: number;
  imdb_id?: string | null;
}

interface TmdbMovieDetailsResponse {
  id?: number;
  runtime?: number | null;
  release_dates?: {
    results?: Array<{
      iso_3166_1?: string;
      release_dates?: Array<{
        certification?: string;
      }>;
    }>;
  };
  credits?: {
    crew?: Array<{
      job?: string;
      name?: string;
    }>;
  };
}

interface OmdbMovieResponse {
  Response?: string;
  imdbRating?: string;
  imdbVotes?: string;
  Ratings?: Array<{ Source?: string; Value?: string }>;
}

const DEFAULT_TIMEOUT_MS = 8000;
const EXTENDED_PAGE_SIZE = 10;
const ITUNES_TOP_MOVIES_URL = 'https://itunes.apple.com/br/rss/topmovies/limit=25/json';
const ITUNES_LOOKUP_BASE_URL = 'https://itunes.apple.com/lookup';
const ITUNES_SEARCH_URL =
  'https://itunes.apple.com/search?term=cinema&media=movie&entity=movie&country=BR&limit=25';
const ITUNES_BROAD_QUERIES = ['cinema', 'action', 'drama', 'comedy', 'sci-fi'] as const;
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_NOW_PLAYING_URL = `${TMDB_API_BASE_URL}/movie/now_playing`;
const TMDB_POPULAR_URL = `${TMDB_API_BASE_URL}/movie/popular`;
const OMDB_API_BASE_URL = 'https://www.omdbapi.com/';

const TMDB_GENRES_PT_BR: Record<number, string> = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  53: 'Suspense',
  10752: 'Guerra',
  37: 'Faroeste',
};

const ITUNES_GENRE_PT_BR: Record<string, string> = {
  action: 'Ação',
  'action & adventure': 'Ação',
  acao: 'Ação',
  'acao e aventura': 'Ação',
  adventure: 'Aventura',
  aventura: 'Aventura',
  animation: 'Animação',
  animacao: 'Animação',
  comedy: 'Comédia',
  comedia: 'Comédia',
  crime: 'Crime',
  documentary: 'Documentário',
  documentario: 'Documentário',
  drama: 'Drama',
  family: 'Família',
  'kids & family': 'Família',
  familia: 'Família',
  fantasy: 'Fantasia',
  fantasia: 'Fantasia',
  history: 'História',
  historia: 'História',
  horror: 'Terror',
  terror: 'Terror',
  music: 'Música',
  musical: 'Música',
  musica: 'Música',
  mystery: 'Mistério',
  misterio: 'Mistério',
  romance: 'Romance',
  'sci-fi': 'Ficção Científica',
  'sci-fi & fantasy': 'Ficção Científica',
  'science fiction': 'Ficção Científica',
  'ficcao cientifica': 'Ficção Científica',
  suspense: 'Suspense',
  thriller: 'Suspense',
  war: 'Guerra',
  guerra: 'Guerra',
  western: 'Faroeste',
  faroeste: 'Faroeste',
};

const CURATED_DEMO_RATINGS: Record<string, CatalogExternalRatings> = {
  'cidade-ferro': {
    imdbScore: '8.4',
    imdbVotes: '142.800',
    rottenTomatoes: '91%',
    tmdbScore: '8.3',
    source: 'curated-fallback',
  },
  'noturno-esmeralda': {
    imdbScore: '7.9',
    imdbVotes: '88.400',
    rottenTomatoes: '87%',
    tmdbScore: '7.8',
    source: 'curated-fallback',
  },
  'orbita-escarlate': {
    imdbScore: '8.6',
    imdbVotes: '215.300',
    rottenTomatoes: '94%',
    tmdbScore: '8.5',
    source: 'curated-fallback',
  },
  'veredas-da-neblina': {
    imdbScore: '8.1',
    imdbVotes: '54.100',
    rottenTomatoes: '89%',
    tmdbScore: '8.0',
    source: 'curated-fallback',
  },
};

const PT_BR_MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

let sessionCatalogCache: CatalogLoadResult | null = null;
let sessionTmdbGenresCache: CatalogGenreOption[] | null = null;
const sessionExtendedPageCache = new Map<string, ExtendedCatalogPageResult>();
const sessionItunesPoolCache = new Map<string, ExtendedCatalogEntry[]>();
const sessionRatingsCache = new Map<string, CatalogExternalRatings>();
const tmdbScoreById = new Map<number, string>();

/**
 * Clears the in-memory movie catalog cache for the current browser session.
 */
export function clearMovieCatalogCache(): void {
  sessionCatalogCache = null;
  sessionTmdbGenresCache = null;
  sessionExtendedPageCache.clear();
  sessionItunesPoolCache.clear();
  sessionRatingsCache.clear();
  tmdbScoreById.clear();
}

/**
 * Upgrades an iTunes artwork URL (e.g. `100x100bb.jpg` or `115x170bb.png`) to high resolution.
 */
export function upgradeItunesArtwork(
  url: string | undefined,
  size: '600x600bb' | '1000x1000bb' = '600x600bb',
): string {
  if (!url) return '';
  const targetSize = size === '1000x1000bb' ? '2000x3000bb' : '1200x1200bb';
  if (/\/\d+x\d+bb[^/]*$/i.test(url)) {
    return url.replace(/\/\d+x\d+bb[^/]*$/i, `/${targetSize}.jpg`);
  }
  return url;
}

declare global {
  interface ImportMeta {
    readonly env?: Record<string, string | undefined>;
  }
}

function getViteEnvValue(key: string): string | undefined {
  const staticTmdb = import.meta.env?.VITE_TMDB_API_KEY;
  const staticOmdb = import.meta.env?.VITE_OMDB_API_KEY;
  const envBag = import.meta.env;
  const value =
    key === 'VITE_TMDB_API_KEY'
      ? staticTmdb ?? envBag?.[key]
      : key === 'VITE_OMDB_API_KEY'
        ? staticOmdb ?? envBag?.[key]
        : envBag?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timerId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ao consultar catálogo`);
    }
    return (await response.json()) as T;
  } finally {
    globalThis.clearTimeout(timerId);
  }
}

function formatDurationFromMillis(trackTimeMillis: number | undefined, fallback: string): string {
  if (!trackTimeMillis || !Number.isFinite(trackTimeMillis) || trackTimeMillis <= 0) {
    return fallback;
  }
  const totalMinutes = Math.round(trackTimeMillis / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes}min`;
  }
  return `${hours}h ${String(minutes).padStart(2, '0')}min`;
}

function formatAdvisoryRating(rawRating: string | undefined, fallback: string): string {
  if (!rawRating) return fallback;
  const cleaned = rawRating.trim();
  const normalized = cleaned.toUpperCase();
  if (normalized === 'L' || normalized === 'LIVRE' || normalized === 'G') return 'Livre';
  if (/^\d{1,2}$/.test(cleaned)) return `${cleaned} anos`;
  if (normalized === 'PG') return '10 anos';
  if (normalized === 'PG-13') return '12 anos';
  if (normalized === 'R' || normalized === 'NC-17') return '16 anos';
  return cleaned;
}

export function inferAutoClassificationFromGenres(genres: string[], adult?: boolean): string {
  if (adult) return 'A18 · 18 anos';
  const joined = genres.map((g) => g.toLowerCase()).join(' ');
  if (joined.includes('terror') || joined.includes('crime') || joined.includes('guerra')) {
    return 'A16 · 16 anos';
  }
  if (joined.includes('suspense') || joined.includes('misterio') || joined.includes('mistério')) {
    return 'A14 · 14 anos';
  }
  if (
    joined.includes('acao') ||
    joined.includes('ação') ||
    joined.includes('ficcao') ||
    joined.includes('ficção') ||
    joined.includes('drama') ||
    joined.includes('faroeste')
  ) {
    return 'A12 · 12 anos';
  }
  if (joined.includes('aventura') || joined.includes('fantasia') || joined.includes('comedia') || joined.includes('comédia')) {
    return 'A10 · 10 anos';
  }
  if (joined.includes('animacao') || joined.includes('animação') || joined.includes('familia') || joined.includes('família')) {
    return 'AL · Livre';
  }
  return 'A12 · 12 anos';
}

export function resolveClassificationSymbol(
  rawRating?: string,
  genres: string[] = [],
): ClassificationSymbolInfo {
  const effective = (rawRating?.trim() || inferAutoClassificationFromGenres(genres)).toUpperCase();
  const isAuto =
    effective.startsWith('AL') ||
    effective.startsWith('A6') ||
    effective.startsWith('A10') ||
    effective.startsWith('A12') ||
    effective.startsWith('A14') ||
    effective.startsWith('A16') ||
    effective.startsWith('A18') ||
    effective.includes('AUTOCLASSIFICA');

  let code: ClassificationSymbolInfo['code'] = '12';
  if (effective.includes('18')) code = '18';
  else if (effective.includes('16')) code = '16';
  else if (effective.includes('14')) code = '14';
  else if (effective.includes('12')) code = '12';
  else if (effective.includes('10')) code = '10';
  else if (/\bA?6\b/.test(effective)) code = '6';
  else if (effective.includes('LIVRE') || effective === 'L' || effective.startsWith('AL')) code = 'L';

  const displayCode = isAuto ? `A${code}` : code;
  const ageText = code === 'L' ? 'Livre' : `${code} anos`;
  const label = isAuto ? `${displayCode} · ${ageText}` : ageText;
  const fullDescription =
    code === 'L'
      ? isAuto
        ? 'Autoclassificação Livre para todos os públicos'
        : 'Classificação Livre para todos os públicos'
      : isAuto
        ? `Autoclassificação: Não recomendado para menores de ${code} anos`
        : `Não recomendado para menores de ${code} anos`;

  return {
    code,
    displayCode,
    label,
    fullDescription,
    isAutoClassification: isAuto,
    iconSrc: `/assets/classificacao/${isAuto ? `A${code}` : code}_Borda.png`,
    boxSrc: `/assets/classificacao/${code}_Box_Borda.png`,
  };
}

function formatReleaseDatePtBr(rawDate: string | undefined, fallback: string): string {
  if (!rawDate) return fallback;
  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(rawDate.trim());
  if (brMatch) {
    const day = brMatch[1];
    const monthIndex = Number(brMatch[2]) - 1;
    const year = brMatch[3];
    const monthName = PT_BR_MONTHS[monthIndex];
    if (monthName) return `${day} ${monthName} ${year}`;
  }

  const parsed = new Date(rawDate);
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const monthName = PT_BR_MONTHS[parsed.getMonth()];
    const year = parsed.getFullYear();
    if (monthName) return `${day} ${monthName} ${year}`;
  }

  return fallback;
}

function buildTaglineFromSynopsis(synopsis: string, fallback: string): string {
  const cleaned = synopsis.replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  if (firstSentence.length <= 130) {
    return firstSentence;
  }
  return `${firstSentence.slice(0, 127).replace(/\s+\S*$/, '')}...`;
}

const GENERATED_DATES = [
  { dateId: '14-dez', dateLabel: '14 DEZ', dayNumber: '14', monthLabel: 'DEZ', isoDay: '2026-12-14' },
  { dateId: '15-dez', dateLabel: '15 DEZ', dayNumber: '15', monthLabel: 'DEZ', isoDay: '2026-12-15' },
  { dateId: '16-dez', dateLabel: '16 DEZ', dayNumber: '16', monthLabel: 'DEZ', isoDay: '2026-12-16' },
  { dateId: '17-dez', dateLabel: '17 DEZ', dayNumber: '17', monthLabel: 'DEZ', isoDay: '2026-12-17' },
  { dateId: '18-dez', dateLabel: '18 DEZ', dayNumber: '18', monthLabel: 'DEZ', isoDay: '2026-12-18' },
] as const;

const GENERATED_VENUES = [
  { complex: 'CineFood Paulista IMAX', room: 'Sala 01 · IMAX', format: 'IMAX 3D' as const, basePrice: 42 },
  { complex: 'CineFood Jardins Atmos', room: 'Sala 02 · Atmos', format: 'Dolby Atmos' as const, basePrice: 40 },
  { complex: 'CineFood Paulista IMAX', room: 'Sala 03 · Atmos', format: 'Dolby Atmos' as const, basePrice: 40 },
  { complex: 'CineFood Jardins Atmos', room: 'Sala 04', format: '2D' as const, basePrice: 36 },
  { complex: 'CineFood Paulista IMAX', room: 'Sala 05 · VIP', format: 'IMAX 3D' as const, basePrice: 44 },
  { complex: 'CineFood Jardins Atmos', room: 'Sala 06', format: '2D' as const, basePrice: 36 },
] as const;

const GENERATED_SHOWTIMES = [
  '14:20',
  '15:45',
  '16:30',
  '17:50',
  '18:45',
  '19:15',
  '20:00',
  '20:30',
  '21:15',
  '21:40',
  '22:00',
  '22:30',
] as const;

function buildRichSessionsForMovie(
  templateSessions: SessionSlot[],
  movieKey: string,
  index: number,
  reuseOriginalIds: boolean,
): SessionSlot[] {
  const baseCloned = templateSessions.map((session, sIdx) => ({
    ...session,
    id: reuseOriginalIds ? session.id : `${movieKey}-sess-${sIdx + 1}`,
  }));

  // Stagger dates per movie so each date has ~14 movies and different movies lead each date/session
  const dateIndices: number[] = [];
  if (index < 12) {
    dateIndices.push(0); // 14-dez (Hoje): 12 movies in carousel
  }
  // Rotate 3 additional dates per movie across 15-dez..18-dez (and 14-dez for higher indices)
  for (let offset = 0; offset < 3; offset++) {
    const dIdx = (index + offset + 1) % GENERATED_DATES.length;
    if (!dateIndices.includes(dIdx)) {
      dateIndices.push(dIdx);
    }
  }
  dateIndices.sort((a, b) => a - b);

  const generated: SessionSlot[] = reuseOriginalIds ? [...baseCloned] : [];
  const existingKeys = new Set(generated.map((s) => `${s.dateId}-${s.time}-${s.room}`));

  let seq = generated.length + 1;
  for (const dIdx of dateIndices) {
    const dateMeta = GENERATED_DATES[dIdx];
    // Generate 2 sessions per scheduled date across different complexes & formats
    for (let slot = 0; slot < 2; slot++) {
      const venue = GENERATED_VENUES[(index * 2 + dIdx + slot) % GENERATED_VENUES.length];
      const time = GENERATED_SHOWTIMES[(index * 3 + dIdx * 2 + slot * 5) % GENERATED_SHOWTIMES.length];
      const dedupKey = `${dateMeta.dateId}-${time}-${venue.room}`;
      if (existingKeys.has(dedupKey)) continue;
      existingKeys.add(dedupKey);

      generated.push({
        id: `${movieKey}-gen-${seq++}`,
        complex: venue.complex,
        room: venue.room,
        format: venue.format,
        dateId: dateMeta.dateId,
        dateLabel: dateMeta.dateLabel,
        dayNumber: dateMeta.dayNumber,
        monthLabel: dateMeta.monthLabel,
        time,
        startsAt: `${dateMeta.isoDay}T${time}:00-03:00`,
        status: 'ATIVA',
        occupancyPct: 22 + ((index * 13 + dIdx * 9 + slot * 17) % 58),
        basePrice: venue.basePrice,
      });
    }
  }

  return generated.length > 0 ? generated : baseCloned;
}

function buildKickerLocation(sessions: SessionSlot[], fallbackKicker: string): string {
  const primary = sessions[0];
  if (!primary) return fallbackKicker;
  const formattedDay = `${primary.dayNumber} ${primary.monthLabel.charAt(0)}${primary.monthLabel.slice(1).toLowerCase()}`;
  return `${primary.format} · ${formattedDay} · ${primary.time}`;
}

function cloneFallbackMovies(fallbackMovies: MovieItem[]): MovieItem[] {
  return fallbackMovies.map((movie) => ({
    ...movie,
    complexes: [...movie.complexes],
    sessions: movie.sessions.map((session) => ({ ...session })),
  }));
}

function mapTrackToMovieItem(
  item: {
    idSuffix: string;
    title: string;
    director: string;
    synopsis: string;
    genre: string;
    duration: string;
    rating: string;
    premiere: string;
    posterSrc: string;
    backdropSrc: string;
    previewUrl?: string;
    ratingAvg?: number;
  },
  index: number,
  fallbackMovies: MovieItem[],
): MovieItem {
  const template = fallbackMovies[index % fallbackMovies.length];
  const reuseTemplateIdentity = index < 4;
  const movieId = reuseTemplateIdentity ? template.id : `api-${item.idSuffix}-${index + 1}`;
  const sessions = buildRichSessionsForMovie(
    template.sessions,
    movieId,
    index,
    reuseTemplateIdentity,
  );
  const complexes = Array.from(new Set(sessions.map((s) => s.complex)));
  const synopsis = item.synopsis.trim() || template.synopsis;

  return {
    ...template,
    id: movieId,
    indexLabel: String(index + 1).padStart(2, '0'),
    kickerLocation: buildKickerLocation(sessions, template.kickerLocation),
    title: item.title.trim().toUpperCase(),
    tagline: buildTaglineFromSynopsis(synopsis, template.tagline),
    synopsis,
    premiere: item.premiere || template.premiere,
    director: item.director.trim() || template.director,
    genre: item.genre.trim() || template.genre,
    duration: item.duration || template.duration,
    rating: item.rating || template.rating,
    ratingAvg: item.ratingAvg ?? template.ratingAvg,
    complexes: complexes.length > 0 ? complexes : template.complexes,
    posterSrc: item.posterSrc || template.posterSrc,
    backdropSrc: item.backdropSrc || item.posterSrc || template.backdropSrc,
    previewUrl: item.previewUrl || template.previewUrl,
    trailerHighlight: item.previewUrl
      ? `Trailer oficial em vídeo disponível para reprodução instantânea (${sessions[0]?.format ?? 'Cinema'}).`
      : template.trailerHighlight,
    sessions,
  };
}

function extractBrCertificationFromDetails(details: TmdbMovieDetailsResponse | undefined): string | null {
  const brEntry = (details?.release_dates?.results ?? []).find(
    (entry) => entry.iso_3166_1?.toUpperCase() === 'BR',
  );
  if (!brEntry) return null;
  const cert = (brEntry.release_dates ?? [])
    .map((rd) => rd.certification?.trim())
    .find((c): c is string => Boolean(c && c.length > 0));
  if (!cert) return null;
  const normalized = cert.toUpperCase();
  if (normalized === 'L' || normalized === 'LIVRE') return 'Livre';
  if (/^\d{1,2}$/.test(normalized)) return `${normalized} anos`;
  return null;
}

async function fetchFromTmdbApi(
  apiKey: string,
  fallbackMovies: MovieItem[],
  timeoutMs: number,
): Promise<MovieItem[]> {
  const effectiveTimeout = Math.max(timeoutMs, 8000);
  const encodedKey = encodeURIComponent(apiKey);
  const pageUrls = [
    `${TMDB_NOW_PLAYING_URL}?language=pt-BR&region=BR&page=1&api_key=${encodedKey}`,
    `${TMDB_NOW_PLAYING_URL}?language=pt-BR&region=BR&page=2&api_key=${encodedKey}`,
    `${TMDB_POPULAR_URL}?language=pt-BR&region=BR&page=1&api_key=${encodedKey}`,
  ];

  const pageResponses = await Promise.allSettled(
    pageUrls.map((u) => fetchJsonWithTimeout<TmdbNowPlayingResponse>(u, effectiveTimeout)),
  );

  const seenIds = new Set<number>();
  const combinedResults: TmdbMovieResult[] = [];
  for (const res of pageResponses) {
    if (res.status !== 'fulfilled') continue;
    for (const movie of res.value.results ?? []) {
      if (!movie.id || seenIds.has(movie.id)) continue;
      if (!movie.title || (!movie.poster_path && !movie.backdrop_path)) continue;
      seenIds.add(movie.id);
      combinedResults.push(movie);
    }
  }

  if (combinedResults.length === 0) {
    return [];
  }

  const targetCount = Math.max(24, fallbackMovies.length);
  const withWidescreenBackdrop = combinedResults.filter(
    (m) => Boolean(m.poster_path && m.backdrop_path),
  );
  const pool =
    withWidescreenBackdrop.length >= 12 ? withWidescreenBackdrop : combinedResults;
  const selectedMovies = pool.slice(0, targetCount);

  const detailSettled = await Promise.allSettled(
    selectedMovies.map((movie) =>
      fetchJsonWithTimeout<TmdbMovieDetailsResponse>(
        `${TMDB_API_BASE_URL}/movie/${movie.id}?language=pt-BR&append_to_response=release_dates,credits&api_key=${encodedKey}`,
        3500,
      ),
    ),
  );

  return selectedMovies.map((movie, index) => {
    const template = fallbackMovies[index % fallbackMovies.length];
    const detailRes = detailSettled[index];
    const details = detailRes?.status === 'fulfilled' ? detailRes.value : undefined;

    const genres = (movie.genre_ids ?? [])
      .map((gid) => TMDB_GENRES_PT_BR[gid])
      .filter((g): g is string => Boolean(g));
    const posterSrc = movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : template.posterSrc;
    const backdropSrc = movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : template.backdropSrc;

    const brCertification = extractBrCertificationFromDetails(details);
    const resolvedRating = brCertification ?? inferAutoClassificationFromGenres(genres);
    const resolvedDirector =
      details?.credits?.crew?.find((member) => member.job === 'Director')?.name?.trim() ||
      template.director;
    const resolvedDuration =
      typeof details?.runtime === 'number' && details.runtime > 0
        ? formatDurationFromMillis(details.runtime * 60000, template.duration)
        : template.duration;

    if (typeof movie.vote_average === 'number' && movie.vote_average > 0) {
      tmdbScoreById.set(movie.id, movie.vote_average.toFixed(1));
    }

    return mapTrackToMovieItem(
      {
        idSuffix: String(movie.id),
        title: movie.title ?? template.title,
        director: resolvedDirector,
        synopsis: movie.overview ?? template.synopsis,
        genre: genres.length > 0 ? genres.slice(0, 2).join(', ') : template.genre,
        duration: resolvedDuration,
        rating: resolvedRating,
        premiere: formatReleaseDatePtBr(movie.release_date, template.premiere),
        posterSrc,
        backdropSrc,
        ratingAvg:
          typeof movie.vote_average === 'number' && movie.vote_average > 0
            ? Number((movie.vote_average / 2).toFixed(1))
            : template.ratingAvg,
      },
      index,
      fallbackMovies,
    );
  });
}

async function fetchFromItunesApi(
  fallbackMovies: MovieItem[],
  timeoutMs: number,
): Promise<MovieItem[]> {
  const targetCount = Math.max(20, fallbackMovies.length);

  // Primary free public feed: Brazil Top Movies RSS (zero API key required, pt-BR metadata)
  try {
    const rss = await fetchJsonWithTimeout<ItunesRssResponse>(ITUNES_TOP_MOVIES_URL, timeoutMs);
    const entries = (rss.feed?.entry ?? []).slice(0, targetCount);

    if (entries.length > 0) {
      const ids = entries
        .map((entry) => entry.id?.attributes?.['im:id'])
        .filter((id): id is string => Boolean(id));

      const detailsById = new Map<string, ItunesTrackItem>();
      if (ids.length > 0) {
        try {
          const lookupUrl = `${ITUNES_LOOKUP_BASE_URL}?id=${encodeURIComponent(ids.join(','))}&country=BR&lang=pt_br`;
          const lookup = await fetchJsonWithTimeout<ItunesSearchResponse>(lookupUrl, timeoutMs);
          for (const track of lookup.results ?? []) {
            if (track.trackId) {
              detailsById.set(String(track.trackId), track);
            }
          }
        } catch {
          // Enrichment is best-effort; RSS metadata and upgraded artwork remain valid.
        }
      }

      return entries.map((entry, index) => {
        const template = fallbackMovies[index % fallbackMovies.length];
        const imId = entry.id?.attributes?.['im:id'] ?? `rss-${index}`;
        const detail = detailsById.get(imId);
        const rssImageUrl = entry['im:image']?.[entry['im:image'].length - 1]?.label;
        const baseArtwork = detail?.artworkUrl100 ?? detail?.artworkUrl60 ?? rssImageUrl;

        const posterSrc = upgradeItunesArtwork(baseArtwork, '600x600bb') || template.posterSrc;
        const backdropSrc = upgradeItunesArtwork(baseArtwork, '1000x1000bb') || posterSrc;

        return mapTrackToMovieItem(
          {
            idSuffix: imId,
            title: detail?.trackName ?? entry['im:name']?.label ?? template.title,
            director: detail?.artistName ?? entry['im:artist']?.label ?? template.director,
            synopsis: detail?.longDescription ?? detail?.shortDescription ?? entry.summary?.label ?? template.synopsis,
            genre: detail?.primaryGenreName ?? entry.category?.attributes?.label ?? template.genre,
            duration: formatDurationFromMillis(detail?.trackTimeMillis, template.duration),
            rating: formatAdvisoryRating(detail?.contentAdvisoryRating, template.rating),
            premiere: formatReleaseDatePtBr(
              detail?.releaseDate ?? entry['im:releaseDate']?.attributes?.label ?? entry['im:releaseDate']?.label,
              template.premiere,
            ),
            posterSrc,
            backdropSrc,
            previewUrl: detail?.previewUrl,
          },
          index,
          fallbackMovies,
        );
      });
    }
  } catch {
    // Fall through to iTunes Search API endpoint.
  }

  // Fallback query via iTunes Search API (also requires zero API key)
  const search = await fetchJsonWithTimeout<ItunesSearchResponse>(ITUNES_SEARCH_URL, timeoutMs);
  const tracks = (search.results ?? []).filter((t) => Boolean(t.trackName)).slice(0, targetCount);

  return tracks.map((track, index) => {
    const template = fallbackMovies[index % fallbackMovies.length];
    const baseArtwork = track.artworkUrl100 ?? track.artworkUrl60;
    const posterSrc = upgradeItunesArtwork(baseArtwork, '600x600bb') || template.posterSrc;
    const backdropSrc = upgradeItunesArtwork(baseArtwork, '1000x1000bb') || posterSrc;

    return mapTrackToMovieItem(
      {
        idSuffix: String(track.trackId ?? index),
        title: track.trackName ?? template.title,
        director: track.artistName ?? template.director,
        synopsis: track.longDescription ?? track.shortDescription ?? template.synopsis,
        genre: track.primaryGenreName ?? template.genre,
        duration: formatDurationFromMillis(track.trackTimeMillis, template.duration),
        rating: formatAdvisoryRating(track.contentAdvisoryRating, template.rating),
        premiere: formatReleaseDatePtBr(track.releaseDate, template.premiere),
        posterSrc,
        backdropSrc,
        previewUrl: track.previewUrl,
      },
      index,
      fallbackMovies,
    );
  });
}

/**
 * Loads the real-world movie catalog using free public APIs with in-memory session caching,
 * 4s AbortController timeout, and automatic fallback to `fallbackMovies` when offline or blocked.
 */
export async function fetchRealMovieCatalog(
  fallbackMovies: MovieItem[],
  options?: FetchMovieCatalogOptions,
): Promise<CatalogLoadResult> {
  if (!options?.forceRefresh && sessionCatalogCache) {
    return sessionCatalogCache;
  }

  if (fallbackMovies.length === 0) {
    return {
      movies: [],
      source: 'fallback',
      loadedAt: new Date().toISOString(),
    };
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const tmdbKey = getViteEnvValue('VITE_TMDB_API_KEY');

  if (tmdbKey) {
    try {
      const tmdbMovies = await fetchFromTmdbApi(tmdbKey, fallbackMovies, timeoutMs);
      if (tmdbMovies.length > 0) {
        const result: CatalogLoadResult = {
          movies: tmdbMovies,
          source: 'tmdb-api',
          loadedAt: new Date().toISOString(),
        };
        sessionCatalogCache = result;
        return result;
      }
    } catch {
      // Continue to free iTunes API or local fallback.
    }
  }

  try {
    const itunesMovies = await fetchFromItunesApi(fallbackMovies, timeoutMs);
    if (itunesMovies.length > 0) {
      const result: CatalogLoadResult = {
        movies: itunesMovies,
        source: 'itunes-api',
        loadedAt: new Date().toISOString(),
      };
      sessionCatalogCache = result;
      return result;
    }
  } catch {
    // Graceful fallback below.
  }

  const fallbackResult: CatalogLoadResult = {
    movies: cloneFallbackMovies(fallbackMovies),
    source: 'fallback',
    loadedAt: new Date().toISOString(),
  };
  sessionCatalogCache = fallbackResult;
  return fallbackResult;
}

export const fetchMovieCatalog = fetchRealMovieCatalog;

function normalizeCatalogText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyGenre(name: string): string {
  return normalizeCatalogText(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function translateItunesGenre(rawGenre: string | undefined): string {
  if (!rawGenre) return 'Cinema';
  const normalized = normalizeCatalogText(rawGenre);
  return ITUNES_GENRE_PT_BR[normalized] ?? rawGenre.trim();
}

function mapFallbackMovieToExtendedEntry(movie: MovieItem): ExtendedCatalogEntry {
  const genres = movie.genre
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);
  const curated = CURATED_DEMO_RATINGS[movie.id];

  return {
    id: movie.id,
    title: movie.title,
    synopsis: movie.synopsis,
    genres: genres.length > 0 ? genres : ['Cinema'],
    posterSrc: movie.posterSrc,
    backdropSrc: movie.backdropSrc || movie.posterSrc,
    releaseDate: movie.premiere,
    runtime: movie.duration,
    advisoryRating: movie.rating,
    director: movie.director,
    initialRatings: curated
      ? { ...curated }
      : typeof movie.ratingAvg === 'number'
        ? { tmdbScore: (movie.ratingAvg * 2).toFixed(1) }
        : undefined,
  };
}

function mapItunesTrackToExtendedEntry(
  track: ItunesTrackItem,
  index: number,
  fallbackMovies: MovieItem[],
): ExtendedCatalogEntry {
  const fallbackTemplate = fallbackMovies.length > 0 ? fallbackMovies[index % fallbackMovies.length] : undefined;
  const baseArtwork = track.artworkUrl100 ?? track.artworkUrl60;
  const posterSrc = upgradeItunesArtwork(baseArtwork, '600x600bb') || fallbackTemplate?.posterSrc || '';
  const backdropSrc =
    upgradeItunesArtwork(baseArtwork, '1000x1000bb') || posterSrc || fallbackTemplate?.backdropSrc || '';
  const genreName = translateItunesGenre(track.primaryGenreName);
  const runtime = track.trackTimeMillis ? formatDurationFromMillis(track.trackTimeMillis, '') : '';
  const advisoryRating = track.contentAdvisoryRating
    ? formatAdvisoryRating(track.contentAdvisoryRating, '')
    : '';

  return {
    id: `itunes-${track.trackId ?? index}`,
    title: (track.trackName ?? '').trim(),
    synopsis:
      (track.longDescription ?? track.shortDescription ?? '').trim() ||
      'Sinopse disponível no catálogo digital CineFood.',
    genres: genreName ? [genreName] : ['Cinema'],
    posterSrc,
    backdropSrc,
    releaseDate: formatReleaseDatePtBr(track.releaseDate, 'Catálogo Digital'),
    runtime: runtime || undefined,
    advisoryRating: advisoryRating || undefined,
    director: track.artistName?.trim() || undefined,
  };
}

function collectGenreOptions(entries: ExtendedCatalogEntry[]): CatalogGenreOption[] {
  const byId = new Map<string, CatalogGenreOption>();
  for (const entry of entries) {
    for (const genre of entry.genres) {
      const trimmed = genre.trim();
      if (!trimmed) continue;
      const id = slugifyGenre(trimmed);
      if (id && !byId.has(id)) {
        byId.set(id, { id, name: trimmed });
      }
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function matchesExtendedFilters(
  entry: ExtendedCatalogEntry,
  query: string,
  genreId: string,
): boolean {
  if (query) {
    const normalizedQuery = normalizeCatalogText(query);
    const haystack = normalizeCatalogText(
      [entry.title, entry.originalTitle ?? '', entry.synopsis, entry.director ?? '', ...entry.genres].join(' '),
    );
    if (!haystack.includes(normalizedQuery)) {
      return false;
    }
  }

  if (genreId && genreId !== 'all') {
    const normalizedGenreFilter = normalizeCatalogText(genreId);
    const tmdbGenreName = /^\d+$/.test(genreId) ? TMDB_GENRES_PT_BR[Number(genreId)] : undefined;
    const normalizedTmdbName = tmdbGenreName ? normalizeCatalogText(tmdbGenreName) : null;

    const hasGenre = entry.genres.some((genre) => {
      const slug = slugifyGenre(genre);
      const normName = normalizeCatalogText(genre);
      return (
        slug === normalizedGenreFilter ||
        normName === normalizedGenreFilter ||
        (normalizedTmdbName !== null && normName === normalizedTmdbName)
      );
    });
    if (!hasGenre) {
      return false;
    }
  }

  return true;
}

async function fetchTmdbGenres(tmdbKey: string, timeoutMs: number): Promise<CatalogGenreOption[]> {
  if (sessionTmdbGenresCache) {
    return sessionTmdbGenresCache;
  }

  try {
    const url = `${TMDB_API_BASE_URL}/genre/movie/list?language=pt-BR&api_key=${encodeURIComponent(tmdbKey)}`;
    const payload = await fetchJsonWithTimeout<TmdbGenreListResponse>(url, timeoutMs);
    const genres = (payload.genres ?? [])
      .filter((g) => Boolean(g.id && g.name))
      .map((g) => ({ id: String(g.id), name: g.name.trim() }));

    if (genres.length > 0) {
      sessionTmdbGenresCache = genres;
      return genres;
    }
  } catch {
    // Fallback to static pt-BR genre map below.
  }

  return Object.entries(TMDB_GENRES_PT_BR).map(([id, name]) => ({ id, name }));
}

async function fetchExtendedTmdbPage(options: {
  tmdbKey: string;
  page: number;
  pageSize: number;
  query: string;
  genreId: string;
  fallbackMovies: MovieItem[];
  timeoutMs: number;
}): Promise<ExtendedCatalogPageResult> {
  const { tmdbKey, page, pageSize, query, genreId, fallbackMovies, timeoutMs } = options;
  const genres = await fetchTmdbGenres(tmdbKey, timeoutMs);
  const genreNameById = new Map<string, string>(genres.map((g) => [g.id, g.name]));

  const TMDB_NATIVE_PAGE_SIZE = 20;
  const startGlobalIndex = (page - 1) * pageSize;
  const tmdbPage = Math.max(1, Math.floor(startGlobalIndex / TMDB_NATIVE_PAGE_SIZE) + 1);
  const offsetWithinTmdbPage = startGlobalIndex % TMDB_NATIVE_PAGE_SIZE;

  const buildTmdbEndpoint = (targetTmdbPage: number) =>
    query
      ? `${TMDB_API_BASE_URL}/search/movie?language=pt-BR&include_adult=false&query=${encodeURIComponent(query)}&page=${targetTmdbPage}&api_key=${encodeURIComponent(tmdbKey)}`
      : `${TMDB_API_BASE_URL}/discover/movie?language=pt-BR&region=BR&sort_by=popularity.desc&include_adult=false&page=${targetTmdbPage}${
          genreId && genreId !== 'all' ? `&with_genres=${encodeURIComponent(genreId)}` : ''
        }&api_key=${encodeURIComponent(tmdbKey)}`;

  const payload = await fetchJsonWithTimeout<TmdbNowPlayingResponse>(
    buildTmdbEndpoint(tmdbPage),
    timeoutMs,
  );
  let rawPool = [...(payload.results ?? [])];

  // If the slice crosses a 20-item TMDB page boundary, fetch the next TMDB page as well
  if (
    offsetWithinTmdbPage + pageSize > TMDB_NATIVE_PAGE_SIZE &&
    tmdbPage < (payload.total_pages ?? 1)
  ) {
    try {
      const nextPayload = await fetchJsonWithTimeout<TmdbNowPlayingResponse>(
        buildTmdbEndpoint(tmdbPage + 1),
        timeoutMs,
      );
      rawPool.push(...(nextPayload.results ?? []));
    } catch {
      // Best-effort second page fetch
    }
  }

  let results = rawPool.filter((m) =>
    Boolean(m.title && (m.poster_path || m.backdrop_path)),
  );

  // TMDB /search/movie does not filter by with_genres server-side.
  if (query && genreId && genreId !== 'all') {
    const numericGenreId = Number(genreId);
    results = results.filter((movie) => {
      if (Number.isFinite(numericGenreId) && (movie.genre_ids ?? []).includes(numericGenreId)) {
        return true;
      }
      const mappedGenres = (movie.genre_ids ?? [])
        .map((gid) => genreNameById.get(String(gid)) ?? TMDB_GENRES_PT_BR[gid])
        .filter((g): g is string => Boolean(g));
      const normFilter = normalizeCatalogText(genreId);
      return mappedGenres.some(
        (g) => slugifyGenre(g) === normFilter || normalizeCatalogText(g) === normFilter,
      );
    });
  }

  const slicedResults = results.slice(offsetWithinTmdbPage, offsetWithinTmdbPage + pageSize);

  const items: ExtendedCatalogEntry[] = slicedResults.map((movie, index) => {
    const template = fallbackMovies.length > 0 ? fallbackMovies[index % fallbackMovies.length] : undefined;
    const posterSrc = movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : movie.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
        : (template?.posterSrc ?? '');
    const backdropSrc = movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : (template?.backdropSrc ?? posterSrc);
    const mappedGenres = (movie.genre_ids ?? [])
      .map((gid) => genreNameById.get(String(gid)) ?? TMDB_GENRES_PT_BR[gid])
      .filter((g): g is string => Boolean(g));
    const tmdbScore =
      typeof movie.vote_average === 'number' && movie.vote_average > 0
        ? movie.vote_average.toFixed(1)
        : undefined;
    if (tmdbScore) {
      tmdbScoreById.set(movie.id, tmdbScore);
    }

    return {
      id: `tmdb-${movie.id}`,
      tmdbId: movie.id,
      title: (movie.title ?? '').trim(),
      originalTitle: movie.original_title?.trim() || undefined,
      synopsis: (movie.overview ?? '').trim() || 'Sinopse indisponível no momento.',
      genres: mappedGenres.length > 0 ? mappedGenres : ['Cinema'],
      posterSrc,
      backdropSrc,
      releaseDate: formatReleaseDatePtBr(movie.release_date, movie.release_date ?? 'Em breve'),
      advisoryRating: inferAutoClassificationFromGenres(mappedGenres),
      initialRatings: tmdbScore ? { tmdbScore } : undefined,
    };
  });

  if (!query && !genreId && items.length === 0) {
    throw new Error('TMDB returned empty catalog');
  }

  const rawTotalPages = Math.ceil(
    ((payload.total_pages ?? 1) * TMDB_NATIVE_PAGE_SIZE) / pageSize,
  );

  return {
    items,
    genres,
    page,
    totalPages: Math.min(500, Math.max(1, rawTotalPages)),
    source: 'tmdb-api',
  };
}

async function fetchExtendedItunesPool(
  query: string,
  fallbackMovies: MovieItem[],
  timeoutMs: number,
): Promise<ExtendedCatalogEntry[]> {
  const poolKey = query ? `search:${normalizeCatalogText(query)}` : 'discover';
  const cached = sessionItunesPoolCache.get(poolKey);
  if (cached) {
    return cached;
  }

  const urls = query
    ? [
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=movie&entity=movie&country=BR&lang=pt_br&limit=25`,
      ]
    : ITUNES_BROAD_QUERIES.map(
        (term) =>
          `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=movie&entity=movie&country=BR&lang=pt_br&limit=10`,
      );

  const settled = await Promise.allSettled(
    urls.map((url) => fetchJsonWithTimeout<ItunesSearchResponse>(url, timeoutMs)),
  );

  const fulfilled = settled.filter(
    (res): res is PromiseFulfilledResult<ItunesSearchResponse> => res.status === 'fulfilled',
  );
  if (fulfilled.length === 0) {
    throw new Error('All iTunes catalog queries failed');
  }

  const seenTrackIds = new Set<number>();
  const seenTitles = new Set<string>();
  const entries: ExtendedCatalogEntry[] = [];
  let runningIndex = 0;

  for (const res of fulfilled) {
    for (const track of res.value.results ?? []) {
      if (!track.trackName || !(track.artworkUrl100 || track.artworkUrl60)) {
        continue;
      }
      if (typeof track.trackId === 'number' && seenTrackIds.has(track.trackId)) {
        continue;
      }
      const normTitle = normalizeCatalogText(track.trackName);
      if (!normTitle || seenTitles.has(normTitle)) {
        continue;
      }
      if (typeof track.trackId === 'number') {
        seenTrackIds.add(track.trackId);
      }
      seenTitles.add(normTitle);
      entries.push(mapItunesTrackToExtendedEntry(track, runningIndex, fallbackMovies));
      runningIndex += 1;
    }
  }

  sessionItunesPoolCache.set(poolKey, entries);
  return entries;
}

/**
 * Loads a paginated, searchable and genre-filterable catalog page using TMDB when configured,
 * falling back seamlessly to broadened keyless iTunes Search queries + local `fallbackMovies`.
 */
export async function fetchExtendedCatalogPage(options: {
  page?: number;
  pageSize?: number;
  query?: string;
  genreId?: string;
  fallbackMovies: MovieItem[];
  timeoutMs?: number;
}): Promise<ExtendedCatalogPageResult> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.max(4, Math.min(40, Math.floor(options.pageSize ?? EXTENDED_PAGE_SIZE)));
  const query = options.query?.trim() ?? '';
  const genreId = options.genreId?.trim() ?? '';
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fallbackMovies = options.fallbackMovies ?? [];

  const cacheKey = `${page}|${pageSize}|${normalizeCatalogText(query)}|${normalizeCatalogText(genreId)}|${fallbackMovies.length}`;
  const cachedPage = sessionExtendedPageCache.get(cacheKey);
  if (cachedPage) {
    return cachedPage;
  }

  const tmdbKey = getViteEnvValue('VITE_TMDB_API_KEY');
  if (tmdbKey) {
    try {
      const tmdbResult = await fetchExtendedTmdbPage({
        tmdbKey,
        page,
        pageSize,
        query,
        genreId,
        fallbackMovies,
        timeoutMs,
      });
      sessionExtendedPageCache.set(cacheKey, tmdbResult);
      return tmdbResult;
    } catch {
      // Fall through to keyless iTunes Search + local fallback.
    }
  }

  const fallbackEntries = fallbackMovies.map(mapFallbackMovieToExtendedEntry);

  try {
    const itunesEntries = await fetchExtendedItunesPool(query, fallbackMovies, timeoutMs);
    const seenTitles = new Set<string>(
      fallbackEntries.map((entry) => normalizeCatalogText(entry.title)),
    );
    const dedupedItunes = itunesEntries.filter((entry) => {
      const normTitle = normalizeCatalogText(entry.title);
      if (!normTitle || seenTitles.has(normTitle)) {
        return false;
      }
      seenTitles.add(normTitle);
      return true;
    });

    const combinedPool = [...fallbackEntries, ...dedupedItunes];
    const genres = collectGenreOptions(combinedPool);
    const filtered = combinedPool.filter((entry) => matchesExtendedFilters(entry, query, genreId));
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const start = (page - 1) * pageSize;
    const result: ExtendedCatalogPageResult = {
      items: filtered.slice(start, start + pageSize),
      genres,
      page,
      totalPages,
      source: 'itunes-api',
    };
    sessionExtendedPageCache.set(cacheKey, result);
    return result;
  } catch {
    // Final offline fallback to local curated movies.
  }

  const genres = collectGenreOptions(fallbackEntries);
  const filteredFallback = fallbackEntries.filter((entry) =>
    matchesExtendedFilters(entry, query, genreId),
  );
  const totalPages = Math.max(1, Math.ceil(filteredFallback.length / pageSize));
  const start = (page - 1) * pageSize;

  const offlineResult: ExtendedCatalogPageResult = {
    items: filteredFallback.slice(start, start + pageSize),
    genres,
    page,
    totalPages,
    source: 'fallback',
  };
  sessionExtendedPageCache.set(cacheKey, offlineResult);
  return offlineResult;
}

/**
 * Fetches on-demand IMDb & Rotten Tomatoes ratings for a selected movie via TMDB external IDs + OMDb API,
 * using session caching, curated demo ratings for local titles, and graceful `"unavailable"` fallback.
 */
export async function fetchMovieExternalRatings(
  entry: { id: string; tmdbId?: number; imdbId?: string; title: string; year?: string },
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<CatalogExternalRatings> {
  const curated = CURATED_DEMO_RATINGS[entry.id];
  if (curated) {
    return { ...curated };
  }

  const cacheKey = `${entry.id}|${entry.imdbId ?? ''}|${entry.tmdbId ?? ''}|${normalizeCatalogText(entry.title)}`;
  const cached = sessionRatingsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const extractedTmdbMatch = /^(?:tmdb|api)-(\d+)/.exec(entry.id);
  const resolvedTmdbId =
    typeof entry.tmdbId === 'number'
      ? entry.tmdbId
      : extractedTmdbMatch
        ? Number(extractedTmdbMatch[1])
        : undefined;

  const knownTmdbScore =
    typeof resolvedTmdbId === 'number' && Number.isFinite(resolvedTmdbId)
      ? (tmdbScoreById.get(resolvedTmdbId) ?? null)
      : null;

  const unavailableResult: CatalogExternalRatings = {
    imdbScore: null,
    imdbVotes: null,
    rottenTomatoes: null,
    tmdbScore: knownTmdbScore,
    source: 'unavailable',
  };

  const omdbKey = getViteEnvValue('VITE_OMDB_API_KEY');
  if (!omdbKey) {
    sessionRatingsCache.set(cacheKey, unavailableResult);
    return unavailableResult;
  }

  try {
    let resolvedImdbId = entry.imdbId?.trim();
    const tmdbKey = getViteEnvValue('VITE_TMDB_API_KEY');

    if (!resolvedImdbId && typeof resolvedTmdbId === 'number' && tmdbKey) {
      try {
        const externalUrl = `${TMDB_API_BASE_URL}/movie/${resolvedTmdbId}/external_ids?api_key=${encodeURIComponent(tmdbKey)}`;
        const externalIds = await fetchJsonWithTimeout<TmdbExternalIdsResponse>(externalUrl, timeoutMs);
        if (externalIds.imdb_id && externalIds.imdb_id.trim().length > 0) {
          resolvedImdbId = externalIds.imdb_id.trim();
        }
      } catch {
        // Fallback to OMDb title lookup below.
      }
    }

    const omdbUrl = resolvedImdbId
      ? `${OMDB_API_BASE_URL}?i=${encodeURIComponent(resolvedImdbId)}&apikey=${encodeURIComponent(omdbKey)}`
      : `${OMDB_API_BASE_URL}?t=${encodeURIComponent(entry.title.trim())}${
          entry.year ? `&y=${encodeURIComponent(entry.year.trim())}` : ''
        }&apikey=${encodeURIComponent(omdbKey)}`;

    const omdb = await fetchJsonWithTimeout<OmdbMovieResponse>(omdbUrl, timeoutMs);
    if (omdb.Response === 'False') {
      sessionRatingsCache.set(cacheKey, unavailableResult);
      return unavailableResult;
    }

    const imdbScore = omdb.imdbRating && omdb.imdbRating !== 'N/A' ? omdb.imdbRating.trim() : null;
    const imdbVotes = omdb.imdbVotes && omdb.imdbVotes !== 'N/A' ? omdb.imdbVotes.trim() : null;
    const rtEntry = (omdb.Ratings ?? []).find((r) => r.Source === 'Rotten Tomatoes');
    const rottenTomatoes = rtEntry?.Value && rtEntry.Value !== 'N/A' ? rtEntry.Value.trim() : null;

    const result: CatalogExternalRatings =
      imdbScore || rottenTomatoes
        ? {
            imdbScore,
            imdbVotes,
            rottenTomatoes,
            tmdbScore: knownTmdbScore,
            source: 'omdb-api',
          }
        : unavailableResult;

    sessionRatingsCache.set(cacheKey, result);
    return result;
  } catch {
    return unavailableResult;
  }
}
