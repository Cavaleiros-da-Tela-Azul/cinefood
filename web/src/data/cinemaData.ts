export type SeatStatus = 'available' | 'occupied' | 'reserved';
export type SeatCategory = 'standard' | 'pcd-wheelchair' | 'pcd-plus';
export type TicketTier = 'inteira' | 'meia';
export type MeiaCategory = 'estudante' | 'id-jovem' | 'pcd' | 'idoso';
export type HeroThemeTone = 'amber' | 'emerald' | 'crimson' | 'slate';

export const MEIA_CATEGORIES: { id: MeiaCategory; label: string; docHint: string }[] = [
  { id: 'estudante', label: 'Estudante (CIE · Lei 12.933)', docHint: 'Ex: CIE-849201' },
  { id: 'id-jovem', label: 'ID Jovem', docHint: 'Ex: IDJ-391044' },
  { id: 'pcd', label: 'Pessoa com Deficiência (PcD)', docHint: 'Ex: BPC/CIPTEA' },
  { id: 'idoso', label: 'Idoso 60+ (Documento)', docHint: 'Ex: RG/CNH 60+' },
];

export interface SessionSlot {
  id: string;
  complex: string;
  room: string;
  format: 'IMAX 3D' | 'Dolby Atmos' | '2D Legendado';
  dateId: string;
  dateLabel: string;
  dayNumber: string;
  monthLabel: string;
  time: string;
  occupancyPct: number;
  basePrice: number;
}

export interface MovieItem {
  id: string;
  indexLabel: string;
  kickerLocation: string;
  title: string;
  tagline: string;
  synopsis: string;
  premiere: string;
  director: string;
  musicBy: string;
  genre: string;
  duration: string;
  rating: string;
  complexes: string[];
  tone: HeroThemeTone;
  backdropSrc: string;
  posterSrc: string;
  trailerDuration: string;
  trailerHighlight: string;
  sessions: SessionSlot[];
}

export interface SeatNode {
  id: string;
  row: string;
  col: number;
  status: SeatStatus;
  category: SeatCategory;
}

export interface SelectedSeat {
  seatId: string;
  row: string;
  col: number;
  category: SeatCategory;
  tier: TicketTier;
  meiaCategory?: MeiaCategory;
  meiaDoc?: string;
}

export interface CanteenItem {
  id: string;
  name: string;
  description: string;
  price: number;
  tag: string;
  stock: number;
  imageSrc: string;
  addons: { id: string; label: string; price: number }[];
}

export const DATE_OPTIONS = [
  { id: '14-dez', day: '14', month: 'DEZ', weekday: 'Sáb', label: 'Hoje' },
  { id: '15-dez', day: '15', month: 'DEZ', weekday: 'Dom', label: 'Amanhã' },
  { id: '16-dez', day: '16', month: 'DEZ', weekday: 'Seg', label: '16 Dez' },
  { id: '17-dez', day: '17', month: 'DEZ', weekday: 'Ter', label: '17 Dez' },
  { id: '18-dez', day: '18', month: 'DEZ', weekday: 'Qua', label: '18 Dez' },
];

export const COMPLEX_OPTIONS = ['Todos os Complexos', 'CineFood Paulista IMAX', 'CineFood Jardins Atmos'];

export const MOVIES: MovieItem[] = [
  {
    id: 'cidade-ferro',
    indexLabel: '01',
    kickerLocation: 'Sala IMAX · 14 Dez · 21:40',
    title: 'CIDADE DE FERRO',
    tagline: 'Em um horizonte pós-colapso, uma metrópole móvel atravessa o deserto buscando o último refúgio.',
    synopsis:
      'Quando os recursos da superfície se esgotam, uma navegadora solitária descobre o mapa de um oásis subterrâneo e precisa infiltrar a cidadela blindada antes do anoitecer.',
    premiere: '14 Dezembro 2026',
    director: 'Clara Vasconcelos',
    musicBy: 'Henrique Sato',
    genre: 'Ficção Científica, Aventura',
    duration: '2h 18min',
    rating: '14 anos',
    complexes: ['CineFood Paulista IMAX', 'CineFood Jardins Atmos'],
    tone: 'amber',
    backdropSrc: '/assets/horizon-backdrop.jpg',
    posterSrc: '/assets/horizon-poster.jpg',
    trailerDuration: '02:14',
    trailerHighlight: 'Sequência de abertura na tempestade de areia capturada em 70mm IMAX.',
    sessions: [
      {
        id: 'cf-imax-2140',
        complex: 'CineFood Paulista IMAX',
        room: 'Sala 01 · IMAX',
        format: 'IMAX 3D',
        dateId: '14-dez',
        dateLabel: '14 DEZ',
        dayNumber: '14',
        monthLabel: 'DEZ',
        time: '21:40',
        occupancyPct: 68,
        basePrice: 40,
      },
      {
        id: 'cf-atmos-1915',
        complex: 'CineFood Jardins Atmos',
        room: 'Sala 03 · Atmos',
        format: 'Dolby Atmos',
        dateId: '14-dez',
        dateLabel: '14 DEZ',
        dayNumber: '14',
        monthLabel: 'DEZ',
        time: '19:15',
        occupancyPct: 42,
        basePrice: 40,
      },
      {
        id: 'cf-2d-1630',
        complex: 'CineFood Paulista IMAX',
        room: 'Sala 04',
        format: '2D Legendado',
        dateId: '15-dez',
        dateLabel: '15 DEZ',
        dayNumber: '15',
        monthLabel: 'DEZ',
        time: '16:30',
        occupancyPct: 24,
        basePrice: 36,
      },
      {
        id: 'cf-imax-17d',
        complex: 'CineFood Paulista IMAX',
        room: 'Sala 01 · IMAX',
        format: 'IMAX 3D',
        dateId: '17-dez',
        dateLabel: '17 DEZ',
        dayNumber: '17',
        monthLabel: 'DEZ',
        time: '20:00',
        occupancyPct: 51,
        basePrice: 40,
      },
    ],
  },
  {
    id: 'noturno-esmeralda',
    indexLabel: '02',
    kickerLocation: 'Dolby Atmos · 14 Dez · 20:30',
    title: 'NOTURNO ESMERALDA',
    tagline: 'Sob a chuva ácida da metrópole, cada confissão tem o preço de um segredo.',
    synopsis:
      'Um restaurador de fitas magnéticas encontra uma gravação sem autor que conecta três desaparecimentos ocorridos na mesma noite chuvosa de novembro.',
    premiere: '07 Dezembro 2026',
    director: 'Rafael Nogueira',
    musicBy: 'Marina Alencar',
    genre: 'Suspense, Neo-Noir',
    duration: '2h 04min',
    rating: '16 anos',
    complexes: ['CineFood Jardins Atmos', 'CineFood Paulista IMAX'],
    tone: 'emerald',
    backdropSrc: '/assets/nocturne-backdrop.jpg',
    posterSrc: '/assets/nocturne-poster.jpg',
    trailerDuration: '01:52',
    trailerHighlight: 'Mixagem binaural exclusiva em Dolby Atmos para a cena da estação central.',
    sessions: [
      {
        id: 'ne-atmos-2030',
        complex: 'CineFood Jardins Atmos',
        room: 'Sala 02 · Atmos',
        format: 'Dolby Atmos',
        dateId: '14-dez',
        dateLabel: '14 DEZ',
        dayNumber: '14',
        monthLabel: 'DEZ',
        time: '20:30',
        occupancyPct: 81,
        basePrice: 40,
      },
      {
        id: 'ne-2d-2215',
        complex: 'CineFood Paulista IMAX',
        room: 'Sala 05',
        format: '2D Legendado',
        dateId: '14-dez',
        dateLabel: '14 DEZ',
        dayNumber: '14',
        monthLabel: 'DEZ',
        time: '22:15',
        occupancyPct: 35,
        basePrice: 36,
      },
      {
        id: 'ne-atmos-16d',
        complex: 'CineFood Jardins Atmos',
        room: 'Sala 02 · Atmos',
        format: 'Dolby Atmos',
        dateId: '16-dez',
        dateLabel: '16 DEZ',
        dayNumber: '16',
        monthLabel: 'DEZ',
        time: '21:00',
        occupancyPct: 60,
        basePrice: 40,
      },
    ],
  },
  {
    id: 'orbita-escarlate',
    indexLabel: '03',
    kickerLocation: 'IMAX 3D · 14 Dez · 22:00',
    title: 'ÓRBITA ESCARLATE',
    tagline: 'A 400 quilômetros da Terra, o silêncio da estação guarda a última transmissão.',
    synopsis:
      'Após uma tempestade solar interromper a telemetria orbital, dois engenheiros precisam religar o módulo de retorno antes que a janela atmosférica se feche.',
    premiere: '12 Dezembro 2026',
    director: 'Daniela Kurosawa',
    musicBy: 'Lucas Bastos',
    genre: 'Drama Espacial, Ficção',
    duration: '2h 26min',
    rating: '12 anos',
    complexes: ['CineFood Paulista IMAX'],
    tone: 'crimson',
    backdropSrc: '/assets/solaris-backdrop.jpg',
    posterSrc: '/assets/solaris-poster.jpg',
    trailerDuration: '02:30',
    trailerHighlight: 'Fotografia espacial de alto contraste idealizada para projeção laser IMAX.',
    sessions: [
      {
        id: 'oe-imax-2200',
        complex: 'CineFood Paulista IMAX',
        room: 'Sala 01 · IMAX',
        format: 'IMAX 3D',
        dateId: '14-dez',
        dateLabel: '14 DEZ',
        dayNumber: '14',
        monthLabel: 'DEZ',
        time: '22:00',
        occupancyPct: 54,
        basePrice: 40,
      },
      {
        id: 'oe-imax-1800',
        complex: 'CineFood Paulista IMAX',
        room: 'Sala 01 · IMAX',
        format: 'IMAX 3D',
        dateId: '15-dez',
        dateLabel: '15 DEZ',
        dayNumber: '15',
        monthLabel: 'DEZ',
        time: '18:00',
        occupancyPct: 38,
        basePrice: 40,
      },
    ],
  },
  {
    id: 'veredas-da-neblina',
    indexLabel: '04',
    kickerLocation: 'Sala 04 · 14 Dez · 18:45',
    title: 'VEREDAS DA NEBLINA',
    tagline: 'Entre picos de granito e nuvens baixas, uma travessia redefine quem volta para casa.',
    synopsis:
      'Dois irmãos cartógrafos sobem a crista da serra para registrar uma antiga rota de tropeiros, mas o nevoeiro persistente revela marcas deixadas décadas atrás.',
    premiere: '28 Novembro 2026',
    director: 'Gustavo Pedrosa',
    musicBy: 'Sofia Tavares',
    genre: 'Drama, Aventura',
    duration: '1h 56min',
    rating: '10 anos',
    complexes: ['CineFood Jardins Atmos'],
    tone: 'slate',
    backdropSrc: '/assets/veredas-backdrop.jpg',
    posterSrc: '/assets/veredas-poster.jpg',
    trailerDuration: '01:44',
    trailerHighlight: 'Filmado integralmente em locação real durante a hora azul na serra.',
    sessions: [
      {
        id: 'vn-2d-1845',
        complex: 'CineFood Jardins Atmos',
        room: 'Sala 04',
        format: '2D Legendado',
        dateId: '14-dez',
        dateLabel: '14 DEZ',
        dayNumber: '14',
        monthLabel: 'DEZ',
        time: '18:45',
        occupancyPct: 29,
        basePrice: 36,
      },
      {
        id: 'vn-2d-16d',
        complex: 'CineFood Jardins Atmos',
        room: 'Sala 04',
        format: '2D Legendado',
        dateId: '16-dez',
        dateLabel: '16 DEZ',
        dayNumber: '16',
        monthLabel: 'DEZ',
        time: '19:30',
        occupancyPct: 44,
        basePrice: 36,
      },
    ],
  },
];

export const CANTEEN_ITEMS: CanteenItem[] = [
  {
    id: 'combo-imax-duplo',
    name: 'Combo IMAX Manteiga Trufada',
    description: 'Balde grande de pipoca artesanal + 2 refrigerantes artesanais gelados 500ml.',
    price: 44,
    tag: 'Mais pedido',
    stock: 14,
    imageSrc: '/assets/combo-cinema.jpg',
    addons: [
      { id: 'addon-manteiga', label: 'Extra manteiga clarificada', price: 6 },
      { id: 'addon-caramelo', label: 'Cobertura caramelo salgado', price: 8 },
    ],
  },
  {
    id: 'combo-solo-cinema',
    name: 'Combo Sessão Solo',
    description: 'Pipoca média crocante no balde térmico + 1 soda cítrica artesanal.',
    price: 29,
    tag: 'Entrega rápida',
    stock: 8,
    imageSrc: '/assets/combo-cinema.jpg',
    addons: [{ id: 'addon-cheddar', label: 'Dip cheddar quente', price: 7 }],
  },
  {
    id: 'nachos-sala-escura',
    name: 'Nachos Crocantes da Sala',
    description: 'Tortilhas de milho em embalagem silenciosa com guacamole e sour cream.',
    price: 32,
    tag: 'Últimas unidades',
    stock: 1,
    imageSrc: '/assets/combo-cinema.jpg',
    addons: [{ id: 'addon-jalapeno', label: 'Jalapeños em conserva', price: 4 }],
  },
];

export const WORST_CASE_BUYER = {
  name: 'Aleksandra Wiśniewska-Kowalczyk',
  email: 'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
};

export const DEMO_BUYER = {
  name: 'Joana Silva',
  email: 'joana.silva@cinefood.app',
};

export const WORST_CASE_MOVIES: MovieItem[] = MOVIES.map((movie, idx) =>
  idx === 0
    ? {
        ...movie,
        title: 'A INTERMINÁVEL TRAVESSIA NOTURNA PELO ARQUIPÉLAGO SUBMERSO (ED. ESTENDIDA)',
        kickerLocation: 'Sala 01 Laser IMAX 70mm · Complexo Paulista Jardins Sul · 14 Dez · 21:40',
        tagline:
          'Quando os oceanos recuam sobre as antigas catedrais de ferro, uma equipe internacional multidisciplinar conduz uma travessia de alto risco sem cobertura de rádio.',
        director: 'J.',
        genre: 'Ficção Científica, Épico Pós-Apocalíptico, Drama Filosófico',
        sessions: movie.sessions.map((s, sIdx) =>
          sIdx === 0 ? { ...s, occupancyPct: 99, basePrice: 120 } : s,
        ),
      }
    : movie,
);

export const WORST_CASE_CANTEEN: CanteenItem[] = CANTEEN_ITEMS.map((item, idx) =>
  idx === 0
    ? {
        ...item,
        name: 'Combo Degustação Panorâmico IMAX Manteiga Trufada Importada + Pipoca Caramelizada',
        tag: 'Edição Especial Festival 4K',
      }
    : idx === 2
      ? { ...item, stock: 0, tag: 'Esgotado' }
      : item,
);

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const OCCUPIED_PRESET = new Set([
  'C5', 'C6', 'D4', 'D5', 'D6', 'D7', 'E6', 'E7', 'F3', 'F4', 'G8', 'G9', 'H5', 'H6',
]);
const RESERVED_PRESET = new Set(['E4', 'E5', 'F9']);

export function buildSeatMap(): SeatNode[] {
  const seats: SeatNode[] = [];
  for (const row of ROWS) {
    for (let col = 1; col <= 12; col += 1) {
      const id = `${row}${col}`;
      let category: SeatCategory = 'standard';
      if (row === 'A' && (col === 1 || col === 2 || col === 11)) {
        category = 'pcd-wheelchair';
      } else if (row === 'A' && col === 12) {
        category = 'pcd-plus';
      }

      let status: SeatStatus = 'available';
      if (OCCUPIED_PRESET.has(id)) status = 'occupied';
      else if (RESERVED_PRESET.has(id)) status = 'reserved';

      seats.push({ id, row, col, status, category });
    }
  }
  return seats;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  lgpdAcceptedAt: string;
  marketingOptIn: boolean;
}

export type TicketOrderStatus = 'ATIVO' | 'UTILIZADO' | 'ENCERRADO' | 'CANCELADO';
export type CanteenOrderStatus =
  | 'NENHUM'
  | 'AGUARDANDO_CHEGADA'
  | 'EM_PREPARO'
  | 'EM_ENTREGA'
  | 'ENTREGUE'
  | 'PRONTO_RETIRADA'
  | 'CANCELADO';

export interface ClientTicketOrder {
  id: string;
  qrToken: string;
  movieId: string;
  movieTitle: string;
  posterSrc: string;
  complex: string;
  room: string;
  format: string;
  dateLabel: string;
  time: string;
  seatsLabel: string[];
  totalAmount: number;
  paymentMethod: 'pix' | 'card' | 'cash';
  salesChannel?: 'web' | 'boxoffice';
  meiaCategory?: string;
  status: TicketOrderStatus;
  canteenSummary: string | null;
  canteenStatus: CanteenOrderStatus;
  deliveryMode: 'seat' | 'counter';
  hoursUntilSession: number;
  checkedIn: boolean;
  sessionEnded: boolean;
  rating?: number;
  reviewComment?: string;
  refundIdempotencyKey?: string;
}

export type LgpdRequestType = 'ACESSO' | 'CORRECAO' | 'ANONIMIZACAO';

export interface LgpdRequestItem {
  id: string;
  protocol: string;
  type: LgpdRequestType;
  details: string;
  createdAt: string;
  status: 'REGISTRADO' | 'CONCLUIDO';
  legalRetentionNote: string;
}

export const INITIAL_CUSTOMER: CustomerUser = {
  id: 'usr-joana-01',
  name: 'Joana Silva',
  email: 'joana.silva@cinefood.app',
  lgpdAcceptedAt: '12/11/2026 às 14:20',
  marketingOptIn: false,
};

export const INITIAL_ORDERS: ClientTicketOrder[] = [
  {
    id: 'ORD-8492',
    qrToken: 'CF-QR-8492-NE',
    movieId: 'noturno-esmeralda',
    movieTitle: 'NOTURNO ESMERALDA',
    posterSrc: '/assets/nocturne-poster.jpg',
    complex: 'CineFood Jardins Atmos',
    room: 'Sala 02 · Atmos',
    format: 'Dolby Atmos',
    dateLabel: '14 DEZ',
    time: '22:15',
    seatsLabel: ['G7', 'G8'],
    totalAmount: 124,
    paymentMethod: 'pix',
    status: 'ATIVO',
    canteenSummary: '1× Combo IMAX Manteiga Trufada',
    canteenStatus: 'AGUARDANDO_CHEGADA',
    deliveryMode: 'seat',
    hoursUntilSession: 6.5,
    checkedIn: false,
    sessionEnded: false,
  },
  {
    id: 'ORD-8310',
    qrToken: 'CF-QR-8310-CF',
    movieId: 'cidade-ferro',
    movieTitle: 'CIDADE DE FERRO',
    posterSrc: '/assets/horizon-poster.jpg',
    complex: 'CineFood Paulista IMAX',
    room: 'Sala 01 · IMAX',
    format: 'IMAX 3D',
    dateLabel: '14 DEZ',
    time: '17:15',
    seatsLabel: ['E2'],
    totalAmount: 40,
    paymentMethod: 'card',
    status: 'ATIVO',
    canteenSummary: null,
    canteenStatus: 'NENHUM',
    deliveryMode: 'counter',
    hoursUntilSession: 0.9,
    checkedIn: false,
    sessionEnded: false,
  },
  {
    id: 'ORD-7904',
    qrToken: 'CF-QR-7904-OE',
    movieId: 'orbita-escarlate',
    movieTitle: 'ÓRBITA ESCARLATE',
    posterSrc: '/assets/solaris-poster.jpg',
    complex: 'CineFood Paulista IMAX',
    room: 'Sala 01 · IMAX',
    format: 'IMAX 3D',
    dateLabel: '09 DEZ',
    time: '20:00',
    seatsLabel: ['D8', 'D9'],
    totalAmount: 109,
    paymentMethod: 'pix',
    status: 'ENCERRADO',
    canteenSummary: '1× Combo Sessão Solo',
    canteenStatus: 'ENTREGUE',
    deliveryMode: 'seat',
    hoursUntilSession: -120,
    checkedIn: true,
    sessionEnded: true,
  },
];

export const INITIAL_LGPD_REQUESTS: LgpdRequestItem[] = [
  {
    id: 'lgpd-01',
    protocol: 'LGPD-2026-40918',
    type: 'ACESSO',
    details: 'Exportação completa dos dados cadastrais e histórico de pedidos (Art. 18, II).',
    createdAt: '05/11/2026 · 10:14',
    status: 'CONCLUIDO',
    legalRetentionNote:
      'Relatório disponibilizado em JSON/PDF. Notas fiscais eletrônicas permanecem preservadas por 5 anos conforme CTN Art. 173.',
  },
];

export type RunnerIncidentReason =
  | 'CLIENTE_AUSENTE'
  | 'POLTRONA_DIVERGENTE'
  | 'ITEM_SUBSTITUIDO';

export interface RunnerIncident {
  id: string;
  orderId: string;
  room: string;
  seatLabel: string;
  reason: RunnerIncidentReason;
  notes: string;
  createdAt: string;
  operator: string;
}

export const RUNNER_INCIDENT_LABELS: Record<RunnerIncidentReason, string> = {
  CLIENTE_AUSENTE: 'Cliente ausente no assento (item retornado ao balcão)',
  POLTRONA_DIVERGENTE: 'Poltrona divergente / cliente realocado na sala',
  ITEM_SUBSTITUIDO: 'Item substituído por disponibilidade na cantina',
};

export const INITIAL_INCIDENTS: RunnerIncident[] = [
  {
    id: 'INC-301',
    orderId: 'ORD-7904',
    room: 'Sala 01 · IMAX',
    seatLabel: 'D8, D9',
    reason: 'ITEM_SUBSTITUIDO',
    notes: 'Refil refrigerante trocado para água com gás a pedido da cliente no início da sessão.',
    createdAt: '09/12 · 20:18',
    operator: 'Runner Marcos',
  },
];

export interface GateScanRecord {
  id: string;
  qrToken: string;
  orderId: string | null;
  outcome: 'LIBERADO' | 'DUPLICADO' | 'CANCELADO' | 'INVALIDO';
  detail: string;
  triggeredKitchenPrep: boolean;
  timestamp: string;
}

export type StaffRoleGroup = 'PORTEIRO' | 'BILHETERIA' | 'CANTINA' | 'ADMIN';
export type OpsModuleTab = 'gate' | 'boxoffice' | 'kds' | 'admin';

export interface StaffOperatorProfile {
  role: StaffRoleGroup;
  operatorName: string;
  groupLabel: string;
  stationCode: string;
  allowedTabs: OpsModuleTab[];
  defaultTab: OpsModuleTab;
  description: string;
}

export const STAFF_PROFILES: StaffOperatorProfile[] = [
  {
    role: 'PORTEIRO',
    operatorName: 'Carlos Mendes',
    groupLabel: 'Grupo Portaria',
    stationCode: 'ACESSO · PORTARIA',
    allowedTabs: ['gate'],
    defaultTab: 'gate',
    description: 'Check-in atômico de QR e gatilho automático da Cantina KDS (RN-02).',
  },
  {
    role: 'BILHETERIA',
    operatorName: 'Mariana Costa',
    groupLabel: 'Grupo Bilheteria',
    stationCode: 'PDV · GUICHÊ 02',
    allowedTabs: ['boxoffice'],
    defaultTab: 'boxoffice',
    description: 'Venda presencial, conferência de Meia-Entrada (Lei 12.933) e retirada.',
  },
  {
    role: 'CANTINA',
    operatorName: 'Lucas Ferreira',
    groupLabel: 'Grupo Cantina & Runners',
    stationCode: 'COPA KDS · RUNNER',
    allowedTabs: ['kds'],
    defaultTab: 'kds',
    description: 'Fila de preparo com trava RN-03, entregas OLED em sala e ocorrências RF-20.',
  },
  {
    role: 'ADMIN',
    operatorName: 'Renata Alencar',
    groupLabel: 'Grupo Gerência / Admin',
    stationCode: 'SUPERVISÃO · TOTAL',
    allowedTabs: ['admin', 'gate', 'boxoffice', 'kds'],
    defaultTab: 'admin',
    description: 'Acesso completo a ocupação, tarifário, sessões e auditoria de estações.',
  },
];

export const ROOM_CAPACITY = 96;
