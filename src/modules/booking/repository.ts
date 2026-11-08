import type { Booking } from './types.js';
export interface BookingRepository { findById(id: string): Promise<Booking | null>; }
