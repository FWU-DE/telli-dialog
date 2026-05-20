import { FinishReason, createPartFromText, createPartFromUri } from '@google/genai';
import type {
  GenerateContentParameters,
  GenerateContentResponse,
  GenerateContentResponsePromptFeedback,
  GenerateContentResponseUsageMetadata,
  Part,
} from '@google/genai';
import type { AiModel, Message, TextGenerationFn, TextStreamFn, TokenUsage } from '../types';
import { AiGenerationError, ResponsibleAIError } from '../../errors';
import { createGoogleClient, formatGoogleError } from '../../google-client';
import { calculateCompletionUsage } from '../utils';

const RESPONSIBLE_AI_FINISH_REASONS = new Set<FinishReason>([
  FinishReason.SAFETY,
  FinishReason.BLOCKLIST,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.SPII,
  FinishReason.IMAGE_SAFETY,
  FinishReason.IMAGE_PROHIBITED_CONTENT,
]);

function buildGoogleParts(message: Message): Part[] {
  const parts: Part[] = [];

  if (message.content !== '') {
    parts.push(createPartFromText(message.content));
  }

  for (const attachment of message.attachments ?? []) {
    if (attachment.type !== 'image') {
      continue;
    }

    parts.push(createPartFromUri(attachment.url, attachment.contentType));
  }

  if (parts.length === 0) {
    parts.push(createPartFromText(''));
  }

  return parts;
}

function buildGoogleGenerateContentParameters({
  messages,
  model,
  maxTokens,
  temperature,
}: Parameters<TextGenerationFn>[0]): GenerateContentParameters {
  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: buildGoogleParts(message),
    }));
  const systemInstruction = messages
    .filter((message) => message.role === 'system' && message.content !== '')
    .map((message) => createPartFromText(message.content));
  const config = {
    ...(systemInstruction.length > 0 ? { systemInstruction } : {}),
    ...(maxTokens !== undefined ? { maxOutputTokens: maxTokens } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
  };

  return {
    model,
    contents: contents.length > 0 ? contents : [{ role: 'user', parts: [createPartFromText('')] }],
    ...(Object.keys(config).length > 0 ? { config } : {}),
  };
}

function getResponsibleAiMessage({
  promptFeedback,
  finishReason,
}: {
  promptFeedback?: GenerateContentResponsePromptFeedback;
  finishReason?: FinishReason;
}): string | undefined {
  if (promptFeedback?.blockReasonMessage) {
    return promptFeedback.blockReasonMessage;
  }

  if (promptFeedback?.blockReason) {
    return `Google Vertex AI blocked the prompt: ${promptFeedback.blockReason}`;
  }

  if (finishReason && RESPONSIBLE_AI_FINISH_REASONS.has(finishReason)) {
    return `Google Vertex AI blocked the response: ${finishReason}`;
  }

  return undefined;
}

function assertGoogleResponseAllowed(response: GenerateContentResponse): void {
  const finishReason = response.candidates?.[0]?.finishReason;
  const errorMessage = getResponsibleAiMessage({
    promptFeedback: response.promptFeedback,
    finishReason,
  });

  if (errorMessage) {
    throw new ResponsibleAIError(errorMessage);
  }
}

function toTokenUsage({
  usageMetadata,
  messages,
  text,
}: {
  usageMetadata?: GenerateContentResponseUsageMetadata;
  messages: Message[];
  text: string;
}): TokenUsage {
  if (
    usageMetadata?.promptTokenCount !== undefined ||
    usageMetadata?.candidatesTokenCount !== undefined ||
    usageMetadata?.totalTokenCount !== undefined
  ) {
    const promptTokens = usageMetadata.promptTokenCount ?? 0;
    const completionTokens = usageMetadata.candidatesTokenCount ?? 0;

    return {
      promptTokens,
      completionTokens,
      totalTokens:
        usageMetadata.totalTokenCount ??
        promptTokens +
          completionTokens +
          (usageMetadata.toolUsePromptTokenCount ?? 0) +
          (usageMetadata.thoughtsTokenCount ?? 0),
    };
  }

  const calculatedUsage = calculateCompletionUsage({
    messages,
    modelMessage: { role: 'assistant', content: text },
  });

  return {
    promptTokens: calculatedUsage.prompt_tokens,
    completionTokens: calculatedUsage.completion_tokens,
    totalTokens: calculatedUsage.total_tokens,
  };
}

export function constructGoogleTextStreamFn(model: AiModel): TextStreamFn {
  const clientConfig = createGoogleClient(model);

  return async function* getGoogleTextStream(
    { messages, model: modelName, maxTokens, temperature },
    onComplete,
  ) {
    try {
      const stream = await clientConfig.client.models.generateContentStream(
        buildGoogleGenerateContentParameters({
          messages,
          model: modelName,
          maxTokens,
          temperature,
        }),
      );

      let text = '';
      let usage: TokenUsage | undefined;

      for await (const chunk of stream) {
        assertGoogleResponseAllowed(chunk);

        const chunkText = chunk.text ?? '';
        if (chunkText !== '') {
          text += chunkText;
          yield chunkText;
        }

        if (chunk.usageMetadata) {
          usage = toTokenUsage({
            usageMetadata: chunk.usageMetadata,
            messages,
            text,
          });
        }
      }

      const resolvedUsage = usage ?? toTokenUsage({ messages, text });

      if (onComplete) {
        await onComplete(resolvedUsage);
      }
    } catch (error) {
      if (error instanceof ResponsibleAIError || error instanceof AiGenerationError) {
        throw error;
      }

      throw new AiGenerationError(formatGoogleError('Google Vertex AI Chat', error));
    }
  };
}

export function constructGoogleTextGenerationFn(model: AiModel): TextGenerationFn {
  const clientConfig = createGoogleClient(model);

  return async function getGoogleTextGeneration({
    messages,
    model: modelName,
    maxTokens,
    temperature,
  }) {
    try {
      const response = await clientConfig.client.models.generateContent(
        buildGoogleGenerateContentParameters({
          messages,
          model: modelName,
          maxTokens,
          temperature,
        }),
      );

      assertGoogleResponseAllowed(response);

      const text = response.text ?? '';

      return {
        text,
        usage: toTokenUsage({
          usageMetadata: response.usageMetadata,
          messages,
          text,
        }),
      };
    } catch (error) {
      if (error instanceof ResponsibleAIError || error instanceof AiGenerationError) {
        throw error;
      }

      throw new AiGenerationError(formatGoogleError('Google Vertex AI Chat', error));
    }
  };
}
