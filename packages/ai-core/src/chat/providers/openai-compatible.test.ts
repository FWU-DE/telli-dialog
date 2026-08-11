import { describe, expect, it, vi } from 'vitest';
import type OpenAI from 'openai';
import { streamOpenAICompatibleAgenticResponse } from './openai-compatible';
import { AiGenerationError } from '../../errors';

function createClient(events: unknown[]): OpenAI {
  return {
    responses: {
      create: vi.fn().mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield* events;
        },
      }),
    },
  } as unknown as OpenAI;
}

describe('streamOpenAICompatibleAgenticResponse', () => {
  it.each(['response.completed', 'response.incomplete', 'response.failed'] as const)(
    'captures usage from a %s event',
    async (eventType) => {
      const client = createClient([
        { type: 'response.output_text.delta', delta: 'Hello' },
        {
          type: eventType,
          response: { usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 } },
        },
      ]);

      const events = [];
      for await (const event of streamOpenAICompatibleAgenticResponse({
        client,
        messages: [{ role: 'user', content: 'Hi' }],
        modelName: 'test-model',
        providerName: 'Test',
      })) {
        events.push(event);
      }

      expect(events).toEqual([
        { type: 'text', delta: 'Hello' },
        { type: 'finish', usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 } },
      ]);
    },
  );

  it('still throws when no usage is ever returned', async () => {
    const client = createClient([{ type: 'response.output_text.delta', delta: 'Hello' }]);

    const generator = streamOpenAICompatibleAgenticResponse({
      client,
      messages: [{ role: 'user', content: 'Hi' }],
      modelName: 'test-model',
      providerName: 'Test',
    });

    const drain = async () => {
      let result = await generator.next();
      while (!result.done) {
        result = await generator.next();
      }
    };

    await expect(drain()).rejects.toThrow(AiGenerationError);
  });
});
