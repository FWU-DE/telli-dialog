import {
  generateAgenticStreamWithBilling,
  type Message as AiCoreMessage,
  type TokenUsage,
  type ToolDefinition,
  type ToolCall,
} from '@ais-chat/ai-core';
import { logError } from '@shared/logging';
import * as Sentry from '@sentry/nextjs';

const MAX_AGENTIC_ITERATIONS = 3;
const MAX_TOOL_CALLS_PER_ITERATION = 2;

export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

type AgentLoopParams = {
  model: { id: string; name: string };
  apiKeyId: string;
  messages: AiCoreMessage[];
  tools?: ToolDefinition[];
  toolHandlers?: Record<string, ToolHandler>;
  agentName: string;
  onTextChunk: (delta: string) => void;
  onToolCall?: (call: ToolCall) => void;
  onComplete: (result: {
    fullText: string;
    usage: TokenUsage;
    priceInCents: number;
    agentLoopMessages: AiCoreMessage[];
  }) => void;
  onError: (error: Error) => void;
};

export function runAgentLoop({
  model,
  apiKeyId,
  messages,
  tools,
  toolHandlers,
  agentName,
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
      await Sentry.startSpan(
        {
          op: 'gen_ai.invoke_agent',
          name: `invoke_agent ${agentName}`,
          attributes: {
            'gen_ai.operation.name': 'invoke_agent',
            'gen_ai.operation.type': 'agent',
            'gen_ai.request.model': model.name,
            'gen_ai.agent.name': agentName,
          },
        },
        async (agentSpan) => {
          for (let iteration = 0; iteration < MAX_AGENTIC_ITERATIONS; iteration++) {
            const pendingToolCalls: ToolCall[] = [];
            let iterationText = '';

            const isLastIteration = iteration === MAX_AGENTIC_ITERATIONS - 1;

            const stream = generateAgenticStreamWithBilling(
              model.id,
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
              tools && tools.length > 0 && !isLastIteration
                ? { tools, toolChoice: 'auto' }
                : undefined,
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
              pendingToolCalls.map((toolCall) =>
                Sentry.startSpan(
                  {
                    op: 'gen_ai.execute_tool',
                    name: `execute_tool ${toolCall.name}`,
                    attributes: {
                      'gen_ai.operation.name': 'execute_tool',
                      'gen_ai.operation.type': 'tool',
                      'gen_ai.tool.name': toolCall.name,
                    },
                  },
                  async (toolSpan) => {
                    const handler = toolHandlers?.[toolCall.name];
                    let result: string;

                    if (handler) {
                      try {
                        const args = JSON.parse(toolCall.arguments) as Record<string, unknown>;
                        result = await handler(args);
                      } catch (error) {
                        const message =
                          error instanceof Error ? error.message : 'Tool execution failed';
                        toolSpan.setStatus({ code: 2, message });
                        logError(`Error executing tool ${toolCall.name}:`, error);
                        result = `Error: ${message}`;
                      }
                    } else {
                      const message = `Unknown tool "${toolCall.name}"`;
                      toolSpan.setStatus({ code: 2, message });
                      result = `Error: ${message}`;
                    }

                    return { toolCallId: toolCall.id, result };
                  },
                ),
              ),
            );

            for (const { toolCallId, result } of toolResults) {
              loopMessages.push({ role: 'tool', content: result, toolCallId });
            }
          }

          agentSpan.setAttribute('gen_ai.usage.input_tokens', totalUsage.promptTokens);
          agentSpan.setAttribute('gen_ai.usage.output_tokens', totalUsage.completionTokens);
          agentSpan.setAttribute('gen_ai.usage.total_tokens', totalUsage.totalTokens);
        },
      );

      onComplete({
        fullText,
        usage: totalUsage,
        priceInCents: totalPriceInCents,
        agentLoopMessages: loopMessages.slice(messages.length),
      });
    } catch (error) {
      logError('Error during agent loop:', error);
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  })();
}
