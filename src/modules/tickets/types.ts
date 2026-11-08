export interface Ticket { id: string; bookingId: string; code: string; status: 'ISSUED' | 'USED' | 'VOID'; }
