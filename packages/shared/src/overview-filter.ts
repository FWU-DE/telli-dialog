import { z } from 'zod';

export const overviewFilterSchema = z.enum(['mine', 'all', 'official', 'school', 'community']);
export type OverviewFilter = z.infer<typeof overviewFilterSchema>;
