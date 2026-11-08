import type { CinemaUnit } from './types.js';
export interface ManagementRepository { getUnit(id: string): Promise<CinemaUnit | null>; }
