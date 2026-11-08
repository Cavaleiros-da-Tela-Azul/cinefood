import type { Payment } from './types.js';
export interface PaymentService { findByBookingId(bookingId: string): Promise<Payment | null>; }
