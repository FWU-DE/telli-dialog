import type { Message as AiCoreMessage, TokenUsage, ToolCall, ToolRegistry } from './types';

const MAX_AGENTIC_ITERATIONS = 3;
const MAX_TOOL_CALLS_PER_ITERATION = 2;

function logError(message: string, error: unknown) {
  console.error(message, error);
}

type RunAgentLoopParams = {
  modelId: string;
  apiKeyId: string;
  messages: AiCoreMessage[];
  toolRegistry?: ToolRegistry;
  onTextChunk: (delta: string) => void;
  onComplete: (result: {
    fullText: string;
    usage: TokenUsage;
    priceInCents: number;
    agentLoopMessages: AiCoreMessage[];
  }) => void;
  onError: (error: Error) => void;
};

export function runAgentLoop({
  modelId,
  apiKeyId,
  messages,
  toolRegistry,
  onTextChunk,
  onComplete,
  onError,
}: RunAgentLoopParams): void {
  void (async () => {
    const { generateAgenticStreamWithBilling } = await import('./index');

    let fullText = '';
    let totalUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let totalPriceInCents = 0;
    const loopMessages = [...messages];
    const tools = toolRegistry ? Object.values(toolRegistry).map((entry) => entry.definition) : [];

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
          tools.length > 0 && !isLastIteration ? { tools, toolChoice: 'auto' } : undefined,
        );

        for await (const event of stream) {
          if (event.type === 'text') {
            iterationText += event.delta;
            onTextChunk(event.delta);
          } else if (
            event.type === 'tool_call' &&
            pendingToolCalls.length < MAX_TOOL_CALLS_PER_ITERATION
          ) {
            pendingToolCalls.push(event.call);
          }
        }

        fullText += iterationText;

        if (pendingToolCalls.length === 0) {
          break;
        }

        loopMessages.push({
          role: 'assistant',
          content: iterationText,
          toolCalls: pendingToolCalls,
        });

        const toolResults = await Promise.all(
          pendingToolCalls.map(async (toolCall) => {
            const registryEntry = toolRegistry?.[toolCall.name];
            let result: string;

            if (registryEntry) {
              try {
                const args = JSON.parse(toolCall.arguments) as Record<string, unknown>;
                result = await registryEntry.handler(args);
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
