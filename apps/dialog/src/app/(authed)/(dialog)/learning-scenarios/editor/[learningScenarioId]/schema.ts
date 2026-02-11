import { z } from 'zod';

export const telliPointsPercentageValues = [1, 5, 10, 25, 50, 100];
export const usageTimeValuesInMinutes = [
  30, // 30 minutes
  45,
  60,
  90,
  1 * 24 * 60, // 1 day
  3 * 24 * 60, // 3 days
  7 * 24 * 60, // 7 days
  30 * 24 * 60, // 30 days
];

export const sharedConversationFormValuesSchema = z.object({
  telliPointsPercentageLimit: z.coerce.number(),
  usageTimeLimit: z.coerce.number(),
});
export type SharedConversationShareFormValues = z.infer<typeof sharedConversationFormValuesSchema>;
