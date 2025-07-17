import { z } from 'zod';

export const knotenpunktPriceMetadata = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    completionTokenPrice: z.number(),
    promptTokenPrice: z.number(),
  }),
  z.object({
    type: z.literal('embedding'),
    promptTokenPrice: z.number(),
  }),
  z.object({
    type: z.literal('image'),
    pricePerImageInCent: z.number(),
  }),
]);

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
