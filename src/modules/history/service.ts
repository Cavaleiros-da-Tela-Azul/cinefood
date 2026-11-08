import type { HistoryEvent } from './types.js';
export interface HistoryService { listByUser(userId: string): Promise<HistoryEvent[]>; }
