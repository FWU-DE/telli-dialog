import OpenAI from "openai";
import { streamToController } from "../utils";
import {
  CommonLlmProviderStreamParameter,
  CompletionFn,
  CompletionStreamFn,
} from "../types";
import { LlmModel } from "@telli/api-database";

export function constructOpenAiCompletionStreamFn(
  model: LlmModel,
): CompletionStreamFn {
  if (model.setting.provider !== "openai") {
    throw new Error("Invalid model configuration for OpenAi");
  }

  const client = new OpenAI({
    apiKey: model.setting.apiKey,
    baseURL: model.setting.baseUrl,
  });

  return async function getOpenAICompletionStream({
    model,
    onUsageCallback,
    ...props
  }: CommonLlmProviderStreamParameter) {
    const stream = await client.chat.completions.create({
      model,
      stream: true,
      stream_options: {
        include_usage: true,
      },
      ...props,
    });

    async function* fetchChunks() {
      for await (const chunk of stream) {
        const maybeUsage = chunk.usage ?? undefined;
        if (maybeUsage) {
          onUsageCallback(maybeUsage);
        }
        yield JSON.stringify(chunk);
      }
    }

    return new ReadableStream({
      async start(controller) {
        await streamToController(controller, fetchChunks());
      },
    });
  };
}

export function constructOpenAiCompletionFn(model: LlmModel): CompletionFn {
  if (model.setting.provider !== "openai") {
    throw new Error("Invalid model configuration for OpenAi");
  }

  const client = new OpenAI({
    apiKey: model.setting.apiKey,
    baseURL: model.setting.baseUrl,
  });

  return async function getOpenAICompletion({
    ...props
  }: Parameters<CompletionFn>[0]) {
    const result = await client.chat.completions.create({
      ...props,
    });
    return result;
  };
}
