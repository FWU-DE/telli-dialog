import { generateEmbeddingsByNameWithBilling } from '@telli/ai-core';

/**
 * Generates embeddings using ai-core and returns an OpenAI-compatible response.
 */
export async function createEmbeddings({
  modelName,
  input,
  apiKeyId,
}: {
  modelName: string;
  input: string[];
  apiKeyId: string;
}) {
  const result = await generateEmbeddingsByNameWithBilling(modelName, input, apiKeyId);

  return {
    data: result.embeddings.map((embedding, index) => ({
      object: 'embedding' as const,
      embedding,
      index,
    })),
    model: result.model.name,
    usage: {
      prompt_tokens: result.usage?.promptTokens ?? 0,
      total_tokens: result.usage?.totalTokens ?? 0,
    },
  };
}
