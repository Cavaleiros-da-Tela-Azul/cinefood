import type { Payment } from './types.js';
export interface PaymentRepository { findByBookingId(bookingId: string): Promise<Payment | null>; }
