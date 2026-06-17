import type {
  Base64ImageSource,
  ContentBlockParam,
  ImageBlockParam,
  MessageCreateParamsNonStreaming,
  MessageCreateParamsStreaming,
  MessageParam,
  Usage,
} from '@anthropic-ai/sdk/resources';
import {
  AgenticStreamFn,
  AiModel,
  ChatAttachment,
  Message,
  StreamEvent,
  TextGenerationArgs,
  TextGenerationFn,
  TextResponse,
  TextStreamFn,
  TokenUsage,
} from '../types';
import { AnthropicVertex, ClientOptions } from '@anthropic-ai/vertex-sdk';
import { AiGenerationError, RateLimitExceededError } from '../../errors';

/* used by apps/api when called with stream === false or as auxiliary model in chat-bot */
export function constructGoogleAnthropicTextGenerationFn(model: AiModel): TextGenerationFn {
  const config = getConfigurationByModel(model);
  const client = new AnthropicVertex(config);

  return async function generateText({
    messages,
    maxTokens,
    model: modelName,
  }: TextGenerationArgs): Promise<TextResponse> {
    // Separate system messages from conversation messages
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    const conversationMessages = filterUnsupportedMessages(messages).map((msg) =>
      mapMessageToAnthropicMessageParam(msg),
    );

    const vertexModelName = resolveModelName(modelName);

    const messageParams: MessageCreateParamsNonStreaming = {
      max_tokens: maxTokens ?? 4096,
      messages: conversationMessages,
      model: vertexModelName,
      stream: false,
      system: buildSystemPrompt(systemMessages),
    };

    const response = await client.messages.create(messageParams);

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');

    return {
      text,
      usage: buildTokenUsage(response.usage),
    };
  };
}

/**
 * used by api and chat-bot for streaming text responses
 * Note: Images are supported at the moment but require special handling.
 * They needed to be uploaded separately or included as base64 encoded content in the message.
 */
export function constructGoogleAnthropicTextStreamFn(model: AiModel): TextStreamFn {
  const config = getConfigurationByModel(model);
  const client = new AnthropicVertex(config);

  return async function* generateTextStream(
    args: TextGenerationArgs,
    onComplete?: (usage: TokenUsage) => void | Promise<void>,
  ): AsyncGenerator<string> {
    try {
      const { messages, maxTokens, model: modelName } = args;

      // Separate system messages from conversation messages
      const systemMessages = messages.filter((msg) => msg.role === 'system');
      const conversationMessages = filterUnsupportedMessages(messages).map((msg) =>
        mapMessageToAnthropicMessageParam(msg),
      );

      const vertexModelName = resolveModelName(modelName);

      const messageParams: MessageCreateParamsStreaming = {
        max_tokens: maxTokens ?? 4096,
        messages: conversationMessages,
        model: vertexModelName,
        stream: true,
        system: buildSystemPrompt(systemMessages),
      };

      const stream = client.messages.stream(messageParams);

      let usage: TokenUsage | undefined = undefined;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        } else if (event.type === 'message_stop') {
          const message = await stream.finalMessage();
          if (message.usage) {
            usage = buildTokenUsage(message.usage);
          }
        }
      }

      if (onComplete && usage) {
        await onComplete(usage);
      }
    } catch (error) {
      handleError(error);
    }
  };
}

/** used by chat-bot for streaming agentic responses if activated
 * Todo: fix implementation in TD-1320
 */
export function constructGoogleAnthropicAgenticStreamFn(model: AiModel): AgenticStreamFn {
  const config = getConfigurationByModel(model);
  const client = new AnthropicVertex(config);

  return async function* generateAgenticStream(
    args: TextGenerationArgs,
  ): AsyncGenerator<StreamEvent> {
    const { messages, maxTokens, model: modelName, tools, toolChoice } = args;

    // Separate system messages from conversation messages
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    // Convert messages to Anthropic format
    const conversationMessages = filterUnsupportedMessages(messages).map((msg) =>
      mapMessageToAnthropicMessageParam(msg),
    );

    const vertexModelName = resolveModelName(modelName);

    const messageParams: MessageCreateParamsStreaming = {
      max_tokens: maxTokens ?? 4096,
      messages: conversationMessages,
      model: vertexModelName,
      stream: true,
      system: buildSystemPrompt(systemMessages),
    };

    // Convert tools to Anthropic format
    const anthropicTools = tools?.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object' as const,
        ...tool.parameters,
      },
    }));

    const stream = client.messages.stream({
      ...messageParams,
      system: buildSystemPrompt(systemMessages),
      ...(anthropicTools && anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
      ...(toolChoice === 'required'
        ? { tool_choice: { type: 'any' as const } }
        : toolChoice === 'auto'
          ? { tool_choice: { type: 'auto' as const } }
          : {}),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text', delta: event.delta.text };
        }
      } else if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          // Tool use block started - we'll get the full details in message_stop
        }
      } else if (event.type === 'message_stop') {
        const message = await stream.finalMessage();

        // Yield tool calls
        for (const block of message.content) {
          if (block.type === 'tool_use') {
            yield {
              type: 'tool_call',
              call: {
                id: block.id,
                name: block.name,
                arguments: JSON.stringify(block.input),
              },
            };
          }
        }

        // Yield usage
        if (message.usage) {
          yield {
            type: 'finish',
            usage: buildTokenUsage(message.usage),
          };
        }
      }
    }
  };
}

/**
 * Urls to images are not supported. There is a type called 'URLImageSource' but it throws an error when used.
 * Therefore the image data must be included as base64 encoded content in the message.
 * There is a second option to upload the image but in this case the data retention policy is not used --> not allowed.
 */
function mapMessageToAnthropicMessageParam(message: SupportedMessage): MessageParam {
  // message can have content (string), attachments and tool calls
  const content: Array<ContentBlockParam> = [
    { type: 'text', text: message.content },
    ...(message.attachments?.filter(isImageAttachmentWithBase64DataUrl)?.map((attachment) => {
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: sanitizeMediaType(attachment.contentType),
          data: sanitizeBase64DataUrl(attachment.url),
        },
      } as ImageBlockParam;
    }) ?? []),
  ];
  return {
    role: mapRoleToAntropic(message.role),
    content: content,
  };
}

/**
 * ProjectId and Region is mandatory and taken from model settings.
 * MaxRetries is set to 2 (which is also the default value).
 * Errors based on network connectivity, rate limit and internal server errors are automatically retried
 * Default Timeout is 10 minutes.
 * @param model
 * @returns
 */
function getConfigurationByModel(model: AiModel): ClientOptions {
  if (model.setting.provider !== 'google') {
    throw new Error('Invalid model configuration for Google Anthropic');
  }

  const { projectId, location } = model.setting;
  return { projectId, region: location, maxRetries: 2 };
}

type SupportedMessage = Message & { role: 'user' | 'assistant' };

function mapRoleToAntropic(role: 'user' | 'assistant'): MessageParam['role'] {
  switch (role) {
    case 'user':
      return 'user';
    case 'assistant':
      return 'assistant';
  }
}

function filterUnsupportedMessages(messages: Message[]): SupportedMessage[] {
  return messages.filter(
    (msg): msg is SupportedMessage => msg.role === 'user' || msg.role === 'assistant',
  );
}

/**
 * Handle errors from Google Anthropic API
 * Error codes: https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript#handling-errors
 * @param error
 */
function handleError(error: unknown) {
  // AiGenerationError are just re-thrown
  if (error instanceof AiGenerationError) {
    throw error;
  }
  // Special handling of RateLimitError
  if (error && typeof error === 'object' && 'status' in error && error['status'] === 429) {
    throw new RateLimitExceededError('Rate limit reached for Google Anthropic API');
  }
  // Try to get status code from error object to be more specific
  if (error && typeof error === 'object' && 'status' in error) {
    throw new AiGenerationError(
      'Error during text generation. Status code: ' + String(error['status']),
    );
  }
  throw new AiGenerationError('An error occurred during text generation.');
}

// Strip "anthropic/" prefix if present
function resolveModelName(modelName: string): string {
  return modelName.replace(/^anthropic\//, '');
}

function buildSystemPrompt(systemMessages: Message[]): string {
  return systemMessages.length > 0 ? systemMessages.map((msg) => msg.content).join('\n') : '';
}

function isImageAttachmentWithBase64DataUrl(attachment: ChatAttachment): boolean {
  return attachment.type === 'image' && isBase64DataUrl(attachment.url);
}

function isBase64DataUrl(url: string): boolean {
  return url.startsWith('data:image/') && url.includes(';base64,');
}

/**
 * removes 'data:image/[image_type];base64,' prefix
 */
function sanitizeBase64DataUrl(base64DataUrl: string): string {
  if (!base64DataUrl.startsWith('data:image/')) {
    throw new AiGenerationError('Images are only supported via base64 encoded content data.');
  }
  const prefixPattern = /^data:image\/[a-zA-Z]+;base64,/;
  return base64DataUrl.replace(prefixPattern, '');
}

/**
 * image/jpg is not allowed and must be passed as image/jpeg.
 * Also checks for unsupported image formats and throws an error in this case.
 */
function sanitizeMediaType(contentType: string): Base64ImageSource['media_type'] {
  switch (contentType) {
    case 'image/jpg':
    case 'image/jpeg':
      return 'image/jpeg';
    case 'image/png':
      return 'image/png';
    case 'image/gif':
      return 'image/gif';
    case 'image/webp':
      return 'image/webp';
    default:
      throw new AiGenerationError(`Unsupported image content type: ${contentType}`);
  }
}

/**
 * builds TokenUsage object from Anthropic usage data
 */
function buildTokenUsage(usage: Usage): TokenUsage {
  return {
    promptTokens: usage.input_tokens,
    completionTokens: usage.output_tokens,
    totalTokens: usage.input_tokens + usage.output_tokens,
  };
}
