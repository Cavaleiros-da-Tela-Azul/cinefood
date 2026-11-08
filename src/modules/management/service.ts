import type { CinemaUnit } from './types.js';
export interface ManagementService { getUnit(id: string): Promise<CinemaUnit | null>; }
