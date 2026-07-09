import { z } from 'zod';

export const tokenPointsPercentageValues = [1, 5, 10, 25, 50, 100];
export const MaxTokenPointsPercentageLimit = 100;
export const DefaultTokenPointsPercentageLimit = 10;

// used when user wants to set the initial share time
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

// used when user wants to extend the existing share time
export const extendTimeValuesInMinutes = [
  5, // 5 minutes
  10,
  30,
  45,
  60,
  90,
  1 * 24 * 60, // 1 day
  3 * 24 * 60, // 3 days
  7 * 24 * 60, // 7 days
  30 * 24 * 60, // 30 days
];

export const ShareWithLearnersLimitParamsSchema = z.object({
  tokenPointsPercentageLimit: z.coerce.number(),
  usageTimeLimit: z.coerce.number(),
});

export type ShareWithLearnersLimitParams = z.infer<typeof ShareWithLearnersLimitParamsSchema>;
