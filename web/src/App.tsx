import { useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'motion/react';
import {
  buildSeatMap,
  CANTEEN_ITEMS,
  CanteenItem,
  CanteenOrderStatus,
  ClientTicketOrder,
  CommunityReviewItem,
  COMPLEX_OPTIONS,
  CustomerUser,
  DATE_OPTIONS,
  DEMO_BUYER,
  GateScanRecord,
  INITIAL_COMMUNITY_REVIEWS,
  INITIAL_CUSTOMER,
  INITIAL_INCIDENTS,
  INITIAL_LGPD_REQUESTS,
  INITIAL_NOTICES,
  INITIAL_ORDERS,
  InternalNoticeItem,
  isCdcCancelEligible,
  LgpdRequestItem,
  LgpdRequestType,
  MeiaCategory,
  MovieItem,
  MOVIES,
  RunnerIncident,
  SeatNode,
  SeatQrToken,
  SelectedSeat,
  SessionSlot,
  SessionStatus,
  STAFF_PROFILES,
  StaffRoleGroup,
  TicketTier,
} from './data/cinemaData';
import { CatalogSource, fetchRealMovieCatalog } from './services/movieCatalogApi';
import { AppStep, Header } from './components/Header';
import { CatalogFormatFilter, HeroCatalogView } from './components/HeroCatalogView';
import { MovieDetailView } from './components/MovieDetailView';
import { SeatSelectionView } from './components/SeatSelectionView';
import { CanteenCatalogView } from './components/CanteenCatalogView';
import { CanteenSheet, CartComboLine, DeliveryMode } from './components/CanteenSheet';
import { CheckoutView } from './components/CheckoutView';
import { TicketPassView } from './components/TicketPassView';
import { CommunityReviewsView } from './components/CommunityReviewsView';
import { AuthView } from './components/AuthView';
import { ClientOrdersView } from './components/ClientOrdersView';
import { OpsTab, OpsWorkspace } from './components/OpsWorkspace';

function formatNowPtBr(): string {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAuthorDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Cliente CineFood';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function parseCanteenSummaryQuantities(
  summary: string | null,
  catalog: CanteenItem[],
): { itemId: string; quantity: number }[] {
  if (!summary) return [];
  const entries = summary.split(',').map((s) => s.trim());
  const parsed: { itemId: string; quantity: number }[] = [];
  for (const entry of entries) {
    const match = /^(\d+)×\s*(.+)$/.exec(entry);
    if (!match) continue;
    const quantity = Number.parseInt(match[1], 10);
    const name = match[2].trim().toLowerCase();
    const item = catalog.find((c) => c.name.trim().toLowerCase() === name);
    if (item && quantity > 0) {
      parsed.push({ itemId: item.id, quantity });
    }
  }
  return parsed;
}

export function App() {
  const [step, setStep] = useState<AppStep>(() =>
    typeof window !== 'undefined' && window.location.hash.startsWith('#/ops') ? 'ops' : 'home',
  );
  const [oledMode, setOledMode] = useState(false);

  const [browseMode, setBrowseMode] = useState<'filme' | 'complexo'>('filme');
  const [selectedComplex, setSelectedComplex] = useState(COMPLEX_OPTIONS[0]);
  const [selectedDateId, setSelectedDateId] = useState(DATE_OPTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<CatalogFormatFilter>('Todos');

  const [moviesCatalog, setMoviesCatalog] = useState<MovieItem[]>(MOVIES);
  const [catalogSource, setCatalogSource] = useState<CatalogSource>('fallback');
  const [canteenCatalog, setCanteenCatalog] = useState<CanteenItem[]>(CANTEEN_ITEMS);

  useEffect(() => {
    let cancelled = false;
    fetchRealMovieCatalog(MOVIES)
      .then((result) => {
        if (cancelled) return;
        if (result.movies.length > 0) {
          setMoviesCatalog(result.movies);
        }
        setCatalogSource(result.source);
      })
      .catch(() => {
        if (!cancelled) setCatalogSource('fallback');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [activeMovieIndex, setActiveMovieIndex] = useState(0);
  const [overrideMovieId, setOverrideMovieId] = useState<string | null>(null);
  const filteredMovies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return moviesCatalog.filter((movie) => {
      const complexFilterActive =
        browseMode === 'complexo' && selectedComplex !== COMPLEX_OPTIONS[0];
      if (complexFilterActive && !movie.complexes.includes(selectedComplex)) {
        return false;
      }

      const matchingDateSessions = movie.sessions.filter(
        (s) =>
          s.dateId === selectedDateId &&
          (!complexFilterActive || s.complex === selectedComplex),
      );
      if (matchingDateSessions.length === 0) {
        return false;
      }

      if (formatFilter !== 'Todos' && !matchingDateSessions.some((s) => s.format === formatFilter)) {
        return false;
      }

      if (q) {
        const haystack = `${movie.title} ${movie.genre} ${movie.director}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [moviesCatalog, browseMode, selectedComplex, selectedDateId, formatFilter, searchQuery]);

  const activeMovie = useMemo(() => {
    if (overrideMovieId) {
      const matched = moviesCatalog.find((m) => m.id === overrideMovieId);
      if (matched) return matched;
    }
    return filteredMovies.length > 0
      ? filteredMovies[activeMovieIndex % filteredMovies.length]
      : moviesCatalog[0];
  }, [overrideMovieId, moviesCatalog, filteredMovies, activeMovieIndex]);

  const findFilteredSession = (movie: MovieItem, explicitSession?: SessionSlot): SessionSlot => {
    if (explicitSession) return explicitSession;
    const complexFilterActive =
      browseMode === 'complexo' && selectedComplex !== COMPLEX_OPTIONS[0];
    const matching = movie.sessions.filter((s) => {
      if (s.dateId !== selectedDateId) return false;
      if (formatFilter !== 'Todos' && s.format !== formatFilter) return false;
      if (complexFilterActive && s.complex !== selectedComplex) return false;
      return true;
    });
    return (
      matching.find((s) => s.status === 'ATIVA') ??
      matching[0] ??
      movie.sessions.find((s) => s.dateId === selectedDateId && s.status === 'ATIVA') ??
      movie.sessions.find((s) => s.status === 'ATIVA') ??
      movie.sessions[0]
    );
  };

  const [selectedSession, setSelectedSession] = useState<SessionSlot>(moviesCatalog[0].sessions[0]);

  useEffect(() => {
    const stillExistsOnMovie = activeMovie.sessions.some((s) => s.id === selectedSession.id);
    if (step === 'home' || !stillExistsOnMovie) {
      setSelectedSession(findFilteredSession(activeMovie));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMovie, selectedDateId, formatFilter, browseMode, selectedComplex]);

  const [occupiedBySession, setOccupiedBySession] = useState<Record<string, string[]>>({});
  const [orders, setOrders] = useState<ClientTicketOrder[]>(INITIAL_ORDERS);

  const seatMap = useMemo(() => {
    const base = buildSeatMap(selectedSession.id, selectedSession.occupancyPct);
    const extraOccupied = new Set<string>(occupiedBySession[selectedSession.id] ?? []);

    for (const order of orders) {
      if (order.status === 'CANCELADO' || order.orderKind === 'canteen-only') continue;
      const orderSessionId = (order as { sessionId?: string }).sessionId;
      const sameSession = orderSessionId
        ? orderSessionId === selectedSession.id
        : order.movieId === activeMovie.id &&
          order.time === selectedSession.time &&
          order.dateLabel === selectedSession.dateLabel &&
          order.room === selectedSession.room;
      if (sameSession) {
        order.seatsLabel.forEach((seatId) => extraOccupied.add(seatId));
      }
    }

    return base.map((seat) =>
      extraOccupied.has(seat.id) && seat.status === 'available'
        ? { ...seat, status: 'occupied' as const }
        : seat,
    );
  }, [selectedSession, activeMovie.id, occupiedBySession, orders]);

  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(600);

  const [canteenOpen, setCanteenOpen] = useState(false);
  const [canteenOnlyMode, setCanteenOnlyMode] = useState(false);
  const [cart, setCart] = useState<CartComboLine[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('seat');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(INITIAL_CUSTOMER);
  const [marketingUpdatedAt, setMarketingUpdatedAt] = useState<string | null>(null);
  const [notices, setNotices] = useState<InternalNoticeItem[]>(INITIAL_NOTICES);
  const [communityReviews, setCommunityReviews] = useState<CommunityReviewItem[]>(
    INITIAL_COMMUNITY_REVIEWS,
  );
  const [reviewsMovieFilter, setReviewsMovieFilter] = useState<string | undefined>(undefined);
  const [reviewsSubTab, setReviewsSubTab] = useState<'overview' | 'comments'>('overview');
  const [reviewsViewKey, setReviewsViewKey] = useState(0);
  const [savedMovieIds, setSavedMovieIds] = useState<string[]>([]);
  const [lgpdRequests, setLgpdRequests] = useState<LgpdRequestItem[]>(INITIAL_LGPD_REQUESTS);

  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [orderSessionIdMap, setOrderSessionIdMap] = useState<Record<string, string>>({});
  const [orderCartItemsMap, setOrderCartItemsMap] = useState<
    Record<string, { itemId: string; quantity: number }[]>
  >({});

  const [staffRole, setStaffRole] = useState<StaffRoleGroup>('ADMIN_CINEMA');
  const [opsAuthenticated, setOpsAuthenticated] = useState(false);
  const [opsTab, setOpsTab] = useState<OpsTab>('admin');
  const [scanLog, setScanLog] = useState<GateScanRecord[]>([]);
  const [incidents, setIncidents] = useState<RunnerIncident[]>(INITIAL_INCIDENTS);

  const effectiveBuyer = currentUser
    ? { name: currentUser.name, email: currentUser.email }
    : DEMO_BUYER;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', oledMode ? 'oled' : 'dark');
  }, [oledMode]);

  useEffect(() => {
    const syncFromHash = () => {
      if (window.location.hash.startsWith('#/ops')) {
        setStep('ops');
      } else if (step === 'ops') {
        setStep('home');
      }
    };
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [step]);

  const syncHashForStep = (next: AppStep) => {
    if (typeof window !== 'undefined') {
      const targetHash = next === 'ops' ? '#/ops' : '#/';
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    }
  };

  const navigateStep = (next: AppStep) => {
    if (next === 'home') {
      setOverrideMovieId(null);
    }
    if (next === 'seats') {
      setCanteenOnlyMode(false);
      if (!selectedSession) {
        setSelectedSession(findFilteredSession(activeMovie));
      }
    }
    if (next === 'reviews') {
      setReviewsMovieFilter(undefined);
      setReviewsSubTab('overview');
      setReviewsViewKey((k) => k + 1);
    }
    setStep(next);
    syncHashForStep(next);
  };

  const handleSelectStaffRole = (role: StaffRoleGroup) => {
    setStaffRole(role);
    const profile = STAFF_PROFILES.find((p) => p.role === role);
    if (profile && !profile.allowedTabs.includes(opsTab)) {
      setOpsTab(profile.defaultTab);
    }
  };

  const handleAuthenticateOps = (role: StaffRoleGroup, _pin: string) => {
    setOpsAuthenticated(true);
    setStaffRole(role);
    const profile = STAFF_PROFILES.find((p) => p.role === role);
    if (profile) {
      setOpsTab(profile.defaultTab);
    }
  };

  const handleLogoutOps = () => {
    setOpsAuthenticated(false);
  };

  useEffect(() => {
    if (selectedSeats.length === 0) return undefined;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [selectedSeats.length]);

  const handleToggleSeat = (seat: SeatNode) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.seatId === seat.id);
      if (exists) {
        return prev.filter((s) => s.seatId !== seat.id);
      }
      if (prev.length === 0) setSecondsLeft(600);
      return [
        ...prev,
        {
          seatId: seat.id,
          row: seat.row,
          col: seat.col,
          category: seat.category,
          tier: 'inteira',
        },
      ];
    });
  };

  const handleChangeTier = (seatId: string, tier: TicketTier) => {
    setSelectedSeats((prev) =>
      prev.map((s) =>
        s.seatId === seatId
          ? {
              ...s,
              tier,
              meiaCategory: tier === 'meia' ? s.meiaCategory ?? 'estudante' : s.meiaCategory,
            }
          : s,
      ),
    );
  };

  const handleChangeMeiaDetails = (seatId: string, meiaCategory: MeiaCategory, meiaDoc: string) => {
    setSelectedSeats((prev) =>
      prev.map((s) => (s.seatId === seatId ? { ...s, meiaCategory, meiaDoc } : s)),
    );
  };

  const handleRemoveSeat = (seatId: string) => {
    setSelectedSeats((prev) => prev.filter((s) => s.seatId !== seatId));
  };

  const handleUpdateComboQty = (item: CanteenItem, delta: number) => {
    const liveItem = canteenCatalog.find((c) => c.id === item.id) ?? item;
    setCart((prev) => {
      const existing = prev.find((line) => line.item.id === liveItem.id);
      if (!existing && delta > 0) {
        if (liveItem.stock <= 0) return prev;
        return [...prev, { item: liveItem, quantity: 1, selectedAddonIds: [] }];
      }
      if (!existing) return prev;
      const nextQty = Math.min(liveItem.stock, existing.quantity + delta);
      if (nextQty <= 0) {
        return prev.filter((line) => line.item.id !== liveItem.id);
      }
      return prev.map((line) =>
        line.item.id === liveItem.id ? { ...line, item: liveItem, quantity: nextQty } : line,
      );
    });
  };

  const handleUpdateComboQtyById = (itemId: string, delta: number) => {
    const item = canteenCatalog.find((c) => c.id === itemId);
    if (!item) return;
    handleUpdateComboQty(item, delta);
  };

  const handleToggleAddon = (itemId: string, addonId: string) => {
    setCart((prev) =>
      prev.map((line) => {
        if (line.item.id !== itemId) return line;
        const has = line.selectedAddonIds.includes(addonId);
        return {
          ...line,
          selectedAddonIds: has
            ? line.selectedAddonIds.filter((id) => id !== addonId)
            : [...line.selectedAddonIds, addonId],
        };
      }),
    );
  };

  const canteenCatalogCart = useMemo(() => {
    const map: Record<string, { qty: number; addons: string[] }> = {};
    for (const line of cart) {
      map[line.item.id] = { qty: line.quantity, addons: line.selectedAddonIds };
    }
    return map;
  }, [cart]);

  const openSeatsForMovie = (movie = activeMovie, session?: SessionSlot) => {
    const resolvedSession = findFilteredSession(movie, session);
    const idx = filteredMovies.findIndex((m) => m.id === movie.id);
    if (idx >= 0) setActiveMovieIndex(idx);
    setOverrideMovieId(movie.id);
    if (selectedSession.id !== resolvedSession.id) {
      setSelectedSeats([]);
    }
    setCanteenOnlyMode(false);
    setSelectedSession(resolvedSession);
    setStep('seats');
  };

  const clearCatalogFilters = () => {
    setSelectedComplex(COMPLEX_OPTIONS[0]);
    setSelectedDateId(DATE_OPTIONS[0].id);
    setSearchQuery('');
    setFormatFilter('Todos');
    setOverrideMovieId(null);
    setActiveMovieIndex(0);
  };

  const deductCanteenStock = (lines: CartComboLine[]) => {
    if (lines.length === 0) return;
    setCanteenCatalog((prev) =>
      prev.map((item) => {
        const line = lines.find((l) => l.item.id === item.id);
        if (!line) return item;
        return { ...item, stock: Math.max(0, item.stock - line.quantity) };
      }),
    );
  };

  const handleCreateOrderFromCheckout = (method: 'pix' | 'card') => {
    setPaymentMethod(method);
    const canteenSum = cart.reduce((acc, line) => {
      const addonsSum = line.item.addons
        .filter((a) => line.selectedAddonIds.includes(a.id))
        .reduce((s, a) => s + a.price, 0);
      return acc + (line.item.price + addonsSum) * line.quantity;
    }, 0);

    const orderNum = 8500 + orders.length;
    const nowIso = new Date().toISOString();
    const cartSnapshot = cart.map((l) => ({ itemId: l.item.id, quantity: l.quantity }));
    const canteenSummary =
      cart.length > 0 ? cart.map((l) => `${l.quantity}× ${l.item.name}`).join(', ') : null;

    if (canteenOnlyMode || selectedSeats.length === 0) {
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      const newOrder: ClientTicketOrder = {
        id: `ORD-${orderNum}`,
        userId: currentUser?.id ?? 'usr-guest',
        qrToken: `CF-CNT-${orderNum}-${rand}`,
        seatQrTokens: [],
        orderKind: 'canteen-only',
        movieId: 'canteen-only',
        movieTitle: 'Retirada na Cantina',
        posterSrc: cart[0]?.item.imageSrc ?? canteenCatalog[0]?.imageSrc ?? '/assets/combo-cinema.jpg',
        complex:
          selectedComplex !== COMPLEX_OPTIONS[0] ? selectedComplex : 'CineFood Paulista IMAX',
        room: 'Balcão Cantina',
        format: 'Cantina Express',
        dateLabel: DATE_OPTIONS.find((d) => d.id === selectedDateId)?.label ?? 'Hoje',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        seatsLabel: [],
        totalAmount: canteenSum,
        paymentMethod: method,
        salesChannel: 'web',
        purchasedAt: nowIso,
        status: 'ATIVO',
        canteenSummary,
        canteenStatus: 'EM_PREPARO',
        deliveryMode: 'counter',
        hoursUntilSession: 0,
        checkedIn: false,
        sessionEnded: false,
      };
      deductCanteenStock(cart);
      setOrderCartItemsMap((prev) => ({ ...prev, [newOrder.id]: cartSnapshot }));
      setOrders((prev) => [newOrder, ...prev]);
      setLastOrderId(newOrder.id);
      setSelectedSeats([]);
      setCart([]);
      setSecondsLeft(0);
      setCanteenOnlyMode(false);
      setStep('ticket');
      return;
    }

    const ticketsSum = selectedSeats.reduce(
      (sum, s) =>
        sum + (s.tier === 'meia' ? selectedSession.basePrice * 0.5 : selectedSession.basePrice),
      0,
    );
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const firstMeia = selectedSeats.find((s) => s.tier === 'meia');
    const seatQrTokens: SeatQrToken[] = selectedSeats.map((seat) => ({
      seatId: seat.seatId,
      qrToken: `CF-QR-${orderNum}-${seat.seatId}-${rand}`,
      status: 'ATIVO',
    }));

    const newOrder: ClientTicketOrder = {
      id: `ORD-${orderNum}`,
      userId: currentUser?.id ?? 'usr-guest',
      qrToken: `CF-QR-${orderNum}-${activeMovie.id.slice(0, 2).toUpperCase()}`,
      seatQrTokens,
      orderKind: 'ticket',
      movieId: activeMovie.id,
      movieTitle: activeMovie.title,
      posterSrc: activeMovie.posterSrc,
      complex: selectedSession.complex,
      room: selectedSession.room,
      format: selectedSession.format,
      dateLabel: selectedSession.dateLabel,
      time: selectedSession.time,
      seatsLabel: selectedSeats.map((s) => s.seatId),
      totalAmount: ticketsSum + canteenSum,
      paymentMethod: method,
      salesChannel: 'web',
      meiaCategory: firstMeia?.meiaCategory,
      meiaDoc: firstMeia?.meiaDoc,
      purchasedAt: nowIso,
      status: 'ATIVO',
      canteenSummary,
      canteenStatus:
        cart.length > 0
          ? deliveryMode === 'seat'
            ? 'AGUARDANDO_CHEGADA'
            : 'EM_PREPARO'
          : 'NENHUM',
      deliveryMode,
      hoursUntilSession: 5.0,
      checkedIn: false,
      sessionEnded: false,
    };

    deductCanteenStock(cart);
    setOccupiedBySession((prev) => {
      const currentSeats = new Set(prev[selectedSession.id] ?? []);
      selectedSeats.forEach((s) => currentSeats.add(s.seatId));
      return { ...prev, [selectedSession.id]: Array.from(currentSeats) };
    });
    setOrderSessionIdMap((prev) => ({ ...prev, [newOrder.id]: selectedSession.id }));
    setOrderCartItemsMap((prev) => ({ ...prev, [newOrder.id]: cartSnapshot }));
    setOrders((prev) => [newOrder, ...prev]);
    setLastOrderId(newOrder.id);
    setSelectedSeats([]);
    setCart([]);
    setSecondsLeft(0);
    setCanteenOnlyMode(false);
    setStep('ticket');
  };

  const handleLatePixRefund = () => {
    const notice: InternalNoticeItem = {
      id: `not-${Date.now()}`,
      userId: currentUser?.id ?? 'usr-guest',
      title: 'Estorno automático por Pix Tardio (RN-01)',
      message:
        'O pagamento Pix foi confirmado após o vencimento do bloqueio temporário de 10 minutos. Seus assentos foram liberados e o estorno integral foi processado automaticamente.',
      type: 'refund',
      createdAt: formatNowPtBr(),
      read: false,
    };
    setNotices((prev) => [notice, ...prev]);
  };

  const findSessionForOrder = (
    order: ClientTicketOrder,
  ): { movie: MovieItem; session: SessionSlot } | undefined => {
    const mappedSessionId = orderSessionIdMap[order.id] ?? (order as { sessionId?: string }).sessionId;
    if (mappedSessionId) {
      for (const movie of moviesCatalog) {
        const session = movie.sessions.find((s) => s.id === mappedSessionId);
        if (session) return { movie, session };
      }
    }
    for (const movie of moviesCatalog) {
      const session = movie.sessions.find(
        (s) =>
          movie.id === order.movieId &&
          s.time === order.time &&
          s.dateLabel === order.dateLabel &&
          s.room === order.room,
      );
      if (session) return { movie, session };
    }
    return undefined;
  };

  const handleCancelOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const eligibility = isCdcCancelEligible(targetOrder);
    if (!eligibility.eligible) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'CANCELADO',
              canteenStatus: o.canteenStatus === 'NENHUM' ? 'NENHUM' : 'CANCELADO',
              seatQrTokens: o.seatQrTokens.map((sq) => ({ ...sq, status: 'CANCELADO' as const })),
              refundIdempotencyKey: `REFUND-${orderId}-OK`,
            }
          : o,
      ),
    );

    if (targetOrder.seatsLabel.length > 0) {
      const resolved = findSessionForOrder(targetOrder);
      if (resolved) {
        const released = new Set(targetOrder.seatsLabel);
        setOccupiedBySession((prev) => {
          const existing = prev[resolved.session.id] ?? [];
          if (existing.length === 0) return prev;
          return {
            ...prev,
            [resolved.session.id]: existing.filter((seatId) => !released.has(seatId)),
          };
        });
      }
    }

    const itemsToRestore =
      orderCartItemsMap[orderId] ??
      parseCanteenSummaryQuantities(targetOrder.canteenSummary, canteenCatalog);
    if (itemsToRestore.length > 0) {
      setCanteenCatalog((prev) =>
        prev.map((item) => {
          const restored = itemsToRestore.find((r) => r.itemId === item.id);
          if (!restored) return item;
          return { ...item, stock: item.stock + restored.quantity };
        }),
      );
    }

    const notice: InternalNoticeItem = {
      id: `not-${Date.now()}`,
      userId: targetOrder.userId,
      orderId: targetOrder.id,
      title: `Cancelamento CDC confirmado (${targetOrder.id})`,
      message: `Pedido ${targetOrder.id} cancelado conforme Art. 49 do CDC. Estorno idempotente REFUND-${orderId}-OK disparado${
        targetOrder.seatsLabel.length > 0
          ? ` e assentos (${targetOrder.seatsLabel.join(', ')}) liberados`
          : ''
      }.`,
      type: 'refund',
      createdAt: formatNowPtBr(),
      read: false,
    };
    setNotices((prev) => [notice, ...prev]);
  };

  const handleSaveReview = (orderId: string, rating: number, comment: string) => {
    const nowIso = new Date().toISOString();
    const targetOrder = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, rating, reviewComment: comment, reviewedAt: nowIso } : o,
      ),
    );

    setCommunityReviews((prev) => {
      const exists = prev.some((r) => r.orderId === orderId);
      if (exists) {
        return prev.map((r) =>
          r.orderId === orderId ? { ...r, rating, comment, createdAt: nowIso } : r,
        );
      }
      if (!targetOrder) return prev;
      const newReview: CommunityReviewItem = {
        id: `rev-${Date.now()}`,
        movieId: targetOrder.movieId,
        movieTitle: targetOrder.movieTitle,
        authorDisplayName: formatAuthorDisplayName(currentUser?.name ?? 'Cliente CineFood'),
        complex: targetOrder.complex,
        rating,
        comment,
        createdAt: nowIso,
        verifiedCheckIn: true,
        orderId: targetOrder.id,
        userId: targetOrder.userId,
      };
      return [newReview, ...prev];
    });
  };

  const handleDeleteReview = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              rating: undefined,
              reviewTitle: undefined,
              reviewComment: undefined,
              reviewedAt: undefined,
            }
          : o,
      ),
    );
    setCommunityReviews((prev) => prev.filter((r) => r.orderId !== orderId));
  };

  const handleEditCommunityReview = (reviewId: string, rating: number, comment: string) => {
    const nowIso = new Date().toISOString();
    const target = communityReviews.find((r) => r.id === reviewId);
    setCommunityReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, rating, comment, createdAt: nowIso } : r,
      ),
    );
    if (target?.orderId) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === target.orderId
            ? { ...o, rating, reviewComment: comment, reviewedAt: nowIso }
            : o,
        ),
      );
    }
  };

  const handleDeleteCommunityReview = (reviewId: string) => {
    const target = communityReviews.find((r) => r.id === reviewId);
    setCommunityReviews((prev) => prev.filter((r) => r.id !== reviewId));
    if (target?.orderId) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === target.orderId
            ? {
                ...o,
                rating: undefined,
                reviewTitle: undefined,
                reviewComment: undefined,
                reviewedAt: undefined,
              }
            : o,
        ),
      );
    }
  };

  const handleMarkNoticeRead = (noticeId: string) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === noticeId ? { ...n, read: true } : n)),
    );
  };

  const handleToggleMarketingOptIn = (next: boolean) => {
    const updatedAt = formatNowPtBr();
    setMarketingUpdatedAt(updatedAt);
    setCurrentUser((prev) => (prev ? { ...prev, marketingOptIn: next } : null));
  };

  const handleToggleSaveMovie = (movieId: string) => {
    setSavedMovieIds((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId],
    );
  };

  const handleOpenReviewsForMovie = (movieId: string) => {
    setReviewsMovieFilter(movieId);
    setReviewsSubTab('comments');
    setReviewsViewKey((k) => k + 1);
    setStep('reviews');
    syncHashForStep('reviews');
  };

  const handleSelectMovieInDetail = (movieId: string) => {
    const targetMovie = moviesCatalog.find((m) => m.id === movieId);
    if (!targetMovie) return;
    const filteredIdx = filteredMovies.findIndex((m) => m.id === movieId);
    if (filteredIdx >= 0) {
      setActiveMovieIndex(filteredIdx);
    }
    setOverrideMovieId(targetMovie.id);
    if (targetMovie.id !== activeMovie.id) {
      setSelectedSeats([]);
    }
    setSelectedSession(findFilteredSession(targetMovie));
  };

  const handleSelectMovieForSessions = (movieId: string) => {
    const targetMovie = moviesCatalog.find((m) => m.id === movieId);
    if (!targetMovie) return;

    const complexActive = browseMode === 'complexo' && selectedComplex !== COMPLEX_OPTIONS[0];
    let nextFormat = formatFilter;
    let nextDateId = selectedDateId;
    let nextComplex = selectedComplex;

    const hasMatchingSession = (fmt: CatalogFormatFilter, dateId: string, complex: string) =>
      targetMovie.sessions.some((s) => {
        if (s.dateId !== dateId) return false;
        if (fmt !== 'Todos' && s.format !== fmt) return false;
        if (complexActive && complex !== COMPLEX_OPTIONS[0] && s.complex !== complex) return false;
        return true;
      });

    if (!hasMatchingSession(nextFormat, nextDateId, nextComplex)) {
      if (nextFormat !== 'Todos' && hasMatchingSession('Todos', nextDateId, nextComplex)) {
        nextFormat = 'Todos';
      } else {
        const preferredSession =
          targetMovie.sessions.find((s) => s.status === 'ATIVA') ?? targetMovie.sessions[0];
        if (preferredSession) {
          nextFormat = 'Todos';
          nextDateId = preferredSession.dateId;
          if (complexActive && !targetMovie.complexes.includes(nextComplex)) {
            nextComplex = COMPLEX_OPTIONS[0];
          }
        }
      }
    }

    if (nextFormat !== formatFilter) setFormatFilter(nextFormat);
    if (nextDateId !== selectedDateId) setSelectedDateId(nextDateId);
    if (nextComplex !== selectedComplex) setSelectedComplex(nextComplex);

    const filteredIdx = filteredMovies.findIndex((m) => m.id === movieId);
    if (filteredIdx >= 0) {
      setActiveMovieIndex(filteredIdx);
    }
    setOverrideMovieId(targetMovie.id);
    setSelectedSeats([]);
    setCanteenOnlyMode(false);

    const compatibleSession =
      targetMovie.sessions.find(
        (s) =>
          s.status === 'ATIVA' &&
          s.dateId === nextDateId &&
          (nextFormat === 'Todos' || s.format === nextFormat) &&
          (!complexActive || nextComplex === COMPLEX_OPTIONS[0] || s.complex === nextComplex),
      ) ??
      targetMovie.sessions.find((s) => s.status === 'ATIVA') ??
      targetMovie.sessions[0];

    if (compatibleSession) {
      setSelectedSession(compatibleSession);
    }
    setStep('detail');
    syncHashForStep('detail');
  };

  const handleSubmitLgpdRequest = (type: LgpdRequestType, details: string) => {
    const proto = `LGPD-2026-${49100 + lgpdRequests.length}`;
    const newReq: LgpdRequestItem = {
      id: `lgpd-${Date.now()}`,
      protocol: proto,
      type,
      details,
      createdAt: formatNowPtBr(),
      status: 'REGISTRADO',
      legalRetentionNote:
        type === 'ELIMINACAO'
          ? 'Dados pessoais dispensáveis desassociados; registros fiscais preservados em cofre legal (CTN Art. 173).'
          : 'Solicitação recebida com SLA legal de atendimento em até 15 dias (LGPD Art. 19).',
    };
    setLgpdRequests((prev) => [newReq, ...prev]);
  };

  const handleValidateQr = (token: string, expectedSessionId?: string) => {
    const cleaned = token.trim().toUpperCase();
    const nowLabel = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const matched = orders.find(
      (o) =>
        o.qrToken.toUpperCase() === cleaned ||
        o.seatQrTokens?.some((sq) => sq.qrToken.toUpperCase() === cleaned),
    );

    if (!matched) {
      const record: GateScanRecord = {
        id: `scan-${Date.now()}`,
        qrToken: cleaned || token,
        orderId: null,
        outcome: 'INVALIDO',
        detail: 'Token não encontrado na base de sessões ativas.',
        triggeredKitchenPrep: false,
        timestamp: nowLabel,
      };
      setScanLog((prev) => [record, ...prev]);
      return {
        outcome: 'INVALIDO' as const,
        title: 'Token Inválido',
        detail: record.detail,
        triggeredKitchenPrep: false,
      };
    }

    const matchedSeatToken = matched.seatQrTokens?.find(
      (sq) => sq.qrToken.toUpperCase() === cleaned,
    );

    if (matched.status === 'CANCELADO' || matchedSeatToken?.status === 'CANCELADO') {
      const record: GateScanRecord = {
        id: `scan-${Date.now()}`,
        qrToken: cleaned,
        orderId: matched.id,
        outcome: 'CANCELADO',
        detail: `Pedido ${matched.id} foi estornado via CDC e perdeu validade de entrada.`,
        triggeredKitchenPrep: false,
        timestamp: nowLabel,
      };
      setScanLog((prev) => [record, ...prev]);
      return {
        outcome: 'CANCELADO' as const,
        title: 'Ingresso Cancelado',
        detail: record.detail,
        order: matched,
        triggeredKitchenPrep: false,
      };
    }

    const orderSession = findSessionForOrder(matched);
    if (orderSession && orderSession.session.status !== 'ATIVA') {
      const record: GateScanRecord = {
        id: `scan-${Date.now()}`,
        qrToken: cleaned,
        orderId: matched.id,
        outcome: 'INVALIDO',
        detail: `A sessão de ${orderSession.movie.title} (${orderSession.session.time}) está ${orderSession.session.status}. Entrada bloqueada.`,
        triggeredKitchenPrep: false,
        timestamp: nowLabel,
      };
      setScanLog((prev) => [record, ...prev]);
      return {
        outcome: 'INVALIDO' as const,
        title: `Sessão ${orderSession.session.status}`,
        detail: record.detail,
        order: matched,
        triggeredKitchenPrep: false,
      };
    }

    if (expectedSessionId) {
      let expectedEntry: { movie: MovieItem; session: SessionSlot } | undefined;
      for (const movie of moviesCatalog) {
        const s = movie.sessions.find((slot) => slot.id === expectedSessionId);
        if (s) {
          expectedEntry = { movie, session: s };
          break;
        }
      }
      if (expectedEntry && expectedEntry.session.status !== 'ATIVA') {
        const record: GateScanRecord = {
          id: `scan-${Date.now()}`,
          qrToken: cleaned,
          orderId: matched.id,
          outcome: 'INVALIDO',
          detail: `Portaria configurada para sessão ${expectedEntry.session.status}.`,
          triggeredKitchenPrep: false,
          timestamp: nowLabel,
        };
        setScanLog((prev) => [record, ...prev]);
        return {
          outcome: 'INVALIDO' as const,
          title: `Portaria em Sessão ${expectedEntry.session.status}`,
          detail: record.detail,
          order: matched,
          triggeredKitchenPrep: false,
        };
      }
      if (expectedEntry && (!orderSession || orderSession.session.id !== expectedEntry.session.id)) {
        const record: GateScanRecord = {
          id: `scan-${Date.now()}`,
          qrToken: cleaned,
          orderId: matched.id,
          outcome: 'INVALIDO',
          detail: `Ingresso ${matched.id} pertence a ${matched.movieTitle} (${matched.dateLabel} · ${matched.time} · ${matched.room}), incompatível com a sessão selecionada.`,
          triggeredKitchenPrep: false,
          timestamp: nowLabel,
        };
        setScanLog((prev) => [record, ...prev]);
        return {
          outcome: 'INVALIDO' as const,
          title: 'Ingresso de Outra Sessão',
          detail: record.detail,
          order: matched,
          triggeredKitchenPrep: false,
        };
      }
    }

    const isAlreadyUsed = matchedSeatToken
      ? matchedSeatToken.status === 'UTILIZADO'
      : matched.checkedIn;

    if (isAlreadyUsed) {
      const record: GateScanRecord = {
        id: `scan-${Date.now()}`,
        qrToken: cleaned,
        orderId: matched.id,
        outcome: 'DUPLICADO',
        detail: matchedSeatToken
          ? `QR individual ${cleaned} (poltrona ${matchedSeatToken.seatId}) já utilizado — check-in atômico bloqueou reentrada.`
          : `QR Já Utilizado — check-in atômico bloqueou reentrada para ${matched.id}.`,
        triggeredKitchenPrep: false,
        timestamp: nowLabel,
      };
      setScanLog((prev) => [record, ...prev]);
      return {
        outcome: 'DUPLICADO' as const,
        title: 'QR Já Utilizado',
        detail: record.detail,
        order: matched,
        triggeredKitchenPrep: false,
      };
    }

    const updatedSeatTokens: SeatQrToken[] = matched.seatQrTokens.map((sq) => {
      if (matchedSeatToken) {
        return sq.qrToken.toUpperCase() === cleaned ? { ...sq, status: 'UTILIZADO' } : sq;
      }
      return sq.status === 'ATIVO' ? { ...sq, status: 'UTILIZADO' } : sq;
    });

    const triggersKitchen =
      matched.deliveryMode === 'seat' && matched.canteenStatus === 'AGUARDANDO_CHEGADA';

    const updatedOrder: ClientTicketOrder = {
      ...matched,
      checkedIn: true,
      status: 'UTILIZADO',
      seatQrTokens: updatedSeatTokens,
      canteenStatus: triggersKitchen ? 'EM_PREPARO' : matched.canteenStatus,
    };

    setOrders((prev) => prev.map((o) => (o.id === matched.id ? updatedOrder : o)));

    const seatText = matchedSeatToken
      ? `poltrona ${matchedSeatToken.seatId}`
      : matched.seatsLabel.join(', ');

    const record: GateScanRecord = {
      id: `scan-${Date.now()}`,
      qrToken: cleaned,
      orderId: matched.id,
      outcome: 'LIBERADO',
      detail: triggersKitchen
        ? `Check-in confirmado para ${matched.room} (${seatText}). Cantina KDS notificada (RN-02 → EM_PREPARO).`
        : `Check-in confirmado para ${matched.room} (${seatText}).`,
      triggeredKitchenPrep: triggersKitchen,
      timestamp: nowLabel,
    };
    setScanLog((prev) => [record, ...prev]);

    return {
      outcome: 'LIBERADO' as const,
      title: 'Entrada Liberada',
      detail: record.detail,
      order: updatedOrder,
      triggeredKitchenPrep: triggersKitchen,
    };
  };

  const handleKdsSetCanteenStatus = (orderId: string, nextStatus: CanteenOrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, canteenStatus: nextStatus } : o)),
    );
  };

  const handleEmitBoxOfficeOrder = (newOrder: ClientTicketOrder) => {
    setOrders((prev) => [newOrder, ...prev]);

    const resolved = findSessionForOrder(newOrder);
    if (resolved && newOrder.seatsLabel.length > 0) {
      setOccupiedBySession((prev) => {
        const currentSeats = new Set(prev[resolved.session.id] ?? []);
        newOrder.seatsLabel.forEach((seatId) => currentSeats.add(seatId));
        return { ...prev, [resolved.session.id]: Array.from(currentSeats) };
      });
      setOrderSessionIdMap((prev) => ({ ...prev, [newOrder.id]: resolved.session.id }));
    }

    const parsedCanteen = parseCanteenSummaryQuantities(newOrder.canteenSummary, canteenCatalog);
    if (parsedCanteen.length > 0) {
      setCanteenCatalog((prev) =>
        prev.map((item) => {
          const used = parsedCanteen.find((p) => p.itemId === item.id);
          if (!used) return item;
          return { ...item, stock: Math.max(0, item.stock - used.quantity) };
        }),
      );
      setOrderCartItemsMap((prev) => ({ ...prev, [newOrder.id]: parsedCanteen }));
    }
  };

  const handleRegisterIncident = (
    incident: Omit<RunnerIncident, 'id' | 'createdAt' | 'operator'>,
  ) => {
    const runnerProfile = STAFF_PROFILES.find((p) => p.role === staffRole);
    const nextItem: RunnerIncident = {
      ...incident,
      id: `INC-${302 + incidents.length}`,
      createdAt: formatNowPtBr(),
      operator: runnerProfile?.operatorName ?? 'Runner Plantão',
    };
    setIncidents((prev) => [nextItem, ...prev]);

    if (incident.reason === 'CLIENTE_AUSENTE') {
      const targetOrder = orders.find((o) => o.id === incident.orderId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === incident.orderId
            ? { ...o, deliveryMode: 'counter', canteenStatus: 'RETIRADA_NO_BALCAO' }
            : o,
        ),
      );
      if (targetOrder) {
        const notice: InternalNoticeItem = {
          id: `not-${Date.now()}`,
          userId: targetOrder.userId,
          orderId: targetOrder.id,
          title: `Combo disponível para retirada no balcão (RN-03 · ${targetOrder.id})`,
          message: `O Runner não localizou você na poltrona (${incident.seatLabel}) durante a sessão. Seu pedido foi convertido para retirada no balcão da cantina.`,
          type: 'warning',
          createdAt: formatNowPtBr(),
          read: false,
        };
        setNotices((prev) => [notice, ...prev]);
      }
    }
  };

  const handleUpdateSessionPrice = (movieId: string, sessionId: string, newPrice: number) => {
    setMoviesCatalog((prev) =>
      prev.map((m) =>
        m.id === movieId
          ? {
              ...m,
              sessions: m.sessions.map((s) =>
                s.id === sessionId ? { ...s, basePrice: newPrice } : s,
              ),
            }
          : m,
      ),
    );
  };

  const handleAddSession = (movieId: string, slot: SessionSlot) => {
    setMoviesCatalog((prev) =>
      prev.map((m) => (m.id === movieId ? { ...m, sessions: [...m.sessions, slot] } : m)),
    );
  };

  const handleToggleSessionStatus = (
    movieId: string,
    sessionId: string,
    status: SessionStatus,
  ) => {
    setMoviesCatalog((prev) =>
      prev.map((m) =>
        m.id === movieId
          ? {
              ...m,
              sessions: m.sessions.map((s) => (s.id === sessionId ? { ...s, status } : s)),
            }
          : m,
      ),
    );
  };

  const handleUpdateCanteenStock = (itemId: string, stock: number) => {
    setCanteenCatalog((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, stock: Math.max(0, stock) } : item)),
    );
  };

  const latestCreatedOrder = useMemo(
    () => (lastOrderId ? orders.find((o) => o.id === lastOrderId) ?? orders[0] : null),
    [lastOrderId, orders],
  );

  const activeMovieReviewCount = useMemo(
    () => communityReviews.filter((r) => r.movieId === activeMovie.id).length,
    [communityReviews, activeMovie.id],
  );

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="min-h-dvh bg-[var(--bg-base)] text-[var(--text-primary)]"
        data-marketing-updated-at={marketingUpdatedAt ?? undefined}
      >
        {step !== 'ops' && (
          <Header
            currentStep={step}
            oledMode={oledMode}
            onToggleOled={() => setOledMode((v) => !v)}
            onNavigate={navigateStep}
            selectedSeatsCount={selectedSeats.length}
            currentUser={currentUser}
          />
        )}

        <main>
          {step === 'home' && (
            <HeroCatalogView
              movies={filteredMovies}
              activeMovieIndex={
                filteredMovies.length > 0 ? activeMovieIndex % filteredMovies.length : 0
              }
              onSelectMovieIndex={(idx) => {
                setOverrideMovieId(null);
                setActiveMovieIndex(idx);
              }}
              onOpenDetail={(movie, session) => {
                const idx = filteredMovies.findIndex((m) => m.id === movie.id);
                if (idx >= 0) setActiveMovieIndex(idx);
                setOverrideMovieId(movie.id);
                setSelectedSession(findFilteredSession(movie, session));
                setCanteenOnlyMode(false);
                setStep('detail');
              }}
              onQuickSeats={(movie, session) => openSeatsForMovie(movie, session)}
              browseMode={browseMode}
              onChangeBrowseMode={(mode) => {
                setOverrideMovieId(null);
                setBrowseMode(mode);
                setActiveMovieIndex(0);
              }}
              selectedComplex={selectedComplex}
              onSelectComplex={(complex) => {
                setOverrideMovieId(null);
                setSelectedComplex(complex);
                setActiveMovieIndex(0);
              }}
              selectedDateId={selectedDateId}
              onSelectDateId={(id) => {
                setOverrideMovieId(null);
                setSelectedDateId(id);
                setActiveMovieIndex(0);
              }}
              searchQuery={searchQuery}
              onChangeSearchQuery={(q) => {
                setOverrideMovieId(null);
                setSearchQuery(q);
                setActiveMovieIndex(0);
              }}
              formatFilter={formatFilter}
              onChangeFormatFilter={(fmt) => {
                setOverrideMovieId(null);
                setFormatFilter(fmt);
                setActiveMovieIndex(0);
              }}
              onClearFilters={clearCatalogFilters}
              catalogSource={catalogSource}
              savedMovieIds={savedMovieIds}
              onToggleSaveMovie={handleToggleSaveMovie}
              onOpenReviews={handleOpenReviewsForMovie}
            />
          )}

          {step === 'detail' && (
            <MovieDetailView
              movie={activeMovie}
              movies={moviesCatalog}
              onSelectMovie={handleSelectMovieInDetail}
              onBack={() => {
                setOverrideMovieId(null);
                setStep('home');
              }}
              onSelectSession={(session) => openSeatsForMovie(activeMovie, session)}
              selectedDateId={selectedDateId}
              selectedComplex={browseMode === 'complexo' ? selectedComplex : undefined}
              formatFilter={formatFilter}
              onOpenReviews={handleOpenReviewsForMovie}
              communityReviewCount={activeMovieReviewCount}
            />
          )}

          {step === 'seats' && (
            <SeatSelectionView
              movie={activeMovie}
              session={selectedSession}
              seats={seatMap}
              selectedSeats={selectedSeats}
              onToggleSeat={handleToggleSeat}
              onChangeTier={handleChangeTier}
              onChangeMeiaDetails={handleChangeMeiaDetails}
              onRemoveSeat={handleRemoveSeat}
              secondsLeft={secondsLeft}
              onSimulateExpire={() => setSecondsLeft(0)}
              onRenewLock={() => setSecondsLeft(600)}
              onExpireRelease={() => {
                setSelectedSeats([]);
                setSecondsLeft(600);
                setStep('detail');
              }}
              onBack={() => setStep('detail')}
              onNext={() => setCanteenOpen(true)}
            />
          )}

          {step === 'canteen' && (
            <CanteenCatalogView
              items={canteenCatalog}
              cart={canteenCatalogCart}
              deliveryMode={deliveryMode}
              hasActiveTicket={selectedSeats.length > 0}
              activeTicketLabel={
                selectedSeats.length > 0
                  ? `${activeMovie.title} · ${selectedSession.time} (${selectedSeats.map((s) => s.seatId).join(', ')})`
                  : undefined
              }
              onUpdateQty={handleUpdateComboQtyById}
              onToggleAddon={handleToggleAddon}
              onChangeDeliveryMode={setDeliveryMode}
              onCheckoutCanteenOnly={() => {
                if (selectedSeats.length === 0 || deliveryMode === 'counter') {
                  setCanteenOnlyMode(true);
                  setDeliveryMode('counter');
                } else {
                  setCanteenOnlyMode(false);
                }
                setStep('checkout');
              }}
              onBackToMovies={() => navigateStep('home')}
            />
          )}

          {step === 'reviews' && (
            <CommunityReviewsView
              key={reviewsViewKey}
              movies={moviesCatalog}
              reviews={communityReviews}
              orders={orders}
              currentUser={currentUser}
              initialMovieFilter={reviewsMovieFilter}
              initialSubTab={reviewsSubTab}
              onAddReview={(orderId, _movieId, rating, comment) =>
                handleSaveReview(orderId, rating, comment)
              }
              onEditReview={handleEditCommunityReview}
              onDeleteReview={handleDeleteCommunityReview}
              onNavigateToAuth={() => navigateStep('auth')}
              onBackToCatalog={() => navigateStep('home')}
              onSelectMovieForSessions={handleSelectMovieForSessions}
            />
          )}

          {step === 'checkout' && (
            <CheckoutView
              movie={canteenOnlyMode ? null : activeMovie}
              session={canteenOnlyMode ? null : selectedSession}
              selectedSeats={canteenOnlyMode ? [] : selectedSeats}
              cart={cart}
              deliveryMode={canteenOnlyMode ? 'counter' : deliveryMode}
              defaultBuyer={effectiveBuyer}
              secondsLeft={secondsLeft}
              isCanteenOnly={canteenOnlyMode}
              onBackToSeats={() => setStep(canteenOnlyMode ? 'canteen' : 'seats')}
              onOpenCanteen={() => {
                if (canteenOnlyMode) {
                  setStep('canteen');
                } else {
                  setCanteenOpen(true);
                }
              }}
              onConfirmPayment={handleCreateOrderFromCheckout}
              onLatePixRefund={handleLatePixRefund}
            />
          )}

          {step === 'ticket' && (
            <TicketPassView
              order={latestCreatedOrder}
              movie={latestCreatedOrder?.orderKind === 'canteen-only' ? null : activeMovie}
              session={latestCreatedOrder?.orderKind === 'canteen-only' ? null : selectedSession}
              selectedSeats={
                latestCreatedOrder?.orderKind === 'canteen-only' ? [] : selectedSeats
              }
              cart={cart}
              deliveryMode={latestCreatedOrder?.deliveryMode ?? deliveryMode}
              paymentMethod={paymentMethod}
              oledMode={oledMode}
              onToggleOled={() => setOledMode((v) => !v)}
              onGoToOrders={() => navigateStep('orders')}
              onRestart={() => {
                setCart([]);
                setSelectedSeats([]);
                setCanteenOnlyMode(false);
                setSecondsLeft(600);
                setOverrideMovieId(null);
                setStep('home');
              }}
            />
          )}

          {step === 'auth' && (
            <AuthView
              currentUser={currentUser}
              onLogin={(user) => setCurrentUser(user)}
              onLogout={() => setCurrentUser(null)}
              onBack={() => navigateStep('home')}
              onGoToOrders={() => navigateStep('orders')}
              onToggleMarketingOptIn={handleToggleMarketingOptIn}
            />
          )}

          {step === 'orders' && (
            <ClientOrdersView
              currentUser={currentUser}
              orders={orders}
              notices={notices}
              lgpdRequests={lgpdRequests}
              onGoToAuth={() => navigateStep('auth')}
              onGoToHome={() => navigateStep('home')}
              onCancelOrder={handleCancelOrder}
              onSaveReview={handleSaveReview}
              onDeleteReview={handleDeleteReview}
              onMarkNoticeRead={handleMarkNoticeRead}
              onSubmitLgpdRequest={handleSubmitLgpdRequest}
            />
          )}

          {step === 'ops' && (
            <OpsWorkspace
              activeRole={staffRole}
              onChangeRole={handleSelectStaffRole}
              activeTab={opsTab}
              onTabChange={setOpsTab}
              oledMode={oledMode}
              onToggleOled={() => setOledMode((v) => !v)}
              onExitToStorefront={() => navigateStep('home')}
              orders={orders}
              movies={moviesCatalog}
              canteenItems={canteenCatalog}
              scanLog={scanLog}
              incidents={incidents}
              occupiedBySession={occupiedBySession}
              opsAuthenticated={opsAuthenticated}
              onAuthenticateOps={handleAuthenticateOps}
              onLogoutOps={handleLogoutOps}
              onValidateQr={handleValidateQr}
              onEmitBoxOfficeOrder={handleEmitBoxOfficeOrder}
              onAdvanceCanteenStatus={handleKdsSetCanteenStatus}
              onRegisterIncident={handleRegisterIncident}
              onUpdateSessionPrice={handleUpdateSessionPrice}
              onAddSession={handleAddSession}
              onToggleSessionStatus={handleToggleSessionStatus}
              onUpdateCanteenStock={handleUpdateCanteenStock}
            />
          )}
        </main>

        <CanteenSheet
          open={canteenOpen}
          items={canteenCatalog}
          onClose={() => setCanteenOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateComboQty}
          onToggleAddon={handleToggleAddon}
          deliveryMode={deliveryMode}
          onChangeDeliveryMode={setDeliveryMode}
          hasActiveTicket={selectedSeats.length > 0}
          onSkipCanteen={() => {
            setCart([]);
            setCanteenOnlyMode(false);
            setCanteenOpen(false);
            setStep('checkout');
          }}
          onConfirmCanteen={() => {
            setCanteenOnlyMode(false);
            setCanteenOpen(false);
            setStep('checkout');
          }}
          seatLabels={selectedSeats.map((s) => s.seatId)}
        />
      </div>
    </MotionConfig>
  );
}

export default App;
