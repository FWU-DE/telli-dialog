import { z } from 'zod';

export const intelliPointsPercentageValueSchema = z.enum(['1', '5', '10', '25', '50', '100']);
export type IntelliPointsPercentageValue = z.infer<typeof intelliPointsPercentageValueSchema>;
export const usageTimeValueSchema = z.enum([
  '30',
  '45',
  '60',
  '90',
  '1440', // 1 day
  '4320', // 3 days
  '10080', // 7 days
  '43200', // 30 days
]);
export type UsageTimeValue = z.infer<typeof usageTimeValueSchema>;

export const sharedConversationFormValuesSchema = z.object({
  intelliPointsPercentageLimit: intelliPointsPercentageValueSchema,
  usageTimeLimit: usageTimeValueSchema,
});
export type SharedConversationShareFormValues = z.infer<typeof sharedConversationFormValuesSchema>;
