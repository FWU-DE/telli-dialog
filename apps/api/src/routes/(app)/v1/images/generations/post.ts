import { getImageGenerationFnByModel } from "@/llm-model/providers";
import { handleLlmModelError, validateApiKeyWithResult } from "@/routes/utils";
import {
  ApiKeyModel,
  checkLimitsByApiKeyIdWithResult,
  dbCreateImageGenerationUsage,
  dbGetModelsByApiKeyId,
  LlmModel,
} from "@telli/api-database";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const imageGenerationRequestSchema = z.object({
  model: z.string(),
  prompt: z.string(),
});

export type ImageGenerationRequest = z.infer<
  typeof imageGenerationRequestSchema
>;

async function onUsageCallback({
  apiKey,
  model,
}: {
  apiKey: ApiKeyModel;
  model: LlmModel;
}) {
  await dbCreateImageGenerationUsage({
    apiKeyId: apiKey.id,
    modelId: model.id,
  });
}

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const [apiKeyError, apiKey] = await validateApiKeyWithResult(request, reply);

  if (apiKeyError !== null) {
    reply.status(401).send({ error: apiKeyError.message });
    return;
  }

  if (apiKey === undefined) return;

  const requestParseResult = imageGenerationRequestSchema.safeParse(
    request.body,
  );
  if (!requestParseResult.success) {
    reply.status(400).send({
      error: "Bad request",
      details: requestParseResult.error.message,
    });
    return;
  }

  const [limitCalculationError, limitCalculationResult] =
    await checkLimitsByApiKeyIdWithResult({
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
    reply.status(429).send({ error: "You have reached the price limit" });
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

  const imageGenerationFn = getImageGenerationFnByModel({ model });

  if (imageGenerationFn === undefined) {
    reply.status(400).send({
      error: `Could not find an image generation function for the provider ${model.provider}.`,
    });
    return;
  }

  try {
    const response = await imageGenerationFn({
      prompt: body.prompt,
      model: model.name,
    });

    await onUsageCallback({ apiKey, model });

    reply.status(200).send(response);
  } catch (error) {
    handleLlmModelError(reply, error, "Error generating image");
  }
}
