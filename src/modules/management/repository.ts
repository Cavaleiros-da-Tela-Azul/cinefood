import type {
  ConfirmedTicketPurchaseRecord,
  ManagedCanteenItem,
  ManagedMovie,
  ManagedRoom,
  ManagedScreening,
  ScreeningHoldRecord,
} from './types.ts';

export interface ManagementRepository {
  upsertMovie(movie: ManagedMovie): Promise<ManagedMovie>;
  findMovieById(movieId: string): Promise<ManagedMovie | undefined>;
  upsertRoom(room: ManagedRoom): Promise<ManagedRoom>;
  findRoomById(roomId: string): Promise<ManagedRoom | undefined>;
  saveScreening(screening: ManagedScreening): Promise<ManagedScreening>;
  findScreeningById(screeningId: string): Promise<ManagedScreening | undefined>;
  listScreenings(): Promise<ManagedScreening[]>;
  upsertCanteenItem(item: ManagedCanteenItem): Promise<ManagedCanteenItem>;
  findCanteenItemById(productId: string): Promise<ManagedCanteenItem | undefined>;
  saveTicketPurchase(record: ConfirmedTicketPurchaseRecord): Promise<ConfirmedTicketPurchaseRecord>;
  findTicketPurchaseById(ticketId: string): Promise<ConfirmedTicketPurchaseRecord | undefined>;
  listTicketPurchasesByScreening(screeningId: string): Promise<ConfirmedTicketPurchaseRecord[]>;
  listAllTicketPurchases(): Promise<ConfirmedTicketPurchaseRecord[]>;
  updateTicketPurchase(record: ConfirmedTicketPurchaseRecord): Promise<ConfirmedTicketPurchaseRecord>;
  saveHold(hold: ScreeningHoldRecord): Promise<ScreeningHoldRecord>;
  listHoldsByScreening(screeningId: string): Promise<ScreeningHoldRecord[]>;
  releaseSeatHoldForCancellation(screeningId: string, seatId: string): Promise<void>;
}

function cloneTicketPurchase(
  record: ConfirmedTicketPurchaseRecord,
): ConfirmedTicketPurchaseRecord {
  return {
    ...record,
    ...(record.linkedCanteenOrder
      ? { linkedCanteenOrder: { ...record.linkedCanteenOrder } }
      : {}),
  };
}

export class InMemoryManagementRepository implements ManagementRepository {
  private readonly movies = new Map<string, ManagedMovie>();
  private readonly rooms = new Map<string, ManagedRoom>();
  private readonly screenings = new Map<string, ManagedScreening>();
  private readonly canteenItems = new Map<string, ManagedCanteenItem>();
  private readonly ticketPurchases = new Map<string, ConfirmedTicketPurchaseRecord>();
  private readonly holds = new Map<string, ScreeningHoldRecord>();

  async upsertMovie(movie: ManagedMovie): Promise<ManagedMovie> {
    const copy = { ...movie };
    this.movies.set(copy.movieId, copy);
    return { ...copy };
  }

  async findMovieById(movieId: string): Promise<ManagedMovie | undefined> {
    const movie = this.movies.get(movieId);
    return movie ? { ...movie } : undefined;
  }

  async upsertRoom(room: ManagedRoom): Promise<ManagedRoom> {
    const copy = { ...room };
    this.rooms.set(copy.roomId, copy);
    return { ...copy };
  }

  async findRoomById(roomId: string): Promise<ManagedRoom | undefined> {
    const room = this.rooms.get(roomId);
    return room ? { ...room } : undefined;
  }

  async saveScreening(screening: ManagedScreening): Promise<ManagedScreening> {
    const copy = { ...screening };
    this.screenings.set(copy.screeningId, copy);
    return { ...copy };
  }

  async findScreeningById(screeningId: string): Promise<ManagedScreening | undefined> {
    const screening = this.screenings.get(screeningId);
    return screening ? { ...screening } : undefined;
  }

  async listScreenings(): Promise<ManagedScreening[]> {
    return Array.from(this.screenings.values()).map((s) => ({ ...s }));
  }

  async upsertCanteenItem(item: ManagedCanteenItem): Promise<ManagedCanteenItem> {
    const copy = { ...item };
    this.canteenItems.set(copy.productId, copy);
    return { ...copy };
  }

  async findCanteenItemById(productId: string): Promise<ManagedCanteenItem | undefined> {
    const item = this.canteenItems.get(productId);
    return item ? { ...item } : undefined;
  }

  async saveTicketPurchase(
    record: ConfirmedTicketPurchaseRecord,
  ): Promise<ConfirmedTicketPurchaseRecord> {
    const copy = cloneTicketPurchase(record);
    this.ticketPurchases.set(copy.ticketId, copy);
    return cloneTicketPurchase(copy);
  }

  async findTicketPurchaseById(
    ticketId: string,
  ): Promise<ConfirmedTicketPurchaseRecord | undefined> {
    const record = this.ticketPurchases.get(ticketId);
    return record ? cloneTicketPurchase(record) : undefined;
  }

  async listTicketPurchasesByScreening(
    screeningId: string,
  ): Promise<ConfirmedTicketPurchaseRecord[]> {
    return Array.from(this.ticketPurchases.values())
      .filter((record) => record.screeningId === screeningId)
      .map(cloneTicketPurchase);
  }

  async listAllTicketPurchases(): Promise<ConfirmedTicketPurchaseRecord[]> {
    return Array.from(this.ticketPurchases.values()).map(cloneTicketPurchase);
  }

  async updateTicketPurchase(
    record: ConfirmedTicketPurchaseRecord,
  ): Promise<ConfirmedTicketPurchaseRecord> {
    const copy = cloneTicketPurchase(record);
    this.ticketPurchases.set(copy.ticketId, copy);
    return cloneTicketPurchase(copy);
  }

  async saveHold(hold: ScreeningHoldRecord): Promise<ScreeningHoldRecord> {
    const copy = { ...hold };
    this.holds.set(copy.holdId, copy);
    return { ...copy };
  }

  async listHoldsByScreening(screeningId: string): Promise<ScreeningHoldRecord[]> {
    return Array.from(this.holds.values())
      .filter((hold) => hold.screeningId === screeningId)
      .map((hold) => ({ ...hold }));
  }

  async releaseSeatHoldForCancellation(screeningId: string, seatId: string): Promise<void> {
    for (const [holdId, hold] of this.holds.entries()) {
      if (
        hold.screeningId === screeningId &&
        hold.seatId === seatId &&
        (hold.status === 'CONFIRMADA' || hold.status === 'ATIVA')
      ) {
        this.holds.set(holdId, { ...hold, status: 'CANCELADA' });
      }
    }
  }
}
