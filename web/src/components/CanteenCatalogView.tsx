import { useMemo, useState } from 'react';
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
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      {/* Top navigation & hero header */}
      <div className="mb-6 flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBackToMovies}
            className={`mb-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] ${FOCUS_RING_CLASS}`}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Voltar aos Filmes</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--amber-progress)]">
            <Popcorn className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Vitrine Pública da Cantina · Bomboniere CineFood</span>
          </div>
          <h1 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Cardápio da Bomboniere
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">
            Consulte combos, pipocas, bebidas e doces em tempo real. Peça para retirada rápida no balcão sem precisar de ingresso ou vincule a entrega ao seu assento ativo.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 sm:self-auto">
          <ShoppingBag className="h-5 w-5 text-[var(--amber-progress)]" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Sacola da Cantina
            </p>
            <p className="font-mono-tabular text-sm font-bold text-[var(--text-primary)]">
              {totalUnits} {totalUnits === 1 ? 'item' : 'itens'} · {formatPrice(subtotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Category tabs + search */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Categorias da cantina"
          className="flex flex-wrap gap-2"
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
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${FOCUS_RING_CLASS} ${
                  isSelected
                    ? 'border-[var(--brand-red)] bg-[var(--brand-red)] text-white shadow-[0_6px_20px_var(--brand-red-glow)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{category.label}</span>
                <span
                  className={`font-mono-tabular rounded-full px-1.5 py-0.5 text-[11px] ${
                    isSelected
                      ? 'bg-black/25 text-white'
                      : 'bg-black/25 text-[var(--text-muted)]'
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
            className={`min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-11 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] sm:text-sm ${FOCUS_RING_CLASS}`}
          />
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpar busca da cantina"
              className={`absolute right-1 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${FOCUS_RING_CLASS}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Main content layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Product Grid */}
        <div className="lg:col-span-8">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-6 py-12 text-center">
              <Popcorn className="h-8 w-8 text-[var(--text-muted)]" aria-hidden="true" />
              <h2 className="mt-3 text-base font-bold text-[var(--text-primary)]">
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
                className={`mt-4 inline-flex min-h-[44px] items-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-white/10 ${FOCUS_RING_CLASS}`}
              >
                Mostrar todos os itens
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    className={`group flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
                      soldOut
                        ? 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] opacity-80'
                        : qty > 0
                          ? 'border-[var(--brand-red)]/60 bg-[var(--bg-surface)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                    }`}
                  >
                    <div>
                      <div className="flex gap-4">
                        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] sm:h-32 sm:w-32">
                          <img
                            src={item.imageSrc}
                            alt={item.name}
                            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${soldOut ? 'grayscale' : ''}`}
                          />
                          {soldOut && (
                            <span className="absolute inset-x-1 bottom-1 rounded bg-rose-600/95 px-1.5 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                              Esgotado
                            </span>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                soldOut
                                  ? 'bg-rose-500/20 text-rose-200'
                                  : 'bg-white/10 text-[var(--amber-progress)]'
                              }`}
                            >
                              {soldOut ? 'Esgotado' : item.tag}
                            </span>
                            <span className="rounded border border-[var(--border-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                              {getCategoryLabel(item.category)}
                            </span>
                          </div>

                          <h2 className="mt-1.5 break-words text-base font-bold leading-snug text-[var(--text-primary)]">
                            {item.name}
                          </h2>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Stock & Price row */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
                        <div>
                          <p className="font-mono-tabular text-lg font-extrabold text-[var(--text-primary)]">
                            {formatPrice(item.price)}
                          </p>
                          <p
                            className={`text-xs font-medium ${
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
                                ? `Últimas ${item.stock} un. em estoque`
                                : `Estoque disponível: ${item.stock} un.`}
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] p-1">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, -1)}
                            disabled={qty === 0}
                            aria-label={`Remover uma unidade de ${item.name}`}
                            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 ${FOCUS_RING_CLASS}`}
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <span
                            aria-live="polite"
                            className="font-mono-tabular min-w-[2ch] px-1 text-center text-sm font-bold text-[var(--text-primary)]"
                          >
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, 1)}
                            disabled={soldOut || atMaxStock}
                            aria-label={`Adicionar uma unidade de ${item.name}`}
                            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[var(--brand-red)] text-white transition-colors hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-35 ${FOCUS_RING_CLASS}`}
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {!soldOut && atMaxStock && qty > 0 && (
                        <p className="mt-1.5 text-right text-[11px] font-medium text-[var(--amber-progress)]">
                          Limite máximo do estoque ({item.stock} un.) atingido
                        </p>
                      )}
                    </div>

                    {/* Add-ons */}
                    {item.addons.length > 0 && (
                      <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
                        {qty > 0 ? (
                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                              Adicionais por unidade
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
                                    className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${FOCUS_RING_CLASS} ${
                                      checked
                                        ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/20 text-[var(--text-primary)]'
                                        : 'border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                                    }`}
                                  >
                                    {checked && <Check className="h-3.5 w-3.5 text-[var(--amber-progress)]" aria-hidden="true" />}
                                    <span>
                                      + {addon.label} ({formatPrice(addon.price)})
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--text-muted)]">
                            Adicionais opcionais:{' '}
                            {item.addons.map((a) => `${a.label} (+${formatPrice(a.price)})`).join(' · ')}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary & Delivery Panel */}
        <aside
          aria-label="Resumo do pedido da cantina e entrega"
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 lg:sticky lg:top-24 lg:col-span-4"
        >
          <h2 className="font-display text-xl font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
            Entrega e Resumo
          </h2>

          {/* Delivery mode selector */}
          <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Modo de entrega da cantina">
            <button
              type="button"
              role="radio"
              aria-checked={deliveryMode === 'counter'}
              onClick={handleSelectCounterMode}
              className={`flex min-h-[44px] w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${FOCUS_RING_CLASS} ${
                deliveryMode === 'counter'
                  ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
              }`}
            >
              <Store
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  deliveryMode === 'counter' ? 'text-[var(--amber-progress)]' : 'text-[var(--text-muted)]'
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)]">
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
              className={`flex min-h-[44px] w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${FOCUS_RING_CLASS} ${
                !hasActiveTicket
                  ? 'cursor-not-allowed border-[var(--border-subtle)] bg-[var(--bg-base)] opacity-70'
                  : deliveryMode === 'seat'
                    ? 'border-[var(--brand-red)] bg-[var(--brand-red)]/15'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
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
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Entregar no meu assento
                </p>
                {hasActiveTicket ? (
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {activeTicketLabel
                      ? `Ingresso ativo: ${activeTicketLabel}`
                      : 'Preparo inicia após validar seu QR na portaria.'}
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
                  ? 'border-[var(--amber-progress)]/60 bg-[var(--amber-progress)]/15 text-[var(--text-primary)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-secondary)]'
              }`}
            >
              <p className="font-semibold text-[var(--text-primary)]">
                Entrega no assento requer ingresso ativo
              </p>
              <p className="mt-1 leading-relaxed text-[var(--text-secondary)]">
                Para comprar apenas pela vitrine da cantina sem ingresso, use{' '}
                <strong className="text-[var(--text-primary)]">Retirada no balcão</strong> ou escolha um filme e sessão primeiro.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {deliveryMode !== 'counter' && (
                  <button
                    type="button"
                    onClick={handleSelectCounterMode}
                    className={`inline-flex min-h-[44px] items-center rounded-lg bg-[var(--brand-red)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)] ${FOCUS_RING_CLASS}`}
                  >
                    Usar retirada no balcão
                  </button>
                )}
                <button
                  type="button"
                  onClick={onBackToMovies}
                  className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-white/10 ${FOCUS_RING_CLASS}`}
                >
                  <Film className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Escolher filme e sessão</span>
                </button>
              </div>
            </div>
          )}

          {/* Stock conflict alert */}
          {hasStockConflict && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-400/50 bg-rose-500/15 p-3.5 text-xs text-rose-100"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
              <div>
                <p className="font-bold">Controle de estoque atômico — item indisponível no momento</p>
                <p className="mt-0.5 text-rose-200/90">
                  Ajuste as quantidades de {stockConflicts.map((c) => c.item.name).join(', ')} antes de finalizar.
                </p>
              </div>
            </div>
          )}

          {/* Selected items list */}
          <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Itens selecionados
            </p>

            {cartLines.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-4 text-center text-xs text-[var(--text-secondary)]">
                Seu carrinho está vazio. Selecione produtos ao lado para liberar o pagamento.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {cartLines.map((line) => (
                  <li
                    key={line.item.id}
                    className="flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-primary)]">
                        {line.qty}× {line.item.name}
                      </p>
                      {line.selectedAddons.length > 0 && (
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          + {line.selectedAddons.map((a) => a.label).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-mono-tabular shrink-0 font-bold text-[var(--text-primary)]">
                      {formatPrice(line.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-baseline justify-between border-t border-[var(--border-subtle)] pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Subtotal da Cantina
              </span>
              <span className="font-mono-tabular text-2xl font-extrabold text-[var(--text-primary)]">
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={cartLines.length === 0 || hasStockConflict || seatModeBlocked}
            onClick={onCheckoutCanteenOnly}
            className={`mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_var(--brand-red-glow)] transition-colors hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING_CLASS}`}
          >
            <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Finalizar Pedido da Cantina</span>
          </button>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2.5 text-[11px] text-[var(--text-secondary)]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--success-emerald)]" aria-hidden="true" />
            <span>
              Preços e disponibilidade confirmados no fechamento do pedido.
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
