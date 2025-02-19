import { z } from 'zod';

export const intelliPointsPercentageValueSchema = z.enum(['1', '5', '10', '25', '50', '100']);
export type IntelliPointsPercentageValue = z.infer<typeof intelliPointsPercentageValueSchema>;
export const usageTimeValueSchema = z.enum(['30', '45', '60', '90']);
export type UsageTimeValue = z.infer<typeof usageTimeValueSchema>;

export const sharedSchoolChatShareFormValuesSchema = z.object({
  intelliPointsPercentageLimit: intelliPointsPercentageValueSchema,
  usageTimeLimit: usageTimeValueSchema,
});
export type SharedSchoolChatShareFormValues = z.infer<typeof sharedSchoolChatShareFormValuesSchema>;
