import { authorize } from '../identity/rbac.ts';
import type { AuthenticatedSession } from '../identity/types.ts';
import type { ManagementRepository } from './repository.ts';
import type {
  ManagedCanteenItem,
  ManagedMovie,
  ManagedRoom,
  ManagedScreening,
  ManagementSalesSummary,
  ScreeningOccupancyReport,
  ScreeningStatus,
} from './types.ts';

export class ManagementEntityNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManagementEntityNotFoundError';
  }
}

export class InvalidManagementInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidManagementInputError';
  }
}

export interface ManagementServiceOptions {
  now?: () => Date;
}

export class ManagementService {
  private readonly repository: ManagementRepository;
  private readonly now: () => Date;

  constructor(repository: ManagementRepository, options: ManagementServiceOptions = {}) {
    this.repository = repository;
    this.now = options.now ?? (() => new Date());
  }

  async upsertMovie(
    session: AuthenticatedSession,
    input: ManagedMovie,
  ): Promise<ManagedMovie> {
    authorize({ session, operation: 'ADMINISTRATION' });
    if (!input.movieId.trim() || !input.title.trim() || input.durationMinutes <= 0) {
      throw new InvalidManagementInputError(
        'Filme exige identificador, título válido e duração positiva.',
      );
    }
    return this.repository.upsertMovie(input);
  }

  async upsertRoom(
    session: AuthenticatedSession,
    input: ManagedRoom,
  ): Promise<ManagedRoom> {
    authorize({ session, operation: 'ADMINISTRATION' });
    if (!input.roomId.trim() || !input.name.trim() || input.sellableSeats <= 0) {
      throw new InvalidManagementInputError(
        'Sala exige identificador, nome válido e quantidade positiva de assentos comercializáveis.',
      );
    }
    return this.repository.upsertRoom(input);
  }

  async createScreening(
    session: AuthenticatedSession,
    input: {
      screeningId: string;
      movieId: string;
      roomId: string;
      startsAt: string;
      endsAt: string;
      format: string;
      basePriceCents: number;
      status?: ScreeningStatus;
    },
  ): Promise<ManagedScreening> {
    authorize({ session, operation: 'ADMINISTRATION' });
    if (!Number.isInteger(input.basePriceCents) || input.basePriceCents <= 0) {
      throw new InvalidManagementInputError('O preço base da sessão deve ser positivo em centavos.');
    }

    const movie = await this.repository.findMovieById(input.movieId);
    if (!movie) {
      throw new ManagementEntityNotFoundError(`Filme ${input.movieId} não encontrado.`);
    }
    const room = await this.repository.findRoomById(input.roomId);
    if (!room) {
      throw new ManagementEntityNotFoundError(`Sala ${input.roomId} não encontrada.`);
    }

    return this.repository.saveScreening({
      screeningId: input.screeningId,
      movieId: input.movieId,
      roomId: input.roomId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      format: input.format,
      basePriceCents: input.basePriceCents,
      sellableSeats: room.sellableSeats,
      status: input.status ?? 'ATIVA',
      updatedAt: this.now().toISOString(),
    });
  }

  /**
   * Atualiza preço, horário ou status da sessão (RF-10):
   * aplica o novo preço apenas para cotações/compras futuras, preservando
   * integralmente o histórico financeiro e os ingressos já emitidos (AC-5).
   */
  async updateScreening(
    session: AuthenticatedSession,
    screeningId: string,
    patch: {
      basePriceCents?: number;
      startsAt?: string;
      endsAt?: string;
      status?: ScreeningStatus;
    },
  ): Promise<ManagedScreening> {
    authorize({ session, operation: 'ADMINISTRATION' });
    const current = await this.repository.findScreeningById(screeningId);
    if (!current) {
      throw new ManagementEntityNotFoundError(`Sessão ${screeningId} não encontrada.`);
    }

    if (
      patch.basePriceCents !== undefined &&
      (!Number.isInteger(patch.basePriceCents) || patch.basePriceCents <= 0)
    ) {
      throw new InvalidManagementInputError('O novo preço base da sessão deve ser positivo.');
    }

    return this.repository.saveScreening({
      ...current,
      basePriceCents: patch.basePriceCents ?? current.basePriceCents,
      startsAt: patch.startsAt ?? current.startsAt,
      endsAt: patch.endsAt ?? current.endsAt,
      status: patch.status ?? current.status,
      updatedAt: this.now().toISOString(),
    });
  }

  async upsertCanteenItem(
    session: AuthenticatedSession,
    input: {
      productId: string;
      name: string;
      category: string;
      unitPriceCents: number;
      availableStock: number;
      active: boolean;
    },
  ): Promise<ManagedCanteenItem> {
    authorize({ session, operation: 'ADMINISTRATION' });
    if (
      !input.productId.trim() ||
      !input.name.trim() ||
      !Number.isInteger(input.unitPriceCents) ||
      input.unitPriceCents <= 0 ||
      input.availableStock < 0
    ) {
      throw new InvalidManagementInputError(
        'Item da cantina exige preço positivo e estoque maior ou igual a zero.',
      );
    }

    return this.repository.upsertCanteenItem({
      ...input,
      updatedAt: this.now().toISOString(),
    });
  }

  async updateCanteenItemPrice(
    session: AuthenticatedSession,
    productId: string,
    unitPriceCents: number,
  ): Promise<ManagedCanteenItem> {
    authorize({ session, operation: 'ADMINISTRATION' });
    const current = await this.repository.findCanteenItemById(productId);
    if (!current) {
      throw new ManagementEntityNotFoundError(`Produto da cantina ${productId} não encontrado.`);
    }
    if (!Number.isInteger(unitPriceCents) || unitPriceCents <= 0) {
      throw new InvalidManagementInputError('O preço unitário do item deve ser positivo.');
    }
    return this.repository.upsertCanteenItem({
      ...current,
      unitPriceCents,
      updatedAt: this.now().toISOString(),
    });
  }

  async quoteCurrentScreeningPrice(screeningId: string): Promise<{
    screeningId: string;
    fullPriceCents: number;
    halfPriceCents: number;
  }> {
    const screening = await this.repository.findScreeningById(screeningId);
    if (!screening) {
      throw new ManagementEntityNotFoundError(`Sessão ${screeningId} não encontrada.`);
    }
    return {
      screeningId: screening.screeningId,
      fullPriceCents: screening.basePriceCents,
      halfPriceCents: Math.floor(screening.basePriceCents / 2),
    };
  }

  /**
   * Calcula a taxa de ocupação determinística da sessão (RF-15 / AC-5):
   * ocupação = (ingressos_ativos / assentos_comercializaveis) * 100
   * Exclui reservas expiradas e ingressos cancelados/estornados.
   */
  async getScreeningOccupancyReport(
    session: AuthenticatedSession,
    screeningId: string,
  ): Promise<ScreeningOccupancyReport> {
    authorize({ session, operation: 'ADMINISTRATION' });
    const screening = await this.repository.findScreeningById(screeningId);
    if (!screening) {
      throw new ManagementEntityNotFoundError(`Sessão ${screeningId} não encontrada.`);
    }

    const [movie, room, purchases, holds] = await Promise.all([
      this.repository.findMovieById(screening.movieId),
      this.repository.findRoomById(screening.roomId),
      this.repository.listTicketPurchasesByScreening(screeningId),
      this.repository.listHoldsByScreening(screeningId),
    ]);

    const nowMs = this.now().getTime();

    const activeTickets = purchases.filter(
      (record) =>
        record.paymentStatus === 'APROVADO' &&
        (record.ticketStatus === 'EMITIDO' || record.ticketStatus === 'UTILIZADO'),
    );
    const cancelledTickets = purchases.filter(
      (record) =>
        record.ticketStatus === 'CANCELADO' || record.paymentStatus === 'ESTORNADO',
    );

    const expiredHoldsCount = holds.filter(
      (hold) =>
        hold.status === 'EXPIRADA' ||
        (hold.status === 'ATIVA' && Date.parse(hold.expiresAt) <= nowMs),
    ).length;

    const activeHoldsCount = holds.filter(
      (hold) => hold.status === 'ATIVA' && Date.parse(hold.expiresAt) > nowMs,
    ).length;

    const sellableSeats = screening.sellableSeats;
    const occupancyPercent =
      sellableSeats > 0
        ? Number(((activeTickets.length / sellableSeats) * 100).toFixed(2))
        : 0;

    const grossRevenueCents = activeTickets.reduce(
      (sum, record) => sum + record.paidUnitPriceCents,
      0,
    );
    const cancelledRevenueCents = cancelledTickets.reduce(
      (sum, record) => sum + record.paidUnitPriceCents,
      0,
    );

    return {
      screeningId,
      movieTitle: movie?.title ?? screening.movieId,
      roomName: room?.name ?? screening.roomId,
      startsAt: screening.startsAt,
      sellableSeats,
      activeTicketsCount: activeTickets.length,
      cancelledTicketsCount: cancelledTickets.length,
      expiredHoldsCount,
      activeHoldsCount,
      occupancyPercent,
      grossRevenueCents,
      cancelledRevenueCents,
    };
  }

  async getSalesAndOccupancySummary(
    session: AuthenticatedSession,
  ): Promise<ManagementSalesSummary> {
    authorize({ session, operation: 'ADMINISTRATION' });
    const screenings = await this.repository.listScreenings();
    const reports: ScreeningOccupancyReport[] = [];

    for (const screening of screenings) {
      reports.push(await this.getScreeningOccupancyReport(session, screening.screeningId));
    }

    return {
      totalRevenueCents: reports.reduce((sum, r) => sum + r.grossRevenueCents, 0),
      activeTicketsCount: reports.reduce((sum, r) => sum + r.activeTicketsCount, 0),
      cancelledTicketsCount: reports.reduce((sum, r) => sum + r.cancelledTicketsCount, 0),
      screenings: reports,
    };
  }
}
