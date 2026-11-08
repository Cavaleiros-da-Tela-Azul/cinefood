import type { CanteenOrder } from './types.js';
export interface CanteenRepository { findOrder(id: string): Promise<CanteenOrder | null>; }
