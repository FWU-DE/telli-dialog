import { z } from 'zod';

export const llmModelPriceMetadataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    completionTokenPrice: z.number(),
    promptTokenPrice: z.number(),
  }),
  z.object({
    type: z.literal('image'),
    pricePerImageInCent: z.number(),
  }),
  z.object({
    type: z.literal('embedding'),
    promptTokenPrice: z.number(),
  }),
]);

export type LlmModelPriceMetadata = z.infer<typeof llmModelPriceMetadataSchema>;
