import type { HistoryEvent } from './types.js';
export interface HistoryRepository { listByUser(userId: string): Promise<HistoryEvent[]>; }
