import { beforeEach, describe, expect, it, vi } from 'vitest';
import { constructBifrostImageGenerationFn } from './bifrost';
import type { AiModel } from '../types';
import { AiGenerationError } from '../../errors';

const { generateMock, openAiConstructorMock, instrumentOpenAiClientMock, MockOpenAI } = vi.hoisted(
  () => {
    const generateMock = vi.fn();
    const openAiConstructorMock = vi.fn();

    class MockOpenAI {
      images = { generate: generateMock };

      constructor(options: unknown) {
        openAiConstructorMock(options);
      }
    }

    const instrumentOpenAiClientMock = vi.fn((client) => client);

    return { generateMock, openAiConstructorMock, instrumentOpenAiClientMock, MockOpenAI };
  },
);

vi.mock('openai', () => ({ default: MockOpenAI }));

vi.mock('@sentry/core', () => ({ instrumentOpenAiClient: instrumentOpenAiClientMock }));

vi.mock('../../env', () => ({
  env: {
    bifrostApiKey: 'bifrost-api-key',
    bifrostBaseUrl: 'http://localhost:8089/openai/v1',
  },
}));

describe('constructBifrostImageGenerationFn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates images through the Bifrost responses-compatible surface', async () => {
    generateMock.mockResolvedValue({
      data: [{ b64_json: 'base64-bifrost-image' }],
      output_format: 'png',
      usage: {
        input_tokens: 4,
        output_tokens: 5,
        output_tokens_details: {
          text_tokens: 2,
          image_tokens: 3,
        },
      },
    });

    const model = {
      id: 'model-bifrost-image',
      name: 'image-model',
      provider: 'bifrost',
      setting: { provider: 'azure', apiKey: 'unused', baseUrl: 'unused' },
    } as AiModel;

    const generateImage = constructBifrostImageGenerationFn(model);
    const result = await generateImage({ prompt: 'a cat', model: model.name });

    expect(openAiConstructorMock).toHaveBeenCalledWith({
      apiKey: 'not-needed',
      baseURL: 'http://localhost:8089/openai/v1',
      defaultHeaders: { 'x-bf-vk': 'bifrost-api-key' },
    });
    expect(generateMock).toHaveBeenCalledWith({
      model: 'azure/image-model',
      prompt: 'a cat',
      n: 1,
      size: '1024x1024',
    });
    expect(result).toEqual({
      data: ['base64-bifrost-image'],
      output_format: 'png',
      usage: {
        input_text_tokens: 4,
        output_text_tokens: 2,
        output_image_tokens: 3,
      },
    });
  });

  it('strips the anthropic prefix for vertex Claude models', async () => {
    generateMock.mockResolvedValue({
      data: [{ b64_json: 'base64-bifrost-image' }],
      output_format: 'png',
      usage: {
        input_tokens: 4,
        output_tokens: 5,
        output_tokens_details: {
          text_tokens: 2,
          image_tokens: 3,
        },
      },
    });

    const model = {
      id: 'model-bifrost-image',
      name: 'anthropic/claude-3-5-sonnet-v2@20241022',
      provider: 'bifrost',
      setting: { provider: 'google', projectId: 'project', location: 'europe-west3' },
    } as AiModel;

    const generateImage = constructBifrostImageGenerationFn(model);
    await generateImage({ prompt: 'a cat', model: model.name });

    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'vertex/claude-3-5-sonnet-v2@20241022' }),
    );
  });

  it('throws when Bifrost returns no image data after mapping', async () => {
    generateMock.mockResolvedValue({
      data: [{ b64_json: undefined }],
      output_format: 'png',
      usage: {
        input_tokens: 4,
        output_tokens: 5,
        output_tokens_details: {
          text_tokens: 2,
          image_tokens: 3,
        },
      },
    });

    const model = {
      id: 'model-bifrost-image',
      name: 'image-model',
      provider: 'bifrost',
      setting: { provider: 'azure', apiKey: 'unused', baseUrl: 'unused' },
    } as AiModel;

    const generateImage = constructBifrostImageGenerationFn(model);

    await expect(generateImage({ prompt: 'a cat', model: model.name })).rejects.toBeInstanceOf(
      AiGenerationError,
    );
    await expect(generateImage({ prompt: 'a cat', model: model.name })).rejects.toThrow(
      'No image data received from Bifrost',
    );
  });
});
