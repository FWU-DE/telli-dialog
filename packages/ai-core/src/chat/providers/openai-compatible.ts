import type OpenAI from 'openai';
import type { Message, StreamEvent, TokenUsage, ToolCall, ToolDefinition } from '../types';
import { AiGenerationError } from '../../errors';
import { toOpenAIChatTools, toOpenAIMessages } from '../utils';

type OpenAICompatibleAgenticStreamArgs = {
  client: OpenAI;
  messages: Message[];
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required';
  getUsage?: (result: { content: string; toolCalls: ToolCall[] }) => TokenUsage;
  providerName: string;
};

type ToolCallAccumulator = {
  id: string;
  name: string;
  arguments: string;
};

export async function* streamOpenAICompatibleAgenticResponse({
  client,
  messages,
  modelName,
  maxTokens,
  temperature,
  tools,
  toolChoice,
  getUsage,
  providerName,
}: OpenAICompatibleAgenticStreamArgs): AsyncGenerator<StreamEvent> {
  const stream = await client.chat.completions.create({
    model: modelName,
    messages: toOpenAIMessages(messages),
    stream: true,
    stream_options: { include_usage: true },
    max_tokens: maxTokens,
    temperature,
    tools: toOpenAIChatTools(tools),
    tool_choice: toolChoice,
  });

  let content = '';
  let usage: TokenUsage | undefined;
  const toolCalls = new Map<number, ToolCallAccumulator>();

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      content += delta.content;
      yield { type: 'text', delta: delta.content };
    }

    for (const toolCallDelta of delta?.tool_calls ?? []) {
      const index = toolCallDelta.index ?? 0;
      const existingToolCall = toolCalls.get(index) ?? { id: '', name: '', arguments: '' };

      if (toolCallDelta.id) {
        existingToolCall.id = toolCallDelta.id;
      }

      if (toolCallDelta.function?.name) {
        existingToolCall.name = toolCallDelta.function.name;
      }

      if (toolCallDelta.function?.arguments) {
        existingToolCall.arguments += toolCallDelta.function.arguments;
      }

      toolCalls.set(index, existingToolCall);
    }

    if (chunk.usage) {
      usage = {
        completionTokens: chunk.usage.completion_tokens,
        promptTokens: chunk.usage.prompt_tokens,
        totalTokens: chunk.usage.total_tokens,
      };
    }
  }

  const resolvedToolCalls: ToolCall[] = [];
  for (const [, toolCall] of [...toolCalls.entries()].sort(([left], [right]) => left - right)) {
    if (!toolCall.id || !toolCall.name) {
      throw new AiGenerationError(`Incomplete tool call returned from ${providerName} stream`);
    }

    resolvedToolCalls.push({
      id: toolCall.id,
      name: toolCall.name,
      arguments: toolCall.arguments,
    });
  }

  if (!usage) {
    usage = getUsage?.({ content, toolCalls: resolvedToolCalls });
  }

  if (!usage) {
    throw new AiGenerationError(`No usage data returned from ${providerName} stream`);
  }

  for (const toolCall of resolvedToolCalls) {
    yield {
      type: 'tool_call',
      call: toolCall,
    };
  }

  yield { type: 'finish', usage };
}
