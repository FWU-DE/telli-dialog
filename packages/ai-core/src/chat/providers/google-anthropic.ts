import {
  AgenticStreamFn,
  AiModel,
  StreamEvent,
  TextGenerationArgs,
  TextGenerationFn,
  TextResponse,
  TextStreamFn,
  TokenUsage,
} from '../types';
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';

export function constructGoogleAnthropicTextGenerationFn(model: AiModel): TextGenerationFn {
  const config = getConfigurationByModel(model);
  const client = new AnthropicVertex(config);

  return async function generateText({
    messages,
    maxTokens,
    temperature,
    model: modelName,
  }: TextGenerationArgs): Promise<TextResponse> {
    // Separate system messages from conversation messages
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    const conversationMessages = messages.filter((msg) => msg.role !== 'system');

    // Convert messages to Anthropic format
    const anthropicMessages = conversationMessages.map((msg) => ({
      role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: msg.content,
    }));

    // Strip "anthropic/" prefix if present
    const vertexModelName = modelName.replace(/^anthropic\//, '');

    const response = await client.messages.create({
      model: vertexModelName,
      max_tokens: maxTokens ?? 4096,
      messages: anthropicMessages,
      ...(systemMessages.length > 0
        ? { system: systemMessages.map((msg) => msg.content).join('\n') }
        : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');

    return {
      text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  };
}

export function constructGoogleAnthropicTextStreamFn(model: AiModel): TextStreamFn {
  const config = getConfigurationByModel(model);
  const client = new AnthropicVertex(config);

  return async function* generateTextStream(
    args: TextGenerationArgs,
    onComplete?: (usage: TokenUsage) => void | Promise<void>,
  ): AsyncGenerator<string> {
    try {
      const { messages, maxTokens, temperature, model: modelName } = args;

      // Separate system messages from conversation messages
      const systemMessages = messages.filter((msg) => msg.role === 'system');
      const conversationMessages = messages.filter((msg) => msg.role !== 'system');

      // Convert messages to Anthropic format
      const anthropicMessages = conversationMessages.map((msg) => ({
        role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: msg.content,
      }));

      // Strip "anthropic/" prefix if present (e.g., "anthropic/claude-3-5-sonnet@20240620" -> "claude-3-5-sonnet@20240620")
      const vertexModelName = modelName.replace(/^anthropic\//, '');

      const stream = client.messages.stream({
        model: vertexModelName,
        max_tokens: maxTokens ?? 4096,
        messages: anthropicMessages,
        ...(systemMessages.length > 0
          ? { system: systemMessages.map((msg) => msg.content).join('\n') }
          : {}),
        ...(temperature !== undefined ? { temperature } : {}),
      });

      let usage:
        | { promptTokens: number; completionTokens: number; totalTokens: number }
        | undefined;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        } else if (event.type === 'message_stop') {
          const message = await stream.finalMessage();
          if (message.usage) {
            usage = {
              promptTokens: message.usage.input_tokens,
              completionTokens: message.usage.output_tokens,
              totalTokens: message.usage.input_tokens + message.usage.output_tokens,
            };
          }
        }
      }

      if (onComplete && usage) {
        await onComplete(usage);
      }
    } catch (error) {
      console.error('Error in generateTextStream:', error);
      throw error;
    }
  };
}

export function constructGoogleAnthropicAgenticStreamFn(model: AiModel): AgenticStreamFn {
  const config = getConfigurationByModel(model);
  const client = new AnthropicVertex(config);

  return async function* generateAgenticStream(
    args: TextGenerationArgs,
  ): AsyncGenerator<StreamEvent> {
    const { messages, maxTokens, temperature, model: modelName, tools, toolChoice } = args;

    // Separate system messages from conversation messages
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    const conversationMessages = messages.filter((msg) => msg.role !== 'system');

    // Convert messages to Anthropic format
    const anthropicMessages = conversationMessages.map((msg) => ({
      role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: msg.content,
    }));

    // Strip "anthropic/" prefix if present
    const vertexModelName = modelName.replace(/^anthropic\//, '');

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
      model: vertexModelName,
      max_tokens: maxTokens ?? 4096,
      messages: anthropicMessages,
      ...(systemMessages.length > 0
        ? { system: systemMessages.map((msg) => msg.content).join('\n') }
        : {}),
      ...(temperature !== undefined ? { temperature } : {}),
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
            usage: {
              promptTokens: message.usage.input_tokens,
              completionTokens: message.usage.output_tokens,
              totalTokens: message.usage.input_tokens + message.usage.output_tokens,
            },
          };
        }
      }
    }
  };
}

function getConfigurationByModel(model: AiModel) {
  if (model.setting.provider !== 'google') {
    throw new Error('Invalid model configuration for Google Anthropic');
  }

  const { projectId, location } = model.setting;
  return { projectId, region: location };
}
