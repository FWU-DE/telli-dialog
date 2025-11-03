import { z } from 'zod';

export const modelApiKeyMappingSchema = z.object({
  id: z.string().uuid().readonly(),
  llmModelId: z.string().nonempty(),
  apiKeyId: z.string().nonempty(),
  createdAt: z.date().readonly(),
});

export type ModelApiKeyMapping = z.infer<typeof modelApiKeyMappingSchema>;
