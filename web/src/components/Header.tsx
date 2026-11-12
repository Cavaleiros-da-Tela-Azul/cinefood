import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Bug, Film, Menu, Moon, Shield, Sun, Ticket, User, X } from 'lucide-react';
import { CustomerUser } from '../data/cinemaData';

export type AppStep =
  | 'home'
  | 'detail'
  | 'seats'
  | 'checkout'
  | 'ticket'
  | 'orders'
  | 'auth'
  | 'ops';

interface HeaderProps {
  currentStep: AppStep;
  oledMode: boolean;
  onToggleOled: () => void;
  worstCaseMode: boolean;
  onToggleWorstCase: () => void;
  onNavigate: (step: AppStep) => void;
  browseMode: 'filme' | 'complexo';
  onChangeBrowseMode: (mode: 'filme' | 'complexo') => void;
  selectedSeatsCount: number;
  currentUser: CustomerUser | null;
}

const NAV_ITEMS: { step: AppStep; label: string }[] = [
  { step: 'home', label: 'Em Cartaz' },
  { step: 'detail', label: 'Sessões' },
  { step: 'seats', label: 'Assentos' },
  { step: 'orders', label: 'Meus Ingressos' },
];

export function Header({
  currentStep,
  oledMode,
  onToggleOled,
  worstCaseMode,
  onToggleWorstCase,
  onNavigate,
  browseMode,
  onChangeBrowseMode,
  selectedSeatsCount,
  currentUser,
}: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const drawerRef = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) {
      dialog.showModal();
    } else if (!drawerOpen && dialog.open) {
      dialog.close();
    }
  }, [drawerOpen]);

  const handleNavigateFromDrawer = (step: AppStep) => {
    setDrawerOpen(false);
    onNavigate(step);
  };

  return (
    <header className="relative z-30 w-full border-b border-white/10 bg-[var(--bg-glass)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu de navegação"
            aria-expanded={drawerOpen}
            aria-controls={drawerId}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition-colors hover:border-white/30 md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="group flex items-center gap-2.5 text-left focus-visible:outline-none"
            aria-label="Voltar ao início do CineFood"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-red)] text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-transform duration-150 group-active:scale-95">
              <Film className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-2xl font-extrabold tracking-wide text-white">CINEFOOD</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Cinema &amp; Cantina
              </span>
            </span>
          </button>
        </div>

        <nav aria-label="Navegação principal" className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map(({ step, label }) => {
            const active = currentStep === step;
            const displayLabel =
              step === 'seats' && selectedSeatsCount > 0 ? `${label} (${selectedSeatsCount})` : label;
            return (
              <button
                key={step}
                type="button"
                onClick={() => onNavigate(step)}
                className={`relative py-1 text-sm font-medium transition-colors ${
                  active ? 'text-white' : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {displayLabel}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--brand-red)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {currentStep === 'home' && (
            <div
              role="group"
              aria-label="Modo de descoberta"
              className="hidden items-center rounded-full border border-white/15 bg-black/40 p-0.5 lg:inline-flex"
            >
              <button
                type="button"
                onClick={() => onChangeBrowseMode('filme')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  browseMode === 'filme' ? 'bg-white text-[#0D0E12]' : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Por Filme
              </button>
              <button
                type="button"
                onClick={() => onChangeBrowseMode('complexo')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  browseMode === 'complexo' ? 'bg-white text-[#0D0E12]' : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Por Complexo
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate('ops')}
            title="Abrir CineFood Backstage — CRM Operacional separado por grupo de usuário (#/ops)"
            aria-label="Abrir CineFood Backstage"
            className="hidden min-h-[40px] items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-400/60 hover:bg-amber-500/20 active:scale-95 lg:inline-flex"
          >
            <Shield className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            <span>Backstage</span>
            <ArrowUpRight className="h-3 w-3 opacity-75" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onToggleWorstCase}
            aria-pressed={worstCaseMode}
            title="Alternar dataset de estresse visual (break-ui: Demo / Pior Caso)"
            className={`hidden min-h-[40px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95 sm:inline-flex ${
              worstCaseMode
                ? 'border-rose-400/70 bg-rose-500/20 text-rose-200'
                : 'border-white/15 bg-white/5 text-[var(--text-secondary)] hover:border-white/30 hover:text-white'
            }`}
          >
            <Bug className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{worstCaseMode ? 'Pior Caso' : 'Dados Demo'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleOled}
            aria-pressed={oledMode}
            title="Modo Sala Escura OLED — reduz emissão luminosa dentro da sala"
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95 ${
              oledMode
                ? 'border-[var(--amber-progress)]/60 bg-[var(--amber-progress)]/15 text-[#FCD34D]'
                : 'border-white/15 bg-white/5 text-[var(--text-secondary)] hover:border-white/30 hover:text-white'
            }`}
          >
            {oledMode ? <Moon className="h-3.5 w-3.5" aria-hidden="true" /> : <Sun className="h-3.5 w-3.5" aria-hidden="true" />}
            <span className="hidden sm:inline">{oledMode ? 'Sala Escura OLED' : 'Modo Sala Escura'}</span>
            <span className="sm:hidden">OLED</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('auth')}
            aria-label={currentUser ? `Conta de ${currentUser.name}` : 'Entrar ou criar conta'}
            className={`hidden min-h-[40px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95 sm:inline-flex ${
              currentStep === 'auth'
                ? 'border-white bg-white text-[#0D0E12]'
                : 'border-white/15 bg-white/5 text-[var(--text-secondary)] hover:border-white/30 hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="max-w-[96px] truncate">
              {currentUser ? currentUser.name.split(' ')[0] : 'Entrar'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('seats')}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[var(--brand-red)] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95"
          >
            <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Comprar</span>
          </button>
        </div>
      </div>

      {/* Native Accessible Mobile Navigation Drawer (modern-web-guidance) */}
      <dialog
        id={drawerId}
        ref={drawerRef}
        aria-label="Menu de navegação CineFood"
        onCancel={(e) => {
          e.preventDefault();
          setDrawerOpen(false);
        }}
        onClick={(e) => {
          if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
            setDrawerOpen(false);
          }
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-white backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      >
        <nav
          ref={sheetRef}
          aria-label="Menu móvel"
          className="flex h-full w-[min(82vw,320px)] flex-col justify-between border-r border-white/15 bg-[var(--bg-elevated)] p-5 shadow-2xl"
        >
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-display text-2xl font-extrabold tracking-wide text-white">
                CINEFOOD
              </span>
              <button
                type="button"
                autoFocus
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu de navegação"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[var(--text-secondary)] hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <ul className="mt-5 space-y-2">
              {NAV_ITEMS.map(({ step, label }) => {
                const active = currentStep === step;
                return (
                  <li key={step}>
                    <button
                      type="button"
                      onClick={() => handleNavigateFromDrawer(step)}
                      className={`flex min-h-[44px] w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-[var(--brand-red)] text-white'
                          : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{label}</span>
                      {step === 'seats' && selectedSeatsCount > 0 && (
                        <span className="font-mono-tabular rounded-full bg-black/30 px-2 py-0.5 text-xs">
                          {selectedSeatsCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {currentStep === 'home' && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Modo de Descoberta
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeBrowseMode('filme');
                      setDrawerOpen(false);
                    }}
                    className={`min-h-[40px] rounded-lg border px-3 text-xs font-semibold ${
                      browseMode === 'filme'
                        ? 'border-white bg-white text-[#0D0E12]'
                        : 'border-white/15 text-[var(--text-secondary)]'
                    }`}
                  >
                    Por Filme
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeBrowseMode('complexo');
                      setDrawerOpen(false);
                    }}
                    className={`min-h-[40px] rounded-lg border px-3 text-xs font-semibold ${
                      browseMode === 'complexo'
                        ? 'border-white bg-white text-[#0D0E12]'
                        : 'border-white/15 text-[var(--text-secondary)]'
                    }`}
                  >
                    Por Complexo
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => handleNavigateFromDrawer('auth')}
              className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <User className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{currentUser ? currentUser.name : 'Entrar / Criar Conta'}</span>
              </span>
              <span className="text-[11px] text-[var(--amber-progress)]">Conta</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigateFromDrawer('ops')}
              className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 text-xs font-semibold text-amber-200"
            >
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" aria-hidden="true" />
                CineFood Backstage (CRM Equipe)
              </span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleWorstCase}
              aria-pressed={worstCaseMode}
              className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border px-4 text-xs font-semibold ${
                worstCaseMode
                  ? 'border-rose-400/70 bg-rose-500/20 text-rose-200'
                  : 'border-white/15 bg-black/30 text-[var(--text-secondary)]'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Bug className="h-4 w-4" aria-hidden="true" />
                Modo Pior Caso (break-ui)
              </span>
              <span>{worstCaseMode ? 'ATIVO' : 'OFF'}</span>
            </button>
          </div>
        </nav>
      </dialog>
    </header>
  );
}
