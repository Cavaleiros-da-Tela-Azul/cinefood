import type { Ticket } from './types.js';
export interface TicketRepository { findByCode(code: string): Promise<Ticket | null>; }
