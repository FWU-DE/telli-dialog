import {
  getCompletionFnByModel,
  getCompletionStreamFnByModel,
} from "@/llm-model/providers";
import {
  getContentFilterFailedChunk,
  getErrorChunk,
  validateApiKeyWithResult,
  handleLlmModelError,
} from "@/routes/utils";
import {
  ApiKeyModel,
  checkLimitsByApiKeyIdWithResult,
  dbCreateCompletionUsage,
  dbGetModelsByApiKeyId,
  LlmModel,
} from "@telli/api-database";
import { FastifyReply, FastifyRequest } from "fastify";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";
import { CompletionUsage } from "openai/resources/completions.js";
import { z } from "zod";

// Define content part schemas for image and text
const textContentPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const imageUrlContentPartSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(["auto", "low", "high"]).optional(),
  }),
});

const contentPartSchema = z.union([
  textContentPartSchema,
  imageUrlContentPartSchema,
]);

// Content can be either a string (legacy format) or an array of content parts (new format with image support)
const messageContentSchema = z.union([z.string(), z.array(contentPartSchema)]);

const completionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "developer"]),
      content: messageContentSchema,
    }),
  ),
  max_tokens: z.number().optional().nullable(),
  temperature: z.coerce.number().optional(),
  stream: z.boolean().optional(),
});

export type CompletionRequest = z.infer<typeof completionRequestSchema>;

async function onUsageCallback({
  apiKey,
  usage,
  model,
}: {
  usage: CompletionUsage;
  apiKey: ApiKeyModel;
  model: LlmModel;
}) {
  await dbCreateCompletionUsage({
    apiKeyId: apiKey.id,
    modelId: model.id,
    completionTokens: usage.completion_tokens,
    promptTokens: usage.prompt_tokens,
    totalTokens: usage.total_tokens,
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

  const requestParseResult = completionRequestSchema.safeParse(request.body);
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

  if (body.temperature === undefined) {
    body.temperature = 0.4;
  }

  const availableModels = await dbGetModelsByApiKeyId({ apiKeyId: apiKey.id });
  const model = availableModels.find((model) => model.name === body.model);

  if (model === undefined) {
    reply.status(404).send({
      error: `No model with name ${body.model} found.`,
    });
    return;
  }
  if (model.name === "o3-mini") {
    body.max_tokens = undefined;
    body.temperature = undefined;
  }

  if (body.stream) {
    const completionStreamFn = getCompletionStreamFnByModel({ model });

    if (completionStreamFn === undefined) {
      reply.status(400).send({
        error: `Could not find a callback function for the provider ${model.provider}.`,
      });
      return;
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
      Connection: "keep-alive",
    });
    let stream: ReadableStream<Uint8Array>;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      stream = await completionStreamFn({
        messages: body.messages as ChatCompletionMessageParam[],
        model: model.name,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async onUsageCallback(usage) {
          await onUsageCallback({ usage, apiKey, model });
        },
      });
    } catch (error) {
      // Check if error has a code field and evaluate its value not all providers have a code field
      const errorCode =
        error instanceof Error && "code" in error
          ? (error.code as string)
          : undefined;

      const contentFilterTriggered = errorCode === "content_filter";

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Error processing stream:", {
        errorCode,
        contentFilterTriggered,
        message: errorMessage,
      });

      stream = new ReadableStream({
        start(controller) {
          if (contentFilterTriggered) {
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify(
                  getContentFilterFailedChunk({
                    id: crypto.randomUUID(),
                    created: Date.now(),
                    model: model.name,
                  }),
                ) + "\n\n",
              ),
            );
          } else {
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify(
                  getErrorChunk({
                    id: crypto.randomUUID(),
                    created: Date.now(),
                    model: model.name,
                    errorMessage,
                    errorCode,
                  }),
                ) + "\n\n",
              ),
            );
          }
          // Always send [DONE] to close the stream properly
          controller.enqueue(new TextEncoder().encode("[DONE]\n\n"));
          controller.close();
        },
      });
    }
    const reader = stream.getReader();

    async function processStream() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunkString = new TextDecoder().decode(value);
        reply.raw.write(`data: ${chunkString}\n`);
      }
    }

    processStream()
      .catch((error) => {
        console.error("Error processing stream:", error);
      })
      .finally(() => {
        reply.raw.write("[DONE]");
        reply.raw.end();
        return;
      });
  } else {
    const completionFn = getCompletionFnByModel({ model });

    if (completionFn === undefined) {
      reply.status(400).send({
        error: `Could not find a callback function for the provider ${model.provider}.`,
      });
      return;
    }

    try {
      const response = await completionFn({
        messages: body.messages as ChatCompletionMessageParam[],
        model: model.name,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
      });

      reply.status(200).send(response);

      if (response.usage !== undefined) {
        await onUsageCallback({ usage: response.usage, apiKey, model });
      }
    } catch (error) {
      handleLlmModelError(reply, error, "Error in non-streaming completion");
    }

    return;
  }
}
