export interface Payment { id: string; bookingId: string; amountCents: number; status: 'PENDING' | 'PAID' | 'REFUNDED'; }
