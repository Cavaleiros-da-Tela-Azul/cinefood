import type { CanteenOrder } from './types.js';
export interface CanteenService { findOrder(id: string): Promise<CanteenOrder | null>; }
