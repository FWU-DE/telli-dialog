import { beforeEach, describe, expect, it, vi } from 'vitest';
import { constructBifrostTextGenerationFn, constructBifrostTextStreamFn } from './bifrost';
import type { AiModel } from '../types';

const { responsesCreateMock, openAiConstructorMock, instrumentOpenAiClientMock, MockOpenAI } =
  vi.hoisted(() => {
    const responsesCreateMock = vi.fn();
    const openAiConstructorMock = vi.fn();
    const instrumentOpenAiClientMock = vi.fn((client) => client);

    class MockOpenAI {
      responses = {
        create: responsesCreateMock,
      };

      constructor(options: unknown) {
        openAiConstructorMock(options);
      }
    }

    return {
      responsesCreateMock,
      openAiConstructorMock,
      instrumentOpenAiClientMock,
      MockOpenAI,
    };
  });

vi.mock('openai', () => ({
  default: MockOpenAI,
}));

vi.mock('@sentry/core', () => ({
  instrumentOpenAiClient: instrumentOpenAiClientMock,
}));

vi.mock('../../env', () => ({
  env: {
    bifrostApiKey: 'bifrost-api-key',
    bifrostBaseUrl: 'http://localhost:8089/openai/v1',
  },
}));

function createBifrostModel(settingProvider: 'azure' | 'openai' | 'ionos' | 'google'): AiModel {
  return {
    id: 'model-bifrost',
    name: 'gpt-5',
    displayName: 'GPT-5',
    provider: 'bifrost',
    setting:
      settingProvider === 'google'
        ? { provider: 'google', projectId: 'project', location: 'europe-west3' }
        : {
            provider: settingProvider,
            apiKey: 'upstream-api-key',
            baseUrl: 'https://example.com/v1',
          },
    additionalParameters: { reasoning: { effort: 'low' } },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    description: 'Bifrost test model',
    isDeleted: false,
    isNew: false,
    organizationId: 'organization-id',
    priceMetadata: {
      type: 'text',
      completionTokenPrice: 1,
      promptTokenPrice: 1,
    },
    supportedImageFormats: [],
  } satisfies AiModel;
}

describe('Bifrost chat provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the Responses API with a Bifrost-prefixed Azure model', async () => {
    responsesCreateMock.mockResolvedValue({
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: 'Hello from Bifrost' }],
        },
      ],
      usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
    });

    const model = createBifrostModel('azure');
    const generateText = constructBifrostTextGenerationFn(model);

    const result = await generateText({
      messages: [{ role: 'user', content: 'Hello' }],
      model: model.name,
      maxTokens: 128,
      temperature: 0.5,
    });

    expect(openAiConstructorMock).toHaveBeenCalledWith({
      apiKey: 'not-needed',
      baseURL: 'http://localhost:8089/openai/v1',
      defaultHeaders: { 'x-bf-vk': 'bifrost-api-key' },
    });
    expect(responsesCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'azure/gpt-5',
        stream: false,
        max_output_tokens: 128,
        reasoning: { effort: 'low' },
      }),
    );
    expect(responsesCreateMock.mock.calls[0]?.[0]).not.toHaveProperty('temperature');
    expect(result).toEqual({
      text: 'Hello from Bifrost',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    });
  });

  it('maps Google settings to the Bifrost vertex provider', async () => {
    responsesCreateMock.mockResolvedValue({
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'Vertex' }] }],
      usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
    });

    const model = createBifrostModel('google');
    const generateText = constructBifrostTextGenerationFn(model);

    await generateText({ messages: [{ role: 'user', content: 'Hello' }], model: model.name });

    expect(responsesCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'vertex/gpt-5' }),
    );
  });

  it('strips the anthropic prefix for Google Claude models on Vertex', async () => {
    responsesCreateMock.mockResolvedValue({
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'Claude' }] }],
      usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
    });

    const model = {
      ...createBifrostModel('google'),
      name: 'anthropic/claude-3-5-sonnet-v2@20241022',
    };
    const generateText = constructBifrostTextGenerationFn(model);

    await generateText({ messages: [{ role: 'user', content: 'Hello' }], model: model.name });

    expect(responsesCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'vertex/claude-3-5-sonnet-v2@20241022' }),
    );
  });

  it('streams text and maps usage', async () => {
    responsesCreateMock.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield { type: 'response.output_text.delta', delta: 'Hello' };
        yield { type: 'response.output_text.delta', delta: ' world' };
        yield {
          type: 'response.completed',
          response: { usage: { input_tokens: 4, output_tokens: 5, total_tokens: 9 } },
        };
      },
    });

    const model = createBifrostModel('ionos');
    const streamText = constructBifrostTextStreamFn(model);
    const onComplete = vi.fn();
    const chunks: string[] = [];

    for await (const chunk of streamText(
      { messages: [{ role: 'user', content: 'Hello' }], model: model.name },
      onComplete,
    )) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['Hello', ' world']);
    expect(responsesCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'ionos/gpt-5' }),
    );
    expect(onComplete).toHaveBeenCalledWith({
      promptTokens: 4,
      completionTokens: 5,
      totalTokens: 9,
    });
  });
});
