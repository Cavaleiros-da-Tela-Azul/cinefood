import { useEffect, useId, useRef, useState } from 'react';
import { Film, Menu, Moon, Sun, Ticket, User, X } from 'lucide-react';
import { CustomerUser } from '../data/cinemaData';

export type AppStep =
  | 'home'
  | 'detail'
  | 'seats'
  | 'canteen'
  | 'reviews'
  | 'checkout'
  | 'ticket'
  | 'orders'
  | 'auth'
  | 'ops';

interface HeaderProps {
  currentStep: AppStep;
  oledMode: boolean;
  onToggleOled: () => void;
  onNavigate: (step: AppStep) => void;
  selectedSeatsCount: number;
  currentUser: CustomerUser | null;
}

const NAV_ITEMS: { step: AppStep; label: string }[] = [
  { step: 'home', label: 'Em Cartaz' },
  { step: 'detail', label: 'Sessões' },
  { step: 'canteen', label: 'Cantina' },
  { step: 'reviews', label: 'Catálogo' },
  { step: 'orders', label: 'Meus Ingressos' },
];

const FOCUS_RING_CLASS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]';

export function Header({
  currentStep,
  oledMode,
  onToggleOled,
  onNavigate,
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
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-1.5 px-3 py-2.5 sm:gap-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu de navegação"
            aria-expanded={drawerOpen}
            aria-controls={drawerId}
            className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition-colors hover:border-white/30 lg:hidden ${FOCUS_RING_CLASS}`}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`group flex min-h-[44px] min-w-0 items-center gap-1.5 rounded-lg px-0.5 text-left sm:gap-2.5 sm:px-1 ${FOCUS_RING_CLASS}`}
            aria-label="Voltar ao início do CineFood"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-red)] text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-transform duration-150 group-active:scale-95 sm:h-9 sm:w-9">
              <Film className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col leading-none">
              <span className="font-display truncate text-lg font-extrabold tracking-wide text-white sm:text-2xl">
                CINEFOOD
              </span>
              <span className="truncate whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)] sm:text-[11px] sm:tracking-[0.2em]">
                Cinema &amp; Cantina
              </span>
            </span>
          </button>
        </div>

        <nav aria-label="Navegação principal" className="hidden items-center gap-3 xl:gap-5 lg:flex">
          {NAV_ITEMS.map(({ step, label }) => {
            const active = currentStep === step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => onNavigate(step)}
                aria-current={active ? 'page' : undefined}
                className={`relative inline-flex min-h-[44px] items-center whitespace-nowrap rounded-md px-1.5 py-2 text-sm font-medium transition-colors ${FOCUS_RING_CLASS} ${
                  active ? 'text-white' : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--brand-red)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={onToggleOled}
            aria-pressed={oledMode}
            aria-label={oledMode ? 'Desativar Modo Sala Escura OLED' : 'Ativar Modo Sala Escura OLED'}
            title="Modo Sala Escura OLED — reduz emissão luminosa dentro da sala"
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors active:scale-95 ${FOCUS_RING_CLASS} ${
              oledMode
                ? 'border-[var(--amber-progress)]/60 bg-[var(--amber-progress)]/15 text-[#FCD34D]'
                : 'border-white/15 bg-white/5 text-[var(--text-secondary)] hover:border-white/30 hover:text-white'
            }`}
          >
            {oledMode ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('auth')}
            aria-label={currentUser ? `Conta de ${currentUser.name}` : 'Entrar ou criar conta'}
            className={`hidden min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95 sm:inline-flex ${FOCUS_RING_CLASS} ${
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
            onClick={() => onNavigate(selectedSeatsCount > 0 ? 'seats' : 'detail')}
            className={`inline-flex min-h-[44px] items-center gap-1 whitespace-nowrap rounded-md bg-[var(--brand-red)] px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--brand-red-hover)] active:scale-95 sm:gap-1.5 sm:px-3.5 sm:text-xs ${FOCUS_RING_CLASS}`}
          >
            <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{selectedSeatsCount > 0 ? `Comprar (${selectedSeatsCount})` : 'Comprar'}</span>
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
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 text-[var(--text-secondary)] hover:text-white ${FOCUS_RING_CLASS}`}
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
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-[44px] w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors ${FOCUS_RING_CLASS} ${
                        active
                          ? 'bg-[var(--brand-red)] text-white'
                          : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-2.5 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => handleNavigateFromDrawer('auth')}
              className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white ${FOCUS_RING_CLASS}`}
            >
              <span className="inline-flex items-center gap-2 truncate">
                <User className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{currentUser ? currentUser.name : 'Entrar / Criar Conta'}</span>
              </span>
              <span className="text-[11px] text-[var(--amber-progress)]">Conta</span>
            </button>
          </div>
        </nav>
      </dialog>
    </header>
  );
}
