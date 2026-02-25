import { getEmbeddingFnByModel } from '@/llm-model/providers';
import { handleLlmModelError, validateApiKeyWithResult } from '@/routes/utils';
import {
  checkLimitsByApiKeyIdWithResult,
  dbGetModelsByApiKeyId,
  dbCreateCompletionUsage,
} from '@telli/api-database';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const embeddingRequestSchema = z.object({
  model: z.string(),
  input: z.array(z.string()),
});

export type EmbeddingRequest = z.infer<typeof embeddingRequestSchema>;

export async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const [apiKeyError, apiKey] = await validateApiKeyWithResult(request, reply);

  if (apiKeyError !== null) {
    reply.status(401).send({ error: apiKeyError.message });
    return;
  }

  if (apiKey === undefined) return;

  const requestParseResult = embeddingRequestSchema.safeParse(request.body);
  if (!requestParseResult.success) {
    reply.status(400).send({
      error: 'Bad request',
      details: requestParseResult.error.message,
    });

    return;
  }

  const [limitCalculationError, limitCalculationResult] = await checkLimitsByApiKeyIdWithResult({
    apiKeyId: apiKey.id,
  });

  if (limitCalculationError !== null) {
    reply.status(500).send({
      error: `Something went wrong while calculating the current limits.`,
      details: limitCalculationError.message,
    });
    return;
  }

  if (limitCalculationResult.hasReachedLimit) {
    reply.status(429).send({
      error: 'You have reached the price limit',
    });
    return;
  }

  const body = requestParseResult.data;

  const availableModels = await dbGetModelsByApiKeyId({ apiKeyId: apiKey.id });
  const model = availableModels.find((model) => model.name === body.model);

  if (model === undefined) {
    reply.status(404).send({
      error: `No model with name ${body.model} found.`,
    });
    return;
  }

  const embeddingFn = getEmbeddingFnByModel({ model });

  if (embeddingFn === undefined) {
    reply.status(400).send({
      error: `Could not find a callback function for the provider ${model.provider}.`,
    });
    return;
  }

  try {
    const result = await embeddingFn({
      input: body.input,
      model: model.name,
    });

    await dbCreateCompletionUsage({
      apiKeyId: apiKey.id,
      modelId: model.id,
      completionTokens: 0,
      promptTokens: result.usage.prompt_tokens,
      totalTokens: result.usage.total_tokens,
    });

    reply.status(200).send(result);
  } catch (error) {
    handleLlmModelError(reply, error, 'Error generating embedding');
  }
}
