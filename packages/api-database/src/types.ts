import { z } from 'zod';

export const staticModelRoleSchema = z.enum([
  'default-chat',
  'default-chat-fallback',
  'auxiliary',
  'strong-auxiliary',
  'auxiliary-fallback',
  'default-image',
]);
export type StaticModelRole = z.infer<typeof staticModelRoleSchema>;

export const llmModelPriceMetadataSchema = z.union([
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

export type LlmModelPriceMetadata = z.infer<typeof llmModelPriceMetadataSchema>;
