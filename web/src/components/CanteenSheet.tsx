import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useDragControls, useMotionValue, useTransform } from 'motion/react';
import { AlertTriangle, Armchair, Check, Minus, Plus, Popcorn, ShieldCheck, ShoppingBag, Store, X } from 'lucide-react';
import { CanteenItem } from '../data/cinemaData';

export interface CartComboLine {
  item: CanteenItem;
  quantity: number;
  selectedAddonIds: string[];
}

export type DeliveryMode = 'seat' | 'counter';

export interface CanteenSheetProps {
  open: boolean;
  items: CanteenItem[];
  onClose: () => void;
  cart: CartComboLine[];
  onUpdateQuantity: (item: CanteenItem, delta: number) => void;
  onToggleAddon: (itemId: string, addonId: string) => void;
  deliveryMode: DeliveryMode;
  onChangeDeliveryMode: (mode: DeliveryMode) => void;
  onSkipCanteen: () => void;
  onConfirmCanteen: () => void;
  seatLabels: string[];
  hasActiveTicket?: boolean;
}

const FOCUS_RING_CLASS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]';

export function CanteenSheet({
  open,
  items,
  onClose,
  cart,
  onUpdateQuantity,
  onToggleAddon,
  deliveryMode,
  onChangeDeliveryMode,
  onSkipCanteen,
  onConfirmCanteen,
  seatLabels,
  hasActiveTicket = false,
}: CanteenSheetProps) {
  const dragY = useMotionValue(0);
  const overlayOpacity = useTransform(dragY, [0, 320], [1, 0]);
  const dragControls = useDragControls();
  const [seatBlockedNotice, setSeatBlockedNotice] = useState(false);
  const dialogContainerRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const hasSeatsOrActiveTicket = seatLabels.length > 0 || hasActiveTicket;
  const seatModeUnavailable = deliveryMode === 'seat' && !hasSeatsOrActiveTicket;

  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      dragY.set(0);
      setSeatBlockedNotice(false);
      window.requestAnimationFrame(() => {
        const container = dialogContainerRef.current;
        if (!container) return;
        const firstFocusable = container.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        firstFocusable?.focus();
      });
    } else if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
      lastFocusedRef.current = null;
    }
  }, [open, dragY]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogContainerRef.current) {
        const focusables = Array.from(
          dialogContainerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const canteenTotal = cart.reduce((acc, line) => {
    const addonsSum = line.item.addons
      .filter((a) => line.selectedAddonIds.includes(a.id))
      .reduce((s, a) => s + a.price, 0);
    return acc + (line.item.price + addonsSum) * line.quantity;
  }, 0);

  const outOfStockInCart = cart.filter((line) => {
    const liveItem = items.find((i) => i.id === line.item.id);
    return liveItem ? liveItem.stock === 0 || line.quantity > liveItem.stock : false;
  });

  const handleSelectSeatDelivery = () => {
    if (!hasSeatsOrActiveTicket) {
      setSeatBlockedNotice(true);
      return;
    }
    setSeatBlockedNotice(false);
    onChangeDeliveryMode('seat');
  };

  const handleSelectCounterPickup = () => {
    setSeatBlockedNotice(false);
    onChangeDeliveryMode('counter');
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          ref={dialogContainerRef}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Bomboniere e Cantina CineFood"
        >
          <motion.div
            style={{ opacity: overlayOpacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            style={{ y: dragY }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 140 || info.velocity.y > 500) {
                onClose();
              }
            }}
            initial={{ y: '100%', opacity: 0.85 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0, transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] } }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.36 }}
            className="relative z-10 flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-2xl sm:rounded-2xl"
          >
            {/* Mobile Drag Handle & Gesture Header (gestures skill: 1:1 tracking without blocking scroll) */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: 'pan-x' }}
              className="cursor-grab active:cursor-grabbing"
            >
              <div className="flex justify-center pt-3 sm:hidden">
                <span className="h-1.5 w-12 rounded-full bg-white/25" />
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--amber-progress)]">
                    <Popcorn className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Etapa 2 · Cantina Dine-In</span>
                  </div>
                  <h2 className="font-display mt-1 text-2xl font-extrabold uppercase text-white sm:text-3xl">
                    Adiante seu Combo da Bomboniere
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                    {seatLabels.length > 0 ? (
                      <>
                        Poltronas vinculadas:{' '}
                        <strong className="font-mono-tabular text-white">{seatLabels.join(', ')}</strong>
                      </>
                    ) : hasActiveTicket ? (
                      <strong className="text-white">
                        Ingresso ativo vinculado para entrega no assento
                      </strong>
                    ) : (
                      <span>Pedido independente para retirada no balcão</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  onClick={onClose}
                  aria-label="Fechar cantina"
                  className={`cine-press inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-white ${FOCUS_RING_CLASS}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              {outOfStockInCart.length > 0 && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-400/50 bg-rose-500/15 p-3.5 text-xs text-rose-100"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
                  <div>
                    <p className="font-bold uppercase tracking-wider">
                      Item indisponível no estoque
                    </p>
                    <p className="mt-0.5 text-rose-200/90">
                      Um item selecionado esgotou ou excedeu o disponível ({outOfStockInCart.map((c) => c.item.name).join(', ')}). Ajuste as quantidades antes de prosseguir.
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery Channel Selector */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Canal de entrega da cantina">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={deliveryMode === 'seat' && hasSeatsOrActiveTicket}
                    aria-disabled={!hasSeatsOrActiveTicket}
                    onClick={handleSelectSeatDelivery}
                    className={`cine-press flex min-h-[44px] items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${FOCUS_RING_CLASS} ${
                      !hasSeatsOrActiveTicket
                        ? 'cursor-not-allowed border-[var(--border-subtle)] bg-[var(--bg-base)] opacity-65'
                        : deliveryMode === 'seat'
                          ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <Armchair className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber-progress)]" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">Entregar no meu assento</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {hasSeatsOrActiveTicket
                          ? 'Preparo inicia automaticamente após validar seu QR na portaria.'
                          : 'Requer assento selecionado ou ingresso ativo na sessão.'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={deliveryMode === 'counter'}
                    onClick={handleSelectCounterPickup}
                    className={`cine-press flex min-h-[44px] items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${FOCUS_RING_CLASS} ${
                      deliveryMode === 'counter'
                        ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <Store className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber-progress)]" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">Retirar no balcão</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Retire na fila expressa da bomboniere sem precisar de assento vinculado.
                      </p>
                    </div>
                  </button>
                </div>

                {(seatBlockedNotice || seatModeUnavailable) && (
                  <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--amber-progress)]/50 bg-[var(--amber-progress)]/15 px-3.5 py-2.5 text-xs text-white"
                  >
                    <span>
                      Para entrega no assento, selecione poltronas ou possua um ingresso ativo. Você pode retirar diretamente no balcão.
                    </span>
                    {deliveryMode !== 'counter' && (
                      <button
                        type="button"
                        onClick={handleSelectCounterPickup}
                        className={`cine-press inline-flex min-h-[44px] items-center rounded-lg bg-[var(--brand-red)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)] ${FOCUS_RING_CLASS}`}
                      >
                        Usar retirada no balcão
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Combos List */}
              <div className="space-y-3">
                {items.map((item) => {
                  const line = cart.find((c) => c.item.id === item.id);
                  const qty = line?.quantity ?? 0;
                  const soldOut = item.stock === 0;
                  const atMaxStock = qty >= item.stock;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 transition-colors ${
                        soldOut
                          ? 'border-[var(--border-subtle)] bg-[var(--bg-base)] opacity-75'
                          : qty > 0
                            ? 'border-[var(--amber-progress)]/55 bg-[var(--bg-surface)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/85'
                      }`}
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.imageSrc}
                          alt={item.name}
                          className="h-22 w-22 shrink-0 rounded-xl border border-white/10 object-cover"
                        />
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  soldOut
                                    ? 'bg-rose-500/20 text-rose-200'
                                    : 'bg-[var(--amber-progress)]/15 text-[#FCD34D]'
                                }`}
                              >
                                {soldOut ? 'Esgotado' : item.tag}
                              </span>
                              {!soldOut && item.stock <= 3 && (
                                <span className="text-[11px] text-[var(--text-muted)]">
                                  Restam {item.stock} un.
                                </span>
                              )}
                            </div>
                            <h3 className="mt-1 break-words text-sm font-bold text-white">
                              {item.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                              {item.description}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="font-mono-tabular text-base font-extrabold text-white">
                              R$ {item.price}
                            </span>

                            <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] p-1">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item, -1)}
                                disabled={qty === 0}
                                aria-label={`Remover uma unidade de ${item.name}`}
                                className={`cine-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 ${FOCUS_RING_CLASS}`}
                              >
                                <Minus className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <span className="font-mono-tabular w-6 text-center text-sm font-bold text-white">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item, 1)}
                                disabled={soldOut || atMaxStock}
                                aria-label={`Adicionar uma unidade de ${item.name}`}
                                className={`cine-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-35 ${FOCUS_RING_CLASS}`}
                              >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {qty > 0 && item.addons.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
                          {item.addons.map((addon) => {
                            const checked = line?.selectedAddonIds.includes(addon.id) ?? false;
                            return (
                              <button
                                key={addon.id}
                                type="button"
                                aria-pressed={checked}
                                onClick={() => onToggleAddon(item.id, addon.id)}
                                className={`cine-press inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${FOCUS_RING_CLASS} ${
                                  checked
                                    ? 'border-[var(--amber-progress)] bg-[var(--amber-progress)]/20 text-white'
                                    : 'border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-white'
                                }`}
                              >
                                {checked && <Check className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />}
                                <span>
                                  + {addon.label} (R$ {addon.price})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--success-emerald)]" aria-hidden="true" />
                <span>
                  Preços e disponibilidade são confirmados automaticamente no fechamento da compra.
                </span>
              </div>
            </div>

            {/* Footer Actions with Non-Intrusive Skip */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-base)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  Subtotal Cantina
                </p>
                <p className="font-mono-tabular text-xl font-extrabold text-white">
                  R$ {canteenTotal}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onSkipCanteen}
                  className={`cine-press min-h-[44px] rounded-xl border border-[var(--border-strong)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:border-white/40 hover:text-white ${FOCUS_RING_CLASS}`}
                >
                  Pular Alimentação
                </button>
                <button
                  type="button"
                  disabled={outOfStockInCart.length > 0 || seatModeUnavailable}
                  onClick={onConfirmCanteen}
                  className={`cine-press inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS}`}
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  <span>Ir para Pagamento</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
