export interface Movie { id: string; title: string; synopsis?: string; rating?: string; }
export interface Screening { id: string; movieId: string; roomId: string; startsAt: string; format: string; }
export interface Seat { id: string; rowLabel: string; number: number; status: 'DISPONIVEL' | 'RESERVADO' | 'OCUPADO'; }
