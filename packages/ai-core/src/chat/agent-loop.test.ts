import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAgentLoop } from './agent-loop';
import type { Message, TokenUsage, StreamEvent } from './types';

// Mock the generateAgenticStreamWithBilling import
const mockGenerateAgenticStreamWithBilling = vi.fn();

vi.mock('./index', () => ({
  generateAgenticStreamWithBilling: (...args: unknown[]) =>
    mockGenerateAgenticStreamWithBilling(...args),
}));

describe('agent-loop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts double newlines between iterations when both produce text', async () => {
    const messages: Message[] = [{ role: 'user', content: 'Test query' }];
    const onTextChunk = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();

    const usage: TokenUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    };

    // Iteration 1: produces text "Hello world." then a tool call
    // Iteration 2: produces text "More info." with no tool calls
    let callCount = 0;
    mockGenerateAgenticStreamWithBilling.mockImplementation(async function* () {
      callCount++;
      if (callCount === 1) {
        // First iteration
        yield { type: 'text', delta: 'Hello ' } satisfies StreamEvent;
        yield { type: 'text', delta: 'world.' } satisfies StreamEvent;
        yield {
          type: 'tool_call',
          call: {
            id: 'call_123',
            name: 'test_tool',
            arguments: '{}',
          },
        } satisfies StreamEvent;
        yield { type: 'finish', usage } satisfies StreamEvent;
      } else {
        // Second iteration
        yield { type: 'text', delta: 'More ' } satisfies StreamEvent;
        yield { type: 'text', delta: 'info.' } satisfies StreamEvent;
        yield { type: 'finish', usage } satisfies StreamEvent;
      }
    });

    const toolRegistry = {
      test_tool: {
        definition: { name: 'test_tool', description: 'Test', parameters: {} },
        handler: async () => 'tool result',
      },
    };

    runAgentLoop({
      modelId: 'test-model',
      apiKeyId: 'test-key',
      messages,
      toolRegistry,
      onTextChunk,
      onComplete,
      onError,
    });

    // Wait for async completion
    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });

    expect(onError).not.toHaveBeenCalled();

    // Verify onTextChunk received the separator
    const allChunks = onTextChunk.mock.calls.map((call) => call[0]).join('');
    expect(allChunks).toBe('Hello world.\n\nMore info.');

    // Verify onComplete received the correct fullText
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        fullText: 'Hello world.\n\nMore info.',
      }),
    );
  });

  it('does not insert separator on first iteration', async () => {
    const messages: Message[] = [{ role: 'user', content: 'Test query' }];
    const onTextChunk = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();

    const usage: TokenUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    };

    // Single iteration with no tool calls
    mockGenerateAgenticStreamWithBilling.mockImplementation(async function* () {
      yield { type: 'text', delta: 'Single response.' } satisfies StreamEvent;
      yield { type: 'finish', usage } satisfies StreamEvent;
    });

    runAgentLoop({
      modelId: 'test-model',
      apiKeyId: 'test-key',
      messages,
      onTextChunk,
      onComplete,
      onError,
    });

    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });

    expect(onError).not.toHaveBeenCalled();

    const allChunks = onTextChunk.mock.calls.map((call) => call[0]).join('');
    expect(allChunks).toBe('Single response.');

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        fullText: 'Single response.',
      }),
    );
  });

  it('does not insert separator when first iteration produces no text (tool-only)', async () => {
    const messages: Message[] = [{ role: 'user', content: 'Test query' }];
    const onTextChunk = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();

    const usage: TokenUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    };

    // Iteration 1: tool call only, no text
    // Iteration 2: produces text
    let callCount = 0;
    mockGenerateAgenticStreamWithBilling.mockImplementation(async function* () {
      callCount++;
      if (callCount === 1) {
        yield {
          type: 'tool_call',
          call: {
            id: 'call_123',
            name: 'test_tool',
            arguments: '{}',
          },
        } satisfies StreamEvent;
        yield { type: 'finish', usage } satisfies StreamEvent;
      } else {
        yield { type: 'text', delta: 'Result after tool.' } satisfies StreamEvent;
        yield { type: 'finish', usage } satisfies StreamEvent;
      }
    });

    const toolRegistry = {
      test_tool: {
        definition: { name: 'test_tool', description: 'Test', parameters: {} },
        handler: async () => 'tool result',
      },
    };

    runAgentLoop({
      modelId: 'test-model',
      apiKeyId: 'test-key',
      messages,
      toolRegistry,
      onTextChunk,
      onComplete,
      onError,
    });

    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });

    expect(onError).not.toHaveBeenCalled();

    const allChunks = onTextChunk.mock.calls.map((call) => call[0]).join('');
    expect(allChunks).toBe('Result after tool.');

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        fullText: 'Result after tool.',
      }),
    );
  });

  it('does not double-space when model already ends with double newlines', async () => {
    const messages: Message[] = [{ role: 'user', content: 'Test query' }];
    const onTextChunk = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();

    const usage: TokenUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    };

    // Iteration 1: produces text ending with \n\n, then a tool call
    // Iteration 2: produces text
    let callCount = 0;
    mockGenerateAgenticStreamWithBilling.mockImplementation(async function* () {
      callCount++;
      if (callCount === 1) {
        yield { type: 'text', delta: 'First response.\n\n' } satisfies StreamEvent;
        yield {
          type: 'tool_call',
          call: {
            id: 'call_123',
            name: 'test_tool',
            arguments: '{}',
          },
        } satisfies StreamEvent;
        yield { type: 'finish', usage } satisfies StreamEvent;
      } else {
        yield { type: 'text', delta: 'Second response.' } satisfies StreamEvent;
        yield { type: 'finish', usage } satisfies StreamEvent;
      }
    });

    const toolRegistry = {
      test_tool: {
        definition: { name: 'test_tool', description: 'Test', parameters: {} },
        handler: async () => 'tool result',
      },
    };

    runAgentLoop({
      modelId: 'test-model',
      apiKeyId: 'test-key',
      messages,
      toolRegistry,
      onTextChunk,
      onComplete,
      onError,
    });

    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });

    expect(onError).not.toHaveBeenCalled();

    const allChunks = onTextChunk.mock.calls.map((call) => call[0]).join('');
    // Should NOT have quadruple newlines
    expect(allChunks).toBe('First response.\n\nSecond response.');

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        fullText: 'First response.\n\nSecond response.',
      }),
    );
  });

  it('inserts separators between all three iterations when all produce text', async () => {
    const messages: Message[] = [{ role: 'user', content: 'Test query' }];
    const onTextChunk = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();

    const usage: TokenUsage = {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    };

    // Three iterations, each producing text and a tool call (except the last)
    let callCount = 0;
    mockGenerateAgenticStreamWithBilling.mockImplementation(async function* () {
      callCount++;
      if (callCount === 1) {
        yield { type: 'text', delta: 'First.' } satisfies StreamEvent;
        yield {
          type: 'tool_call',
          call: { id: 'call_1', name: 'test_tool', arguments: '{}' },
        } satisfies StreamEvent;
        yield { type: 'finish', usage } satisfies StreamEvent;
      } else if (callCount === 2) {
        yield { type: 'text', delta: 'Second.' } satisfies StreamEvent;
        yield {
          type: 'tool_call',
          call: { id: 'call_2', name: 'test_tool', arguments: '{}' },
        } satisfies StreamEvent;
        yield { type: 'finish', usage } satisfies StreamEvent;
      } else {
        yield { type: 'text', delta: 'Third.' } satisfies StreamEvent;
        yield { type: 'finish', usage } satisfies StreamEvent;
      }
    });

    const toolRegistry = {
      test_tool: {
        definition: { name: 'test_tool', description: 'Test', parameters: {} },
        handler: async () => 'tool result',
      },
    };

    runAgentLoop({
      modelId: 'test-model',
      apiKeyId: 'test-key',
      messages,
      toolRegistry,
      onTextChunk,
      onComplete,
      onError,
    });

    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });

    expect(onError).not.toHaveBeenCalled();

    const allChunks = onTextChunk.mock.calls.map((call) => call[0]).join('');
    expect(allChunks).toBe('First.\n\nSecond.\n\nThird.');

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        fullText: 'First.\n\nSecond.\n\nThird.',
      }),
    );
  });
});
