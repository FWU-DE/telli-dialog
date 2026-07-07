import { z } from 'zod';

export const overviewFilterSchema = z.enum(['mine', 'official', 'school', 'community', 'all']);
export type OverviewFilter = z.infer<typeof overviewFilterSchema>;
