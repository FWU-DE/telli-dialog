import { z } from 'zod';

export const overviewFilterSchema = z.enum(['all', 'mine', 'official', 'school']);
export type OverviewFilter = z.infer<typeof overviewFilterSchema>;
