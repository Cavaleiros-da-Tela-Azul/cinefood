import type {
  AtomicStockReservationResult,
  CanteenAddon,
  CanteenOrder,
  CanteenProduct,
  StockReservationLine,
} from './types.ts';

export interface CanteenRepository {
  upsertProduct(product: CanteenProduct): Promise<CanteenProduct>;
  findProductById(productId: string): Promise<CanteenProduct | undefined>;
  listActiveProducts(): Promise<CanteenProduct[]>;
  listAllProducts(): Promise<CanteenProduct[]>;
  upsertAddon(addon: CanteenAddon): Promise<CanteenAddon>;
  findAddonById(addonId: string): Promise<CanteenAddon | undefined>;
  listAddonsByIds(addonIds: string[]): Promise<CanteenAddon[]>;
  reserveStockAtomically(lines: StockReservationLine[]): Promise<AtomicStockReservationResult>;
  releaseStockAtomically(lines: StockReservationLine[]): Promise<void>;
  saveOrder(order: CanteenOrder): Promise<CanteenOrder>;
  findOrderById(orderId: string): Promise<CanteenOrder | undefined>;
  updateOrder(order: CanteenOrder): Promise<CanteenOrder>;
  listOrdersByOwner(ownerUserId: string): Promise<CanteenOrder[]>;
  listOrders(): Promise<CanteenOrder[]>;
}

function cloneProduct(product: CanteenProduct): CanteenProduct {
  return {
    ...product,
    allowedAddonIds: [...product.allowedAddonIds],
    ...(product.comboItems ? { comboItems: [...product.comboItems] } : {}),
  };
}

function cloneOrder(order: CanteenOrder): CanteenOrder {
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      addons: item.addons.map((addon) => ({ ...addon })),
    })),
  };
}

export class InMemoryCanteenRepository implements CanteenRepository {
  private readonly products = new Map<string, CanteenProduct>();
  private readonly addons = new Map<string, CanteenAddon>();
  private readonly orders = new Map<string, CanteenOrder>();

  constructor(
    initialProducts: CanteenProduct[] = [],
    initialAddons: CanteenAddon[] = [],
  ) {
    for (const addon of initialAddons) {
      this.addons.set(addon.addonId, { ...addon });
    }
    for (const product of initialProducts) {
      this.products.set(product.productId, cloneProduct(product));
    }
  }

  async upsertProduct(product: CanteenProduct): Promise<CanteenProduct> {
    const copy = cloneProduct(product);
    this.products.set(copy.productId, copy);
    return cloneProduct(copy);
  }

  async findProductById(productId: string): Promise<CanteenProduct | undefined> {
    const product = this.products.get(productId);
    return product ? cloneProduct(product) : undefined;
  }

  async listActiveProducts(): Promise<CanteenProduct[]> {
    return Array.from(this.products.values())
      .filter((product) => product.active)
      .map(cloneProduct);
  }

  async listAllProducts(): Promise<CanteenProduct[]> {
    return Array.from(this.products.values()).map(cloneProduct);
  }

  async upsertAddon(addon: CanteenAddon): Promise<CanteenAddon> {
    const copy = { ...addon };
    this.addons.set(copy.addonId, copy);
    return { ...copy };
  }

  async findAddonById(addonId: string): Promise<CanteenAddon | undefined> {
    const addon = this.addons.get(addonId);
    return addon ? { ...addon } : undefined;
  }

  async listAddonsByIds(addonIds: string[]): Promise<CanteenAddon[]> {
    const result: CanteenAddon[] = [];
    for (const id of addonIds) {
      const addon = this.addons.get(id);
      if (addon) {
        result.push({ ...addon });
      }
    }
    return result;
  }

  /**
   * Simula exatamente o UPDATE condicional atômico no PostgreSQL:
   * UPDATE produtos SET estoque_disponivel = estoque_disponivel - :qtd
   * WHERE id = :id AND ativo = true AND estoque_disponivel >= :qtd
   *
   * Valida todas as linhas sincronamente antes de aplicar qualquer decremento,
   * garantindo atomicidade multi-item e ausência absoluta de saldo negativo (AC-2).
   */
  async reserveStockAtomically(
    lines: StockReservationLine[],
  ): Promise<AtomicStockReservationResult> {
    for (const line of lines) {
      const current = this.products.get(line.productId);
      const available = current?.availableStock ?? 0;
      if (!current || !current.active || available < line.quantity) {
        return {
          ok: false,
          productId: line.productId,
          requested: line.quantity,
          available,
        };
      }
    }

    for (const line of lines) {
      const current = this.products.get(line.productId)!;
      this.products.set(line.productId, {
        ...current,
        availableStock: current.availableStock - line.quantity,
      });
    }

    return { ok: true };
  }

  async releaseStockAtomically(lines: StockReservationLine[]): Promise<void> {
    for (const line of lines) {
      const current = this.products.get(line.productId);
      if (!current) continue;
      this.products.set(line.productId, {
        ...current,
        availableStock: current.availableStock + line.quantity,
      });
    }
  }

  async saveOrder(order: CanteenOrder): Promise<CanteenOrder> {
    const copy = cloneOrder(order);
    this.orders.set(copy.orderId, copy);
    return cloneOrder(copy);
  }

  async findOrderById(orderId: string): Promise<CanteenOrder | undefined> {
    const order = this.orders.get(orderId);
    return order ? cloneOrder(order) : undefined;
  }

  async updateOrder(order: CanteenOrder): Promise<CanteenOrder> {
    const copy = cloneOrder(order);
    this.orders.set(copy.orderId, copy);
    return cloneOrder(copy);
  }

  async listOrdersByOwner(ownerUserId: string): Promise<CanteenOrder[]> {
    return Array.from(this.orders.values())
      .filter((order) => order.ownerUserId === ownerUserId)
      .map(cloneOrder);
  }

  async listOrders(): Promise<CanteenOrder[]> {
    return Array.from(this.orders.values()).map(cloneOrder);
  }
}
