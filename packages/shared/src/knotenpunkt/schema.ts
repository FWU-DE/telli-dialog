import { z } from 'zod';

const knotenpunktPriceMetadata = z.union([
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
    type: z.literal('image'),
    inputTextTokenPrice: z.number(),
    outputTextTokenPrice: z.number().optional(),
    outputImageTokenPrice: z.number(),
  }),
  z.object({
    type: z.literal('embedding'),
    promptTokenPrice: z.number(),
  }),
]);
export type KnotenpunktPriceMetadata = z.infer<typeof knotenpunktPriceMetadata>;

export const knotenpunktLlmModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  provider: z.string(),
  description: z.string(),
  priceMetadata: knotenpunktPriceMetadata,
  supportedImageFormats: z.array(z.string()).optional().default([]),
  createdAt: z.coerce.date(),
  isNew: z.boolean().optional().default(false),
  isDeleted: z.boolean().optional().default(false),
});
export type KnotenpunktLlmModel = z.infer<typeof knotenpunktLlmModelSchema>;
