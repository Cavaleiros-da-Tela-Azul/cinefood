export type SeatStatus = 'available' | 'occupied' | 'reserved';
export type SeatCategory = 'standard' | 'pcd-wheelchair' | 'pcd-plus';
export type TicketTier = 'inteira' | 'meia';
export type MeiaCategory = 'estudante' | 'id-jovem' | 'pcd' | 'idoso';
export type HeroThemeTone = 'amber' | 'emerald' | 'crimson' | 'slate';
export type SessionStatus = 'ATIVA' | 'ENCERRADA' | 'INATIVA';
export type CanteenCategory = 'combos' | 'pipocas' | 'bebidas' | 'doces';

export const ROOM_CAPACITY = 96;
export const COLS_PER_ROW = 12;
export const ROWS_ORDER: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const CDC_RETURN_WINDOW_DAYS = 7;
export const CDC_SESSION_CUTOFF_HOURS = 2;

export const MEIA_CATEGORIES: { id: MeiaCategory; label: string; docHint: string }[] = [
  { id: 'estudante', label: 'Estudante (CIE · Lei 12.933)', docHint: 'Ex: CIE-849201' },
  { id: 'id-jovem', label: 'ID Jovem', docHint: 'Ex: IDJ-391044' },
  { id: 'pcd', label: 'Pessoa com Deficiência (PcD)', docHint: 'Ex: BPC/CIPTEA' },
  { id: 'idoso', label: 'Idoso 60+ (Documento)', docHint: 'Ex: RG/CNH 60+' },
];

export const CANTEEN_CATEGORIES: { id: CanteenCategory | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'combos', label: 'Combos' },
  { id: 'pipocas', label: 'Pipocas & Salgados' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'doces', label: 'Doces' },
];

export interface SessionSlot {
  id: string;
  complex: string;
  room: string;
  format: 'IMAX 3D' | 'Dolby Atmos' | '2D';
  dateId: string;
  dateLabel: string;
  dayNumber: string;
  monthLabel: string;
  time: string;
  startsAt: string;
  status: SessionStatus;
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
  ratingAvg?: number;
  complexes: string[];
  tone: HeroThemeTone;
  backdropSrc: string;
  posterSrc: string;
  trailerDuration: string;
  trailerHighlight: string;
  previewUrl?: string;
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
  category: CanteenCategory;
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
    ratingAvg: 4.8,
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
        startsAt: '2026-12-14T21:40:00-03:00',
        status: 'ATIVA',
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
        startsAt: '2026-12-14T19:15:00-03:00',
        status: 'ATIVA',
        occupancyPct: 42,
        basePrice: 40,
      },
      {
        id: 'cf-2d-1630',
        complex: 'CineFood Paulista IMAX',
        room: 'Sala 04',
        format: '2D',
        dateId: '15-dez',
        dateLabel: '15 DEZ',
        dayNumber: '15',
        monthLabel: 'DEZ',
        time: '16:30',
        startsAt: '2026-12-15T16:30:00-03:00',
        status: 'ATIVA',
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
        startsAt: '2026-12-17T20:00:00-03:00',
        status: 'ATIVA',
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
    ratingAvg: 4.6,
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
        startsAt: '2026-12-14T20:30:00-03:00',
        status: 'ATIVA',
        occupancyPct: 81,
        basePrice: 40,
      },
      {
        id: 'ne-2d-2215',
        complex: 'CineFood Paulista IMAX',
        room: 'Sala 05',
        format: '2D',
        dateId: '14-dez',
        dateLabel: '14 DEZ',
        dayNumber: '14',
        monthLabel: 'DEZ',
        time: '22:15',
        startsAt: '2026-12-14T22:15:00-03:00',
        status: 'ATIVA',
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
        startsAt: '2026-12-16T21:00:00-03:00',
        status: 'ATIVA',
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
    ratingAvg: 4.9,
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
        startsAt: '2026-12-14T22:00:00-03:00',
        status: 'ATIVA',
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
        startsAt: '2026-12-15T18:00:00-03:00',
        status: 'ATIVA',
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
    ratingAvg: 4.7,
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
        format: '2D',
        dateId: '14-dez',
        dateLabel: '14 DEZ',
        dayNumber: '14',
        monthLabel: 'DEZ',
        time: '18:45',
        startsAt: '2026-12-14T18:45:00-03:00',
        status: 'ATIVA',
        occupancyPct: 29,
        basePrice: 36,
      },
      {
        id: 'vn-2d-16d',
        complex: 'CineFood Jardins Atmos',
        room: 'Sala 04',
        format: '2D',
        dateId: '16-dez',
        dateLabel: '16 DEZ',
        dayNumber: '16',
        monthLabel: 'DEZ',
        time: '19:30',
        startsAt: '2026-12-16T19:30:00-03:00',
        status: 'ATIVA',
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
    category: 'combos',
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
    category: 'combos',
    price: 29,
    tag: 'Entrega rápida',
    stock: 8,
    imageSrc: '/assets/combo-solo-cinema.jpg',
    addons: [{ id: 'addon-cheddar', label: 'Dip cheddar quente', price: 7 }],
  },
  {
    id: 'nachos-sala-escura',
    name: 'Nachos Crocantes da Sala',
    description: 'Tortilhas de milho em embalagem silenciosa com guacamole e sour cream.',
    category: 'pipocas',
    price: 32,
    tag: 'Últimas unidades',
    stock: 1,
    imageSrc: '/assets/nachos-sala-escura.jpg',
    addons: [{ id: 'addon-jalapeno', label: 'Jalapeños em conserva', price: 4 }],
  },
  {
    id: 'pipoca-caramelo-g',
    name: 'Pipoca Caramelo & Flor de Sal G',
    description: 'Milho gourmet estourado no ar quente com caramelo âmbar e flor de sal.',
    category: 'pipocas',
    price: 24,
    tag: 'Artesanal',
    stock: 18,
    imageSrc: '/assets/pipoca-caramelo-g.jpg',
    addons: [{ id: 'addon-pacoca', label: 'Farofa crocante de amendoim', price: 5 }],
  },
  {
    id: 'soda-italiana-500',
    name: 'Soda Italiana Frutas Vermelhas 500ml',
    description: 'Água gaseificada gelada com xarope artesanal de amora, framboesa e limão siciliano.',
    category: 'bebidas',
    price: 16,
    tag: 'Gelada',
    stock: 22,
    imageSrc: '/assets/soda-italiana-500.jpg',
    addons: [{ id: 'addon-hortela', label: 'Ramo de hortelã e gelo extra', price: 2 }],
  },
  {
    id: 'brownie-belga-sala',
    name: 'Brownie 70% Cacau em Cubos',
    description: 'Porção individual sem ruído de embalagem, com chocolate meio amargo e nozes.',
    category: 'doces',
    price: 19,
    tag: 'Silencioso',
    stock: 11,
    imageSrc: '/assets/brownie-belga-sala.jpg',
    addons: [{ id: 'addon-ganache', label: 'Calda quente de chocolate', price: 5 }],
  },
  {
    id: 'combo-casal-caramelo',
    name: 'Combo Noite Doce & Salgada',
    description: 'Balde grande meio a meio (trufada e caramelo flor de sal) + 2 sodas de frutas vermelhas + cubos de brownie.',
    category: 'combos',
    price: 58,
    tag: 'Edição Gourmet',
    stock: 10,
    imageSrc: '/assets/combo-casal-caramelo.jpg',
    addons: [
      { id: 'addon-calda-extra', label: 'Calda extra de caramelo salgado', price: 7 },
      { id: 'addon-balde-termico', label: 'Upgrade para balde colecionável', price: 15 },
    ],
  },
  {
    id: 'mini-hotdog-artesanal',
    name: 'Dupla Mini Hot Dog Brioche',
    description: 'Dois mini brioches tostados com salsicha artesanal defumada, cheddar cremoso e cebola crispy.',
    category: 'pipocas',
    price: 28,
    tag: 'Quentinho',
    stock: 9,
    imageSrc: '/assets/mini-hotdog-artesanal.jpg',
    addons: [
      { id: 'addon-bacon', label: 'Bacon crocante extra', price: 6 },
      { id: 'addon-mostarda-mel', label: 'Molho mostarda e mel', price: 3 },
    ],
  },
  {
    id: 'batata-rustica-trufada',
    name: 'Batatas Rústicas ao Alecrim & Parmesão',
    description: 'Canoa térmica com batatas rústicas crocantes, azeite trufado, alecrim fresco e lascas de parmesão.',
    category: 'pipocas',
    price: 26,
    tag: 'Crocante',
    stock: 12,
    imageSrc: '/assets/batata-rustica-trufada.jpg',
    addons: [
      { id: 'addon-aioli-negro', label: 'Aioli de alho negro', price: 5 },
      { id: 'addon-cheddar-batata', label: 'Cheddar cremoso à parte', price: 6 },
    ],
  },
  {
    id: 'milkshake-belga-400',
    name: 'Milkshake Chocolate Belga & Espresso 400ml',
    description: 'Sorvete artesanal de chocolate 70% batido com shot de espresso, chantilly leve e raspas meio amargas.',
    category: 'bebidas',
    price: 25,
    tag: 'Cremoso',
    stock: 14,
    imageSrc: '/assets/milkshake-belga-400.jpg',
    addons: [
      { id: 'addon-espresso-extra', label: 'Shot extra de espresso', price: 5 },
      { id: 'addon-chantilly', label: 'Chantilly artesanal de baunilha', price: 4 },
    ],
  },
  {
    id: 'iced-tea-pessego-500',
    name: 'Chá Gelado Pêssego & Gengibre 500ml',
    description: 'Infusão gelada de chá preto com pêssego macerado, lâminas de gengibre e rodela de limão tahiti.',
    category: 'bebidas',
    price: 15,
    tag: 'Refrescante',
    stock: 20,
    imageSrc: '/assets/iced-tea-pessego-500.jpg',
    addons: [{ id: 'addon-mel', label: 'Toque de mel silvestre e gelo extra', price: 3 }],
  },
  {
    id: 'churros-dulce-leche',
    name: 'Mini Churros Artesanais com Doce de Leite',
    description: 'Seis mini churros crocantes polvilhados com açúcar e canela com potinho de doce de leite cremoso.',
    category: 'doces',
    price: 22,
    tag: 'Feito na hora',
    stock: 15,
    imageSrc: '/assets/churros-dulce-leche.jpg',
    addons: [{ id: 'addon-avela', label: 'Potinho extra de creme de avelã', price: 6 }],
  },
  {
    id: 'cookies-chocochips',
    name: 'Trio Cookies Gotas de Chocolate & Flor de Sal',
    description: 'Três cookies artesanais macios por dentro com chocolate meio amargo e pitada de flor de sal.',
    category: 'doces',
    price: 21,
    tag: 'Assado no dia',
    stock: 13,
    imageSrc: '/assets/cookies-chocochips.jpg',
    addons: [{ id: 'addon-sorvete', label: 'Bola de sorvete de creme à parte', price: 8 }],
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

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createPrng(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], rand: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates a deterministic 96-seat map (8 rows A-H x 12 cols) for a session,
 * targeting `occupancyPct` unavailable seats (occupied + reserved) while keeping
 * PCD seats in row A available unless occupancy requires filling them.
 */
export function buildSeatMap(sessionId = 'default-session', occupancyPct = 18): SeatNode[] {
  const baseSeats: SeatNode[] = [];
  for (const row of ROWS_ORDER) {
    for (let col = 1; col <= COLS_PER_ROW; col += 1) {
      const id = `${row}${col}`;
      let category: SeatCategory = 'standard';
      if (row === 'A' && (col === 1 || col === 2 || col === 11)) {
        category = 'pcd-wheelchair';
      } else if (row === 'A' && col === 12) {
        category = 'pcd-plus';
      }
      baseSeats.push({ id, row, col, status: 'available', category });
    }
  }

  const clampedPct = Math.max(0, Math.min(98, occupancyPct));
  const targetUnavailable = Math.max(
    0,
    Math.min(ROOM_CAPACITY - 2, Math.round((clampedPct / 100) * ROOM_CAPACITY)),
  );
  const reservedCount = targetUnavailable >= 6 ? 2 : 0;
  const occupiedCount = targetUnavailable - reservedCount;

  const rand = createPrng(hashSeed(`${sessionId}:${clampedPct}`));
  const standardIds = shuffleWithSeed(
    baseSeats.filter((s) => s.category === 'standard').map((s) => s.id),
    rand,
  );
  const pcdIds = shuffleWithSeed(
    baseSeats.filter((s) => s.category !== 'standard').map((s) => s.id),
    rand,
  );
  const prioritizedPool = [...standardIds, ...pcdIds];

  const occupiedSet = new Set(prioritizedPool.slice(0, occupiedCount));
  const reservedSet = new Set(prioritizedPool.slice(occupiedCount, occupiedCount + reservedCount));

  return baseSeats.map((seat) => ({
    ...seat,
    status: occupiedSet.has(seat.id)
      ? 'occupied'
      : reservedSet.has(seat.id)
        ? 'reserved'
        : 'available',
  }));
}

export const OCCUPIED_PRESET: Set<string> = new Set(
  buildSeatMap('default-session', 18)
    .filter((seat) => seat.status === 'occupied')
    .map((seat) => seat.id),
);

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
  | 'PENDENTE_PAGAMENTO'
  | 'AGUARDANDO_CHEGADA'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'SAIU_PARA_ENTREGA'
  | 'RETIRADA_NO_BALCAO'
  | 'ENTREGUE'
  | 'CANCELADO';

export const CANTEEN_STATUS_LABEL: Record<CanteenOrderStatus, string> = {
  NENHUM: 'Sem combos',
  PENDENTE_PAGAMENTO: 'Aguardando confirmação de pagamento',
  AGUARDANDO_CHEGADA: 'Aguardando entrada na portaria (RN-02)',
  EM_PREPARO: 'Em preparo na cozinha',
  PRONTO: 'Pronto na cozinha',
  SAIU_PARA_ENTREGA: 'Runner a caminho do assento',
  RETIRADA_NO_BALCAO: 'Disponível para retirada no balcão (RN-03)',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado com estorno',
};

export interface SeatQrToken {
  seatId: string;
  qrToken: string;
  status: 'ATIVO' | 'UTILIZADO' | 'CANCELADO';
}

export interface ClientTicketOrder {
  id: string;
  userId: string;
  qrToken: string;
  seatQrTokens: SeatQrToken[];
  orderKind?: 'ticket' | 'canteen-only';
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
  operatorName?: string;
  meiaCategory?: MeiaCategory;
  meiaDoc?: string;
  purchasedAt: string;
  status: TicketOrderStatus;
  canteenSummary: string | null;
  canteenStatus: CanteenOrderStatus;
  deliveryMode: 'seat' | 'counter';
  hoursUntilSession: number;
  checkedIn: boolean;
  sessionEnded: boolean;
  rating?: number;
  reviewTitle?: string;
  reviewComment?: string;
  reviewedAt?: string;
  refundIdempotencyKey?: string;
}

export interface CommunityReviewItem {
  id: string;
  movieId: string;
  movieTitle: string;
  authorDisplayName: string;
  complex: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  verifiedCheckIn: true;
  orderId?: string;
  userId?: string;
}

export interface InternalNoticeItem {
  id: string;
  userId: string;
  orderId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'refund';
  createdAt: string;
  read: boolean;
}

export type LgpdRequestType = 'ACESSO' | 'CORRECAO' | 'ELIMINACAO';

export const LGPD_REQUEST_LABELS: Record<LgpdRequestType, { title: string; desc: string }> = {
  ACESSO: {
    title: 'Acesso e Portabilidade',
    desc: 'Exportar histórico e dados cadastrais (Art. 18, II)',
  },
  CORRECAO: {
    title: 'Correção de Dados',
    desc: 'Retificar nome, e-mail ou preferências (Art. 18, III)',
  },
  ELIMINACAO: {
    title: 'Eliminação de Dados Dispensáveis (com retenção fiscal)',
    desc: 'Remover dados opcionais preservando registros fiscais obrigatórios (Art. 18, VI)',
  },
};

export interface LgpdRequestItem {
  id: string;
  protocol: string;
  type: LgpdRequestType;
  details: string;
  createdAt: string;
  status: 'REGISTRADO' | 'CONCLUIDO';
  legalRetentionNote: string;
}

export function isCdcCancelEligible(
  order: Pick<ClientTicketOrder, 'status' | 'checkedIn' | 'hoursUntilSession' | 'purchasedAt'>,
  referenceTimeMs: number = Date.now(),
): { eligible: boolean; reason?: string } {
  if (order.status !== 'ATIVO' || order.checkedIn) {
    return { eligible: false, reason: 'Pedido já utilizado ou encerrado.' };
  }
  const purchasedMs = Date.parse(order.purchasedAt);
  const daysSincePurchase = Number.isNaN(purchasedMs)
    ? 0
    : Math.max(0, (referenceTimeMs - purchasedMs) / 86_400_000);
  if (daysSincePurchase > CDC_RETURN_WINDOW_DAYS) {
    return { eligible: false, reason: 'Prazo de 7 dias do CDC (Art. 49) encerrado.' };
  }
  if (order.hoursUntilSession < CDC_SESSION_CUTOFF_HOURS) {
    return { eligible: false, reason: 'Corte de 2h atingido (RN-04).' };
  }
  return { eligible: true };
}

export const INITIAL_CUSTOMER: CustomerUser = {
  id: 'usr-joana',
  name: 'Joana Silva',
  email: 'joana.silva@cinefood.app',
  lgpdAcceptedAt: '12/11/2026 às 14:20',
  marketingOptIn: false,
};

export const INITIAL_ORDERS: ClientTicketOrder[] = [
  {
    id: 'ORD-8492',
    userId: 'usr-joana',
    qrToken: 'CF-QR-8492-NE',
    seatQrTokens: [
      { seatId: 'G7', qrToken: 'CF-QR-8492-NE-G7', status: 'ATIVO' },
      { seatId: 'G8', qrToken: 'CF-QR-8492-NE-G8', status: 'ATIVO' },
    ],
    orderKind: 'ticket',
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
    salesChannel: 'web',
    purchasedAt: new Date(Date.now() - 86_400_000).toISOString(),
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
    userId: 'usr-joana',
    qrToken: 'CF-QR-8310-CF',
    seatQrTokens: [{ seatId: 'E2', qrToken: 'CF-QR-8310-CF-E2', status: 'ATIVO' }],
    orderKind: 'ticket',
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
    salesChannel: 'web',
    purchasedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
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
    userId: 'usr-joana',
    qrToken: 'CF-QR-7904-OE',
    seatQrTokens: [
      { seatId: 'D8', qrToken: 'CF-QR-7904-OE-D8', status: 'UTILIZADO' },
      { seatId: 'D9', qrToken: 'CF-QR-7904-OE-D9', status: 'UTILIZADO' },
    ],
    orderKind: 'ticket',
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
    salesChannel: 'web',
    purchasedAt: '2026-12-07T19:00:00-03:00',
    status: 'ENCERRADO',
    canteenSummary: '1× Combo Sessão Solo',
    canteenStatus: 'ENTREGUE',
    deliveryMode: 'seat',
    hoursUntilSession: -120,
    checkedIn: true,
    sessionEnded: true,
  },
  {
    id: 'ORD-7812',
    userId: 'usr-joana',
    qrToken: 'CF-QR-7812-VN',
    seatQrTokens: [{ seatId: 'F4', qrToken: 'CF-QR-7812-VN-F4', status: 'UTILIZADO' }],
    orderKind: 'ticket',
    movieId: 'veredas-da-neblina',
    movieTitle: 'VEREDAS DA NEBLINA',
    posterSrc: '/assets/veredas-poster.jpg',
    complex: 'CineFood Jardins Atmos',
    room: 'Sala 04',
    format: '2D',
    dateLabel: '05 DEZ',
    time: '18:45',
    seatsLabel: ['F4'],
    totalAmount: 36,
    paymentMethod: 'card',
    salesChannel: 'web',
    meiaCategory: 'estudante',
    meiaDoc: 'CIE-849201',
    purchasedAt: '2026-12-03T11:20:00-03:00',
    status: 'ENCERRADO',
    canteenSummary: null,
    canteenStatus: 'NENHUM',
    deliveryMode: 'counter',
    hoursUntilSession: -216,
    checkedIn: true,
    sessionEnded: true,
    rating: 5,
    reviewTitle: 'Fotografia impecável na serra',
    reviewComment: 'Projeção muito nítida e sala silenciosa do começo ao fim.',
    reviewedAt: '2026-12-05T22:10:00-03:00',
  },
  {
    id: 'ORD-8501',
    userId: 'usr-rafael',
    qrToken: 'CF-QR-8501-CF',
    seatQrTokens: [{ seatId: 'C4', qrToken: 'CF-QR-8501-CF-C4', status: 'UTILIZADO' }],
    orderKind: 'ticket',
    movieId: 'cidade-ferro',
    movieTitle: 'CIDADE DE FERRO',
    posterSrc: '/assets/horizon-poster.jpg',
    complex: 'CineFood Paulista IMAX',
    room: 'Sala 01 · IMAX',
    format: 'IMAX 3D',
    dateLabel: '14 DEZ',
    time: '19:15',
    seatsLabel: ['C4'],
    totalAmount: 84,
    paymentMethod: 'pix',
    salesChannel: 'web',
    purchasedAt: '2026-12-14T10:05:00-03:00',
    status: 'UTILIZADO',
    canteenSummary: '1× Combo IMAX Manteiga Trufada',
    canteenStatus: 'PRONTO',
    deliveryMode: 'seat',
    hoursUntilSession: 0.4,
    checkedIn: true,
    sessionEnded: false,
  },
];

export const INITIAL_COMMUNITY_REVIEWS: CommunityReviewItem[] = [
  {
    id: 'rev-101',
    movieId: 'cidade-ferro',
    movieTitle: 'CIDADE DE FERRO',
    authorDisplayName: 'Camila R.',
    complex: 'CineFood Paulista IMAX',
    rating: 5,
    title: 'Escala absurda em 70mm IMAX',
    comment:
      'A sequência da tempestade de areia preenche a tela inteira e o combo chegou no assento antes dos trailers terminarem.',
    createdAt: '2026-12-13T23:55:00-03:00',
    verifiedCheckIn: true,
  },
  {
    id: 'rev-102',
    movieId: 'noturno-esmeralda',
    movieTitle: 'NOTURNO ESMERALDA',
    authorDisplayName: 'Bruno M.',
    complex: 'CineFood Jardins Atmos',
    rating: 4,
    title: 'Som Atmos envolvente',
    comment:
      'A chuva parece cair dos alto-falantes de cima. Trama tensa que segura a atenção até os créditos.',
    createdAt: '2026-12-12T22:45:00-03:00',
    verifiedCheckIn: true,
  },
  {
    id: 'rev-103',
    movieId: 'orbita-escarlate',
    movieTitle: 'ÓRBITA ESCARLATE',
    authorDisplayName: 'Larissa T.',
    complex: 'CineFood Paulista IMAX',
    rating: 5,
    title: 'Contraste perfeito no Modo OLED da sala',
    comment:
      'Cenas espaciais com preto absoluto impressionante. Recomendo muito a fileira F central.',
    createdAt: '2026-12-11T23:10:00-03:00',
    verifiedCheckIn: true,
  },
  {
    id: 'rev-104',
    movieId: 'veredas-da-neblina',
    movieTitle: 'VEREDAS DA NEBLINA',
    authorDisplayName: 'Joana S.',
    complex: 'CineFood Jardins Atmos',
    rating: 5,
    title: 'Fotografia impecável na serra',
    comment: 'Projeção muito nítida e sala silenciosa do começo ao fim.',
    createdAt: '2026-12-05T22:10:00-03:00',
    verifiedCheckIn: true,
    orderId: 'ORD-7812',
    userId: 'usr-joana',
  },
  {
    id: 'rev-105',
    movieId: 'cidade-ferro',
    movieTitle: 'CIDADE DE FERRO',
    authorDisplayName: 'Eduardo P.',
    complex: 'CineFood Jardins Atmos',
    rating: 4,
    title: 'Ritmo excelente no segundo ato',
    comment: 'Trilha sonora do Henrique Sato segura muito bem as cenas de ação no deserto.',
    createdAt: '2026-12-10T21:30:00-03:00',
    verifiedCheckIn: true,
  },
  {
    id: 'rev-106',
    movieId: 'noturno-esmeralda',
    movieTitle: 'NOTURNO ESMERALDA',
    authorDisplayName: 'Fernanda L.',
    complex: 'CineFood Paulista IMAX',
    rating: 5,
    title: 'Neo-noir brasileiro de respeito',
    comment: 'Mistério bem amarrado e retirada no balcão da cantina foi instantânea.',
    createdAt: '2026-12-09T23:40:00-03:00',
    verifiedCheckIn: true,
  },
];

export const INITIAL_NOTICES: InternalNoticeItem[] = [
  {
    id: 'not-01',
    userId: 'usr-joana',
    orderId: 'ORD-8492',
    title: 'Entrega no assento condicionada à portaria (RN-02)',
    message:
      'Seu combo do pedido ORD-8492 entrará em preparo automático assim que um dos seus QR Codes for validado na entrada da Sala 02.',
    type: 'info',
    createdAt: '14/12/2026 · 15:45',
    read: false,
  },
  {
    id: 'not-02',
    userId: 'usr-joana',
    orderId: 'ORD-8310',
    title: 'Janela de cancelamento CDC encerrada (RN-04)',
    message:
      'A sessão de CIDADE DE FERRO (ORD-8310) começa em menos de 2 horas; o cancelamento digital não está mais disponível.',
    type: 'warning',
    createdAt: '14/12/2026 · 15:20',
    read: true,
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
  CLIENTE_AUSENTE: 'Cliente ausente no assento (convertido para retirada no balcão)',
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

export type StaffRoleGroup =
  | 'OPERADOR_PORTARIA'
  | 'OPERADOR_CANTINA'
  | 'RUNNER'
  | 'ADMIN_CINEMA';

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
    role: 'OPERADOR_PORTARIA',
    operatorName: 'Carlos Mendes',
    groupLabel: 'Operador de Portaria',
    stationCode: 'ACESSO · PORTARIA',
    allowedTabs: ['gate'],
    defaultTab: 'gate',
    description:
      'Check-in atômico de QR individual por assento e gatilho automático da Cantina KDS (RN-02).',
  },
  {
    role: 'OPERADOR_CANTINA',
    operatorName: 'Lucas Ferreira',
    groupLabel: 'Operador de Cantina (KDS)',
    stationCode: 'COPA KDS · COZINHA',
    allowedTabs: ['kds'],
    defaultTab: 'kds',
    description:
      'Fila de preparo na cozinha com trava de portaria (RN-02) e despacho para balcão ou Runner.',
  },
  {
    role: 'RUNNER',
    operatorName: 'Marcos Oliveira',
    groupLabel: 'Runner de Entrega em Sala',
    stationCode: 'SALA · RUNNER OLED',
    allowedTabs: ['kds'],
    defaultTab: 'kds',
    description:
      'Entrega em poltrona para pedidos PRONTO / SAIU_PARA_ENTREGA e conversão de ocorrências (RN-03).',
  },
  {
    role: 'ADMIN_CINEMA',
    operatorName: 'Renata Alencar',
    groupLabel: 'Gerência & Bilheteria (Admin)',
    stationCode: 'ADMIN · BILHETERIA · TOTAL',
    allowedTabs: ['admin', 'boxoffice', 'gate', 'kds'],
    defaultTab: 'admin',
    description:
      'Acesso completo a ocupação, tarifário, sessões, estoque da cantina, bilheteria presencial e auditoria.',
  },
];
