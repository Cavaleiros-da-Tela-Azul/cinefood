import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Armchair,
  ArrowLeft,
  Check,
  Film,
  Minus,
  Plus,
  Popcorn,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import { CANTEEN_CATEGORIES, CanteenCategory, CanteenItem } from '../data/cinemaData';

export interface CanteenCatalogViewProps {
  items: CanteenItem[];
  cart: Record<string, { qty: number; addons: string[] }>;
  deliveryMode: 'seat' | 'counter';
  hasActiveTicket: boolean;
  activeTicketLabel?: string;
  onUpdateQty: (itemId: string, delta: number) => void;
  onToggleAddon: (itemId: string, addonId: string) => void;
  onChangeDeliveryMode: (mode: 'seat' | 'counter') => void;
  onCheckoutCanteenOnly: () => void;
  onBackToMovies: () => void;
}

const FOCUS_RING_CLASS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]';

function formatPrice(value: number): string {
  return Number.isInteger(value) ? `R$ ${value}` : `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function CanteenCatalogView({
  items,
  cart,
  deliveryMode,
  hasActiveTicket,
  activeTicketLabel,
  onUpdateQty,
  onToggleAddon,
  onChangeDeliveryMode,
  onCheckoutCanteenOnly,
  onBackToMovies,
}: CanteenCatalogViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<CanteenCategory | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [seatBlockedNotice, setSeatBlockedNotice] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: items.length };
    for (const item of items) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tag.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery, selectedCategory]);

  const cartLines = useMemo(() => {
    return items
      .map((item) => {
        const entry = cart[item.id];
        if (!entry || entry.qty <= 0) return null;
        const selectedAddons = item.addons.filter((addon) => entry.addons.includes(addon.id));
        const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
        const unitPrice = item.price + addonsTotal;
        return {
          item,
          qty: entry.qty,
          selectedAddons,
          lineTotal: unitPrice * entry.qty,
          hasStockConflict: item.stock === 0 || entry.qty > item.stock,
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
  }, [items, cart]);

  const totalUnits = cartLines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const stockConflicts = cartLines.filter((line) => line.hasStockConflict);
  const hasStockConflict = stockConflicts.length > 0;
  const seatModeBlocked = deliveryMode === 'seat' && !hasActiveTicket;

  const handleSelectSeatMode = () => {
    if (!hasActiveTicket) {
      setSeatBlockedNotice(true);
      return;
    }
    setSeatBlockedNotice(false);
    onChangeDeliveryMode('seat');
  };

  const handleSelectCounterMode = () => {
    setSeatBlockedNotice(false);
    onChangeDeliveryMode('counter');
  };

  const getCategoryLabel = (category: CanteenCategory): string => {
    return CANTEEN_CATEGORIES.find((c) => c.id === category)?.label ?? category;
  };

  return (
    <section
      aria-label="Vitrine e cardápio da cantina"
      className="relative min-h-[calc(100dvh-68px)] overflow-x-hidden bg-[var(--bg-base)] pb-24 lg:pb-10"
    >
      {/* Subtle Culinary Atmospheric Backdrop (03_ref1 + 03_ref3) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-75"
        style={{
          background:
            'radial-gradient(circle at 18% 12%, rgba(245, 158, 11, 0.14) 0%, transparent 42%), radial-gradient(circle at 86% 24%, rgba(196, 10, 20, 0.12) 0%, transparent 45%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-8 sm:py-8">
        {/* Top Editorial Header (03_ref2 + 03_ref3) */}
        <div className="mb-4 flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-6">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onBackToMovies}
              className={`cine-press mb-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] backdrop-blur-md hover:border-[var(--border-strong)] hover:text-white sm:mb-4 ${FOCUS_RING_CLASS}`}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Voltar aos Filmes</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--amber-progress)]">
              <Popcorn className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Bomboniere &amp; Lounge Gastronômico</span>
            </div>
            <h1 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.02em] text-white sm:text-5xl">
              Cardápio da Bomboniere
            </h1>
            <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)] sm:mt-1.5 sm:line-clamp-none sm:text-sm">
              Combos artesanais, pipocas frescas, bebidas e doces disponíveis em tempo real. Retire na fila expressa do balcão ou receba diretamente na sua poltrona durante a sessão.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-3.5 self-start rounded-2xl border border-[var(--amber-progress)]/35 bg-[var(--bg-elevated)]/80 px-4 py-3 backdrop-blur-md shadow-xl sm:flex sm:self-auto">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--amber-progress)]/15 text-[var(--amber-progress)]">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Sacola da Cantina
              </p>
              <p className="font-mono-tabular text-base font-extrabold text-white">
                {totalUnits} {totalUnits === 1 ? 'item' : 'itens'} · {formatPrice(subtotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter Strip + Search Toolbar (03_ref2) */}
        <div className="mb-5 flex flex-col gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 p-3 backdrop-blur-md sm:mb-6 sm:gap-3 sm:p-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Categorias da cantina"
            className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {CANTEEN_CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.id;
              const count = categoryCounts[category.id] ?? 0;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`cine-press inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors sm:px-4 ${FOCUS_RING_CLASS} ${
                    isSelected
                      ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white shadow-[0_6px_20px_var(--brand-red-glow)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-white'
                  }`}
                >
                  <span>{category.label}</span>
                  <span
                    className={`font-mono-tabular rounded-full px-1.5 py-0.5 text-[11px] ${
                      isSelected ? 'bg-black/25 text-white' : 'bg-black/30 text-[var(--text-muted)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:max-w-sm">
            <label htmlFor="canteen-catalog-search" className="sr-only">
              Buscar produtos no cardápio da cantina
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <input
              id="canteen-catalog-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar combo, pipoca, bebida ou doce..."
              className={`min-h-[44px] w-full rounded-full border border-[var(--border-subtle)] bg-black/45 py-2.5 pl-10 pr-11 text-base text-white placeholder:text-[var(--text-muted)] sm:text-sm ${FOCUS_RING_CLASS}`}
            />
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca da cantina"
                className={`absolute right-1 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-white ${FOCUS_RING_CLASS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Split: Product Showcase + Sticky Delivery & Summary Rail */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Product Grid (03_ref3 + 03_ref4) */}
          <div className="lg:col-span-8">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 px-6 py-14 text-center backdrop-blur-md">
                <Popcorn className="h-9 w-9 text-[var(--amber-progress)]" aria-hidden="true" />
                <h2 className="mt-3 text-base font-bold text-white">
                  Nenhum item encontrado
                </h2>
                <p className="mt-1 max-w-md text-sm text-[var(--text-secondary)]">
                  Não há produtos disponíveis para o filtro atual. Limpe a busca ou selecione outra categoria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('todos');
                    setSearchQuery('');
                  }}
                  className={`cine-press mt-5 inline-flex min-h-[44px] items-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 ${FOCUS_RING_CLASS}`}
                >
                  Mostrar todos os itens
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                {filteredItems.map((item) => {
                  const cartEntry = cart[item.id];
                  const qty = cartEntry?.qty ?? 0;
                  const selectedAddonIds = cartEntry?.addons ?? [];
                  const soldOut = item.stock === 0;
                  const atMaxStock = qty >= item.stock;
                  const lowStock = !soldOut && item.stock <= 3;

                  return (
                    <article
                      key={item.id}
                      className={`cine-card-hover group flex flex-col justify-between overflow-hidden rounded-2xl border backdrop-blur-md transition-colors ${
                        soldOut
                          ? 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/65 opacity-80'
                          : qty > 0
                            ? 'border-[var(--amber-progress)]/60 bg-[var(--bg-surface)]/90 shadow-[0_14px_34px_rgba(0,0,0,0.45)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 hover:border-white/25'
                      }`}
                    >
                      <div className="flex flex-row md:flex-col">
                        {/* Food Hero Image Strip (compact thumbnail on < md, full banner on md+) */}
                        <div className="relative m-3 h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black md:m-0 md:h-44 md:w-full md:rounded-none">
                          <img
                            src={item.imageSrc}
                            alt={item.name}
                            className={`cine-card-media h-full w-full object-cover ${soldOut ? 'grayscale' : ''}`}
                          />
                          <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-[var(--bg-surface)] via-black/25 to-black/35 md:block" />

                          <div className="absolute inset-x-3 top-3 hidden items-center justify-between gap-2 md:flex">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                                soldOut
                                  ? 'bg-rose-600/90 text-white'
                                  : 'border border-[var(--amber-progress)]/40 bg-black/70 text-[#FCD34D]'
                              }`}
                            >
                              {soldOut ? 'Esgotado' : item.tag}
                            </span>

                            <span className="rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] backdrop-blur-md">
                              {getCategoryLabel(item.category)}
                            </span>
                          </div>

                          {qty > 0 && (
                            <span className="font-mono-tabular absolute bottom-1.5 right-1.5 rounded-full bg-[var(--brand-red)] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-lg md:bottom-3 md:right-3 md:px-2.5 md:py-1 md:text-[11px]">
                              {qty}× <span className="hidden md:inline">na sacola</span>
                            </span>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between py-3 pr-3 md:p-4">
                          <div>
                            <div className="mb-1 flex flex-wrap items-center gap-1.5 md:hidden">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  soldOut
                                    ? 'bg-rose-600/90 text-white'
                                    : 'border border-[var(--amber-progress)]/40 bg-black/45 text-[#FCD34D]'
                                }`}
                              >
                                {soldOut ? 'Esgotado' : item.tag}
                              </span>
                            </div>
                            <h2 className="font-display line-clamp-1 break-words text-xl font-bold uppercase leading-tight text-white md:line-clamp-none md:text-2xl">
                              {item.name}
                            </h2>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)] md:mt-1 md:line-clamp-none">
                              {item.description}
                            </p>
                          </div>

                          <div className="mt-2.5 md:mt-4">
                            {/* Stock & Price + Stepper Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5 md:gap-3 md:pt-3">
                              <div>
                                <p className="font-mono-tabular text-lg font-extrabold text-white md:text-xl">
                                  {formatPrice(item.price)}
                                </p>
                                <p
                                  className={`text-[11px] font-medium ${
                                    soldOut
                                      ? 'text-rose-300'
                                      : lowStock
                                        ? 'text-[var(--amber-progress)]'
                                        : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  {soldOut
                                    ? 'Indisponível no estoque'
                                    : lowStock
                                      ? `Últimas ${item.stock} un.`
                                      : `Disponível: ${item.stock} un.`}
                                </p>
                              </div>

                              <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 p-0.5 md:p-1">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.id, -1)}
                                  disabled={qty === 0}
                                  aria-label={`Remover uma unidade de ${item.name}`}
                                  className={`cine-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 ${FOCUS_RING_CLASS}`}
                                >
                                  <Minus className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <span
                                  aria-live="polite"
                                  className="font-mono-tabular min-w-[2ch] px-1 text-center text-sm font-bold text-white"
                                >
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.id, 1)}
                                  disabled={soldOut || atMaxStock}
                                  aria-label={`Adicionar uma unidade de ${item.name}`}
                                  className={`cine-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-35 ${FOCUS_RING_CLASS}`}
                                >
                                  <Plus className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>
                            </div>

                            {!soldOut && atMaxStock && qty > 0 && (
                              <p className="mt-1.5 text-right text-[11px] font-medium text-[var(--amber-progress)]">
                                Limite máximo disponível ({item.stock} un.) atingido
                              </p>
                            )}

                            {/* Add-ons (03_ref5 customization pills - shown cleanly when added on mobile, always teased on desktop) */}
                            {item.addons.length > 0 && (
                              <div className={`mt-2.5 border-t border-white/10 pt-2.5 md:mt-3 md:pt-3 ${qty === 0 ? 'hidden md:block' : ''}`}>
                                <AnimatePresence initial={false} mode="wait">
                                  {qty > 0 ? (
                                    <motion.div
                                      key="addons-active"
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -4 }}
                                      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                                    >
                                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--amber-progress)]">
                                        Personalizar adicionais
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {item.addons.map((addon) => {
                                          const checked = selectedAddonIds.includes(addon.id);
                                          return (
                                            <button
                                              key={addon.id}
                                              type="button"
                                              aria-pressed={checked}
                                              onClick={() => onToggleAddon(item.id, addon.id)}
                                              className={`cine-press inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${FOCUS_RING_CLASS} ${
                                                checked
                                                  ? 'border-[var(--amber-progress)] bg-[var(--amber-progress)]/20 text-white'
                                                  : 'border-white/15 bg-black/35 text-[var(--text-secondary)] hover:border-white/35 hover:text-white'
                                              }`}
                                            >
                                              {checked && (
                                                <Check className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />
                                              )}
                                              <span>
                                                + {addon.label} ({formatPrice(addon.price)})
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  ) : (
                                    <p key="addons-hint" className="text-xs text-[var(--text-muted)]">
                                      Adicionais opcionais:{' '}
                                      {item.addons.map((a) => `${a.label} (+${formatPrice(a.price)})`).join(' · ')}
                                    </p>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Delivery & Summary Panel (03_ref1 + 03_ref5) */}
          <aside
            aria-label="Resumo do pedido da cantina e entrega"
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/85 p-5 backdrop-blur-md shadow-2xl lg:sticky lg:top-24 lg:col-span-4"
          >
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide text-white">
              Entrega e Resumo
            </h2>

            {/* Delivery mode selector */}
            <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Modo de entrega da cantina">
              <button
                type="button"
                role="radio"
                aria-checked={deliveryMode === 'counter'}
                onClick={handleSelectCounterMode}
                className={`cine-press flex min-h-[44px] w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${FOCUS_RING_CLASS} ${
                  deliveryMode === 'counter'
                    ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                    : 'border-white/15 bg-black/30 hover:border-white/30'
                }`}
              >
                <Store
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    deliveryMode === 'counter' ? 'text-[var(--amber-progress)]' : 'text-[var(--text-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">
                    Retirada no balcão (sem precisar de ingresso)
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Pedido independente da cantina. Retire na fila expressa da bomboniere com seu código.
                  </p>
                </div>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={deliveryMode === 'seat' && hasActiveTicket}
                aria-disabled={!hasActiveTicket}
                onClick={handleSelectSeatMode}
                className={`cine-press flex min-h-[44px] w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${FOCUS_RING_CLASS} ${
                  !hasActiveTicket
                    ? 'cursor-not-allowed border-white/10 bg-black/25 opacity-65'
                    : deliveryMode === 'seat'
                      ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                      : 'border-white/15 bg-black/30 hover:border-white/30'
                }`}
              >
                <Armchair
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    hasActiveTicket && deliveryMode === 'seat'
                      ? 'text-[var(--amber-progress)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">
                    Entregar no meu assento
                  </p>
                  {hasActiveTicket ? (
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {activeTicketLabel
                        ? `Ingresso ativo: ${activeTicketLabel}`
                        : 'O preparo inicia automaticamente após validar seu QR na portaria.'}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Disponível somente com um ingresso ativo na sessão.
                    </p>
                  )}
                </div>
              </button>
            </div>

            {!hasActiveTicket && (
              <div
                role={seatBlockedNotice || seatModeBlocked ? 'alert' : 'status'}
                className={`mt-3 rounded-xl border p-3.5 text-xs ${
                  seatBlockedNotice || seatModeBlocked
                    ? 'border-[var(--amber-progress)]/60 bg-[var(--amber-progress)]/15 text-white'
                    : 'border-white/10 bg-black/30 text-[var(--text-secondary)]'
                }`}
              >
                <p className="font-semibold text-white">
                  Entrega no assento requer ingresso ativo
                </p>
                <p className="mt-1 leading-relaxed text-[var(--text-secondary)]">
                  Para comprar apenas pela vitrine da cantina sem ingresso, use{' '}
                  <strong className="text-white">Retirada no balcão</strong> ou escolha um filme e sessão primeiro.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {deliveryMode !== 'counter' && (
                    <button
                      type="button"
                      onClick={handleSelectCounterMode}
                      className={`cine-press inline-flex min-h-[44px] items-center rounded-lg bg-[var(--brand-red)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)] ${FOCUS_RING_CLASS}`}
                    >
                      Usar retirada no balcão
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onBackToMovies}
                    className={`cine-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 ${FOCUS_RING_CLASS}`}
                  >
                    <Film className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Escolher filme e sessão</span>
                  </button>
                </div>
              </div>
            )}

            {hasStockConflict && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-400/50 bg-rose-500/15 p-3.5 text-xs text-rose-100"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
                <div>
                  <p className="font-bold">Item indisponível no estoque</p>
                  <p className="mt-0.5 text-rose-200/90">
                    Ajuste as quantidades de {stockConflicts.map((c) => c.item.name).join(', ')} antes de finalizar.
                  </p>
                </div>
              </div>
            )}

            {/* Selected items list */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Itens selecionados
              </p>

              {cartLines.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-white/15 bg-black/25 px-3.5 py-4 text-center text-xs text-[var(--text-secondary)]">
                  Sua sacola está vazia. Selecione produtos ao lado para liberar o pagamento.
                </p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {cartLines.map((line) => (
                    <li
                      key={line.item.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white">
                          {line.qty}× {line.item.name}
                        </p>
                        {line.selectedAddons.length > 0 && (
                          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                            + {line.selectedAddons.map((a) => a.label).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-mono-tabular shrink-0 font-bold text-white">
                        {formatPrice(line.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Subtotal da Cantina
                </span>
                <span className="font-mono-tabular text-2xl font-extrabold text-white">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={cartLines.length === 0 || hasStockConflict || seatModeBlocked}
              onClick={onCheckoutCanteenOnly}
              className={`cine-press mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_10px_28px_rgba(0,0,0,0.45)] transition-colors hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS}`}
            >
              <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Finalizar Pedido da Cantina</span>
            </button>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[11px] text-[var(--text-secondary)]">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--success-emerald)]" aria-hidden="true" />
              <span>
                Preços e disponibilidade confirmados no fechamento do pedido.
              </span>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bag Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-[var(--bg-glass)] px-4 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {totalUnits} {totalUnits === 1 ? 'item' : 'itens'} · {deliveryMode === 'seat' && hasActiveTicket ? 'No assento' : 'Balcão'}
            </p>
            <p className="font-mono-tabular text-lg font-extrabold text-white">{formatPrice(subtotal)}</p>
          </div>
          <button
            type="button"
            disabled={cartLines.length === 0 || hasStockConflict || seatModeBlocked}
            onClick={onCheckoutCanteenOnly}
            className={`cine-press inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS}`}
          >
            <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Finalizar</span>
          </button>
        </div>
      </div>
    </section>
  );
}
