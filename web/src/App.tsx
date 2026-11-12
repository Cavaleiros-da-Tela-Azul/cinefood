import { useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'motion/react';
import {
  buildSeatMap,
  CANTEEN_ITEMS,
  CanteenItem,
  CanteenOrderStatus,
  ClientTicketOrder,
  COMPLEX_OPTIONS,
  CustomerUser,
  DATE_OPTIONS,
  DEMO_BUYER,
  GateScanRecord,
  INITIAL_CUSTOMER,
  INITIAL_INCIDENTS,
  INITIAL_LGPD_REQUESTS,
  INITIAL_ORDERS,
  LgpdRequestItem,
  LgpdRequestType,
  MeiaCategory,
  MovieItem,
  MOVIES,
  RunnerIncident,
  SeatNode,
  SelectedSeat,
  SessionSlot,
  STAFF_PROFILES,
  StaffRoleGroup,
  TicketTier,
  WORST_CASE_BUYER,
  WORST_CASE_CANTEEN,
  WORST_CASE_MOVIES,
} from './data/cinemaData';
import { AppStep, Header } from './components/Header';
import { CatalogFormatFilter, HeroCatalogView } from './components/HeroCatalogView';
import { MovieDetailView } from './components/MovieDetailView';
import { SeatSelectionView } from './components/SeatSelectionView';
import { CanteenSheet, CartComboLine, DeliveryMode } from './components/CanteenSheet';
import { CheckoutView } from './components/CheckoutView';
import { TicketPassView } from './components/TicketPassView';
import { AuthView } from './components/AuthView';
import { ClientOrdersView } from './components/ClientOrdersView';
import { OpsTab, OpsWorkspace } from './components/OpsWorkspace';

export function App() {
  const [step, setStep] = useState<AppStep>(() =>
    typeof window !== 'undefined' && window.location.hash.startsWith('#/ops') ? 'ops' : 'home',
  );
  const [oledMode, setOledMode] = useState(false);
  const [worstCaseMode, setWorstCaseMode] = useState(false);

  const [browseMode, setBrowseMode] = useState<'filme' | 'complexo'>('filme');
  const [selectedComplex, setSelectedComplex] = useState(COMPLEX_OPTIONS[0]);
  const [selectedDateId, setSelectedDateId] = useState(DATE_OPTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<CatalogFormatFilter>('Todos');

  const [moviesCatalog, setMoviesCatalog] = useState<MovieItem[]>(MOVIES);
  const sourceMovies = worstCaseMode ? WORST_CASE_MOVIES : moviesCatalog;
  const sourceCanteen = worstCaseMode ? WORST_CASE_CANTEEN : CANTEEN_ITEMS;

  const [activeMovieIndex, setActiveMovieIndex] = useState(0);
  const filteredMovies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sourceMovies.filter((movie) => {
      if (
        browseMode === 'complexo' &&
        selectedComplex !== COMPLEX_OPTIONS[0] &&
        !movie.complexes.includes(selectedComplex)
      ) {
        return false;
      }

      const matchingDateSessions = movie.sessions.filter((s) => s.dateId === selectedDateId);
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
  }, [sourceMovies, browseMode, selectedComplex, selectedDateId, formatFilter, searchQuery]);

  const activeMovie =
    filteredMovies.length > 0
      ? filteredMovies[activeMovieIndex % filteredMovies.length]
      : sourceMovies[0];

  const [selectedSession, setSelectedSession] = useState<SessionSlot>(sourceMovies[0].sessions[0]);

  useEffect(() => {
    const matching = activeMovie.sessions.find((s) => s.dateId === selectedDateId);
    if (matching) {
      setSelectedSession(matching);
    } else if (activeMovie.sessions[0]) {
      setSelectedSession(activeMovie.sessions[0]);
    }
  }, [activeMovie, selectedDateId]);

  const seatMap = useMemo(() => buildSeatMap(), []);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([
    { seatId: 'F7', row: 'F', col: 7, category: 'standard', tier: 'inteira' },
    { seatId: 'F8', row: 'F', col: 8, category: 'standard', tier: 'inteira' },
  ]);
  const [secondsLeft, setSecondsLeft] = useState(600);

  const [canteenOpen, setCanteenOpen] = useState(false);
  const [cart, setCart] = useState<CartComboLine[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('seat');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(INITIAL_CUSTOMER);
  const [orders, setOrders] = useState<ClientTicketOrder[]>(INITIAL_ORDERS);
  const [lgpdRequests, setLgpdRequests] = useState<LgpdRequestItem[]>(INITIAL_LGPD_REQUESTS);
  const [staffRole, setStaffRole] = useState<StaffRoleGroup>('ADMIN');
  const [opsTab, setOpsTab] = useState<OpsTab>('gate');
  const [scanLog, setScanLog] = useState<GateScanRecord[]>([]);
  const [incidents, setIncidents] = useState<RunnerIncident[]>(INITIAL_INCIDENTS);

  const effectiveBuyer = worstCaseMode
    ? WORST_CASE_BUYER
    : currentUser
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

  const navigateStep = (next: AppStep) => {
    if (next === 'seats' && !selectedSession) {
      setSelectedSession(activeMovie.sessions[0]);
    }
    setStep(next);
    if (typeof window !== 'undefined') {
      const targetHash = next === 'ops' ? '#/ops' : '#/';
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    }
  };

  const handleSelectStaffRole = (role: StaffRoleGroup) => {
    setStaffRole(role);
    const profile = STAFF_PROFILES.find((p) => p.role === role);
    if (profile && !profile.allowedTabs.includes(opsTab)) {
      setOpsTab(profile.defaultTab);
    }
  };

  const handleEnterBackstage = (role: StaffRoleGroup) => {
    handleSelectStaffRole(role);
    navigateStep('ops');
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
    setCart((prev) => {
      const existing = prev.find((line) => line.item.id === item.id);
      if (!existing && delta > 0) {
        if (item.stock <= 0) return prev;
        return [...prev, { item, quantity: 1, selectedAddonIds: [] }];
      }
      if (!existing) return prev;
      const nextQty = Math.min(item.stock, existing.quantity + delta);
      if (nextQty <= 0) {
        return prev.filter((line) => line.item.id !== item.id);
      }
      return prev.map((line) => (line.item.id === item.id ? { ...line, quantity: nextQty } : line));
    });
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

  const openSeatsForMovie = (movie = activeMovie, session = movie.sessions[0]) => {
    setSelectedSession(session);
    setStep('seats');
  };

  const clearCatalogFilters = () => {
    setSelectedComplex(COMPLEX_OPTIONS[0]);
    setSelectedDateId(DATE_OPTIONS[0].id);
    setSearchQuery('');
    setFormatFilter('Todos');
    setActiveMovieIndex(0);
  };

  const handleCreateOrderFromCheckout = (method: 'pix' | 'card') => {
    setPaymentMethod(method);
    const ticketsSum = selectedSeats.reduce(
      (sum, s) => sum + (s.tier === 'meia' ? selectedSession.basePrice * 0.5 : selectedSession.basePrice),
      0,
    );
    const canteenSum = cart.reduce((acc, line) => {
      const addonsSum = line.item.addons
        .filter((a) => line.selectedAddonIds.includes(a.id))
        .reduce((s, a) => s + a.price, 0);
      return acc + (line.item.price + addonsSum) * line.quantity;
    }, 0);
    const orderNum = 8500 + orders.length;
    const newOrder: ClientTicketOrder = {
      id: `ORD-${orderNum}`,
      qrToken: `CF-QR-${orderNum}-${activeMovie.id.slice(0, 2).toUpperCase()}`,
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
      status: 'ATIVO',
      canteenSummary:
        cart.length > 0 ? cart.map((l) => `${l.quantity}× ${l.item.name}`).join(', ') : null,
      canteenStatus:
        cart.length === 0
          ? 'NENHUM'
          : deliveryMode === 'seat'
            ? 'AGUARDANDO_CHEGADA'
            : 'PRONTO_RETIRADA',
      deliveryMode,
      hoursUntilSession: 5.0,
      checkedIn: false,
      sessionEnded: false,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setStep('ticket');
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'CANCELADO',
              canteenStatus: o.canteenStatus === 'NENHUM' ? 'NENHUM' : 'CANCELADO',
              refundIdempotencyKey: `REFUND-${orderId}-OK`,
            }
          : o,
      ),
    );
  };

  const handleAdvanceCanteenStatus = (orderId: string) => {
    const nextMap: Partial<Record<CanteenOrderStatus, CanteenOrderStatus>> = {
      AGUARDANDO_CHEGADA: 'EM_PREPARO',
      EM_PREPARO: 'EM_ENTREGA',
      EM_ENTREGA: 'ENTREGUE',
      PRONTO_RETIRADA: 'ENTREGUE',
    };
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              checkedIn: true,
              canteenStatus: nextMap[o.canteenStatus] ?? o.canteenStatus,
            }
          : o,
      ),
    );
  };

  const handleSubmitReview = (orderId: string, rating: number, comment: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, rating, reviewComment: comment } : o)),
    );
  };

  const handleSubmitLgpdRequest = (type: LgpdRequestType, details: string) => {
    const proto = `LGPD-2026-${49100 + lgpdRequests.length}`;
    const newReq: LgpdRequestItem = {
      id: `lgpd-${Date.now()}`,
      protocol: proto,
      type,
      details,
      createdAt: '12/11/2026 · 16:45',
      status: 'REGISTRADO',
      legalRetentionNote:
        type === 'ANONIMIZACAO'
          ? 'Dados pessoais desassociados; registros fiscais preservados em cofre legal (CTN Art. 173).'
          : 'Solicitação recebida com SLA legal de atendimento em até 15 dias (LGPD Art. 19).',
    };
    setLgpdRequests((prev) => [newReq, ...prev]);
  };

  const handleValidateQr = (token: string) => {
    const nowLabel = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const matched = orders.find((o) => o.qrToken.toUpperCase() === token);

    if (!matched) {
      const record: GateScanRecord = {
        id: `scan-${Date.now()}`,
        qrToken: token,
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

    if (matched.status === 'CANCELADO') {
      const record: GateScanRecord = {
        id: `scan-${Date.now()}`,
        qrToken: token,
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

    if (matched.checkedIn) {
      const record: GateScanRecord = {
        id: `scan-${Date.now()}`,
        qrToken: token,
        orderId: matched.id,
        outcome: 'DUPLICADO',
        detail: `QR Já Utilizado — check-in atômico bloqueou reentrada para ${matched.id}.`,
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

    const triggersKitchen =
      matched.deliveryMode === 'seat' && matched.canteenStatus === 'AGUARDANDO_CHEGADA';

    const updatedOrder: ClientTicketOrder = {
      ...matched,
      checkedIn: true,
      status: 'UTILIZADO',
      canteenStatus: triggersKitchen ? 'EM_PREPARO' : matched.canteenStatus,
    };

    setOrders((prev) => prev.map((o) => (o.id === matched.id ? updatedOrder : o)));

    const record: GateScanRecord = {
      id: `scan-${Date.now()}`,
      qrToken: token,
      orderId: matched.id,
      outcome: 'LIBERADO',
      detail: triggersKitchen
        ? `Check-in confirmado para ${matched.room}. Cantina KDS notificada (RN-02 → EM_PREPARO).`
        : `Check-in confirmado para ${matched.room} (${matched.seatsLabel.join(', ')}).`,
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
  };

  const handleRegisterIncident = (
    incident: Omit<RunnerIncident, 'id' | 'createdAt' | 'operator'>,
  ) => {
    const nextItem: RunnerIncident = {
      ...incident,
      id: `INC-${302 + incidents.length}`,
      createdAt: '14/12 · Agora',
      operator: 'Runner Plantão',
    };
    setIncidents((prev) => [nextItem, ...prev]);
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

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-[var(--bg-base)] text-[var(--text-primary)]">
        {step !== 'ops' && (
          <Header
            currentStep={step}
            oledMode={oledMode}
            onToggleOled={() => setOledMode((v) => !v)}
            worstCaseMode={worstCaseMode}
            onToggleWorstCase={() => setWorstCaseMode((v) => !v)}
            onNavigate={navigateStep}
            browseMode={browseMode}
            onChangeBrowseMode={(mode) => {
              setBrowseMode(mode);
              setActiveMovieIndex(0);
            }}
            selectedSeatsCount={selectedSeats.length}
            currentUser={currentUser}
          />
        )}

        <main>
          {step === 'home' && (
            <HeroCatalogView
              movies={filteredMovies}
              activeMovieIndex={filteredMovies.length > 0 ? activeMovieIndex % filteredMovies.length : 0}
              onSelectMovieIndex={setActiveMovieIndex}
              onOpenDetail={(movie) => {
                const idx = filteredMovies.findIndex((m) => m.id === movie.id);
                if (idx >= 0) setActiveMovieIndex(idx);
                setSelectedSession(movie.sessions[0]);
                setStep('detail');
              }}
              onQuickSeats={(movie) => openSeatsForMovie(movie, movie.sessions[0])}
              browseMode={browseMode}
              selectedComplex={selectedComplex}
              onSelectComplex={(complex) => {
                setSelectedComplex(complex);
                setActiveMovieIndex(0);
              }}
              selectedDateId={selectedDateId}
              onSelectDateId={(id) => {
                setSelectedDateId(id);
                setActiveMovieIndex(0);
              }}
              searchQuery={searchQuery}
              onChangeSearchQuery={(q) => {
                setSearchQuery(q);
                setActiveMovieIndex(0);
              }}
              formatFilter={formatFilter}
              onChangeFormatFilter={(fmt) => {
                setFormatFilter(fmt);
                setActiveMovieIndex(0);
              }}
              onClearFilters={clearCatalogFilters}
            />
          )}

          {step === 'detail' && (
            <MovieDetailView
              movie={activeMovie}
              onBack={() => setStep('home')}
              onSelectSession={(session) => openSeatsForMovie(activeMovie, session)}
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

          {step === 'checkout' && (
            <CheckoutView
              movie={activeMovie}
              session={selectedSession}
              selectedSeats={selectedSeats}
              cart={cart}
              deliveryMode={deliveryMode}
              defaultBuyer={effectiveBuyer}
              onBackToSeats={() => setStep('seats')}
              onOpenCanteen={() => setCanteenOpen(true)}
              onConfirmPayment={handleCreateOrderFromCheckout}
            />
          )}

          {step === 'ticket' && (
            <TicketPassView
              movie={activeMovie}
              session={selectedSession}
              selectedSeats={selectedSeats}
              cart={cart}
              deliveryMode={deliveryMode}
              paymentMethod={paymentMethod}
              oledMode={oledMode}
              onToggleOled={() => setOledMode((v) => !v)}
              onGoToOrders={() => setStep('orders')}
              onRestart={() => {
                setCart([]);
                setSecondsLeft(600);
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
              onEnterBackstage={handleEnterBackstage}
            />
          )}

          {step === 'orders' && (
            <ClientOrdersView
              currentUser={currentUser}
              orders={orders}
              lgpdRequests={lgpdRequests}
              onGoToAuth={() => navigateStep('auth')}
              onGoToHome={() => navigateStep('home')}
              onCancelOrder={handleCancelOrder}
              onAdvanceCanteenStatus={handleAdvanceCanteenStatus}
              onSubmitReview={handleSubmitReview}
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
              movies={sourceMovies}
              canteenItems={sourceCanteen}
              scanLog={scanLog}
              incidents={incidents}
              onValidateQr={handleValidateQr}
              onEmitBoxOfficeOrder={handleEmitBoxOfficeOrder}
              onAdvanceCanteenStatus={handleKdsSetCanteenStatus}
              onRegisterIncident={handleRegisterIncident}
              onUpdateSessionPrice={handleUpdateSessionPrice}
              onAddSession={handleAddSession}
            />
          )}
        </main>

        <CanteenSheet
          open={canteenOpen}
          items={sourceCanteen}
          onClose={() => setCanteenOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateComboQty}
          onToggleAddon={handleToggleAddon}
          deliveryMode={deliveryMode}
          onChangeDeliveryMode={setDeliveryMode}
          onSkipCanteen={() => {
            setCart([]);
            setCanteenOpen(false);
            setStep('checkout');
          }}
          onConfirmCanteen={() => {
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
