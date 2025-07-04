import { z } from 'zod';

export const knotenpunktPriceMetadata = z.object({
  type: z.literal('text').or(z.literal('embedding')),
  completionTokenPrice: z.number(),
  promptTokenPrice: z.number(),
});

export const knotenpunktLlmModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  provider: z.string(),
  description: z.string(),
  priceMetadata: knotenpunktPriceMetadata,
  supportedImageFormats: z.array(z.string()).optional().default([]),
  createdAt: z.coerce.date(),
});
export type KnotenpunktLlmModel = z.infer<typeof knotenpunktLlmModelSchema>;
