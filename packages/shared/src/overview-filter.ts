import { z } from 'zod';

export const overviewFilterSchema = z.enum(['all', 'mine', 'official', 'school', 'community']);
export type OverviewFilter = z.infer<typeof overviewFilterSchema>;
