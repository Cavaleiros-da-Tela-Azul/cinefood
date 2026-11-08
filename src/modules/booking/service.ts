import type { Booking } from './types.js';
export interface BookingService { findById(id: string): Promise<Booking | null>; }
