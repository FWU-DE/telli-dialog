import {
  generateAgenticStreamWithBilling,
  type Message as AiCoreMessage,
  type TokenUsage,
  type ToolDefinition,
  type ToolCall,
} from '@ais-chat/ai-core';
import { logError } from '@shared/logging';

const MAX_AGENTIC_ITERATIONS = 3;
const MAX_TOOL_CALLS_PER_ITERATION = 2;

export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

type AgentLoopParams = {
  modelId: string;
  apiKeyId: string;
  messages: AiCoreMessage[];
  tools?: ToolDefinition[];
  toolHandlers?: Record<string, ToolHandler>;
  onTextChunk: (delta: string) => void;
  onToolCall?: (call: ToolCall) => void;
  onComplete: (result: { fullText: string; usage: TokenUsage; priceInCents: number }) => void;
  onError: (error: Error) => void;
};

export function runAgentLoop({
  modelId,
  apiKeyId,
  messages,
  tools,
  toolHandlers,
  onTextChunk,
  onComplete,
  onError,
}: AgentLoopParams): void {
  (async () => {
    let fullText = '';
    let totalUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let totalPriceInCents = 0;
    const loopMessages = [...messages];

    try {
      for (let iteration = 0; iteration < MAX_AGENTIC_ITERATIONS; iteration++) {
        const pendingToolCalls: ToolCall[] = [];
        let iterationText = '';

        const isLastIteration = iteration === MAX_AGENTIC_ITERATIONS - 1;
        const stream = generateAgenticStreamWithBilling(
          modelId,
          loopMessages,
          apiKeyId,
          async ({ usage, priceInCents }) => {
            totalUsage = {
              promptTokens: totalUsage.promptTokens + usage.promptTokens,
              completionTokens: totalUsage.completionTokens + usage.completionTokens,
              totalTokens: totalUsage.totalTokens + usage.totalTokens,
            };
            totalPriceInCents += priceInCents;
          },
          tools && tools.length > 0 && !isLastIteration ? { tools, toolChoice: 'auto' } : undefined,
        );

        for await (const event of stream) {
          if (event.type === 'text') {
            iterationText += event.delta;
            onTextChunk(event.delta);
            // Don't flush to client yet — wait until we know there are no tool calls
          } else if (event.type === 'tool_call') {
            if (pendingToolCalls.length < MAX_TOOL_CALLS_PER_ITERATION) {
              pendingToolCalls.push(event.call);
            }
          }
        }

        // Tool-calling iteration
        fullText += iterationText;

        if (pendingToolCalls.length === 0) {
          break;
        }

        // Append the assistant message with tool calls
        const assistantMessage: AiCoreMessage = {
          role: 'assistant',
          content: iterationText,
          toolCalls: pendingToolCalls,
        };
        loopMessages.push(assistantMessage);

        // Execute tool calls in parallel and append results
        const toolResults = await Promise.all(
          pendingToolCalls.map(async (toolCall) => {
            const handler = toolHandlers?.[toolCall.name];
            let result: string;

            if (handler) {
              try {
                const args = JSON.parse(toolCall.arguments) as Record<string, unknown>;
                result = await handler(args);
              } catch (error) {
                logError(`Error executing tool ${toolCall.name}:`, error);
                result = `Error: ${error instanceof Error ? error.message : 'Tool execution failed'}`;
              }
            } else {
              result = `Error: Unknown tool "${toolCall.name}"`;
            }

            return { toolCallId: toolCall.id, result };
          }),
        );

        for (const { toolCallId, result } of toolResults) {
          loopMessages.push({ role: 'tool', content: result, toolCallId });
        }
      }

      onComplete({ fullText, usage: totalUsage, priceInCents: totalPriceInCents });
    } catch (error) {
      logError('Error during agent loop:', error);
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  })();
}
