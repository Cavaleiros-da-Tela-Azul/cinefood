import type { Ticket } from './types.js';
export interface TicketService { findByCode(code: string): Promise<Ticket | null>; }
