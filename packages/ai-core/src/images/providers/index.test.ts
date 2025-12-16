import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateImage } from './index';
import { ProviderConfigurationError } from '../errors';
import type { AiModel } from '../types';

// Mock provider modules
vi.mock('./ionos', () => ({
  constructIonosImageGenerationFn: vi.fn(),
}));

vi.mock('./azure', () => ({
  constructAzureImageGenerationFn: vi.fn(),
}));

vi.mock('./google', () => ({
  constructGoogleImageGenerationFn: vi.fn(),
}));

import { constructIonosImageGenerationFn } from './ionos';
import { constructAzureImageGenerationFn } from './azure';
import { constructGoogleImageGenerationFn } from './google';

const mockConstructIonosImageGenerationFn = vi.mocked(constructIonosImageGenerationFn);
const mockConstructAzureImageGenerationFn = vi.mocked(constructAzureImageGenerationFn);
const mockConstructGoogleImageGenerationFn = vi.mocked(constructGoogleImageGenerationFn);

describe('generateImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate image using Ionos provider', async () => {
    const model: AiModel = {
      id: 'model-123',
      name: 'ionos-model',
      provider: 'ionos',
    } as AiModel;

    const mockGenerationFn = vi.fn().mockResolvedValue({
      data: ['base64-image-data'],
      output_format: 'png',
    });

    mockConstructIonosImageGenerationFn.mockReturnValue(mockGenerationFn);

    const result = await generateImage(model, 'test prompt');

    expect(mockConstructIonosImageGenerationFn).toHaveBeenCalledWith(model);
    expect(mockGenerationFn).toHaveBeenCalledWith({
      prompt: 'test prompt',
      model: 'ionos-model',
    });
    expect(result).toEqual({
      data: ['base64-image-data'],
      output_format: 'png',
    });
  });

  it('should generate image using Azure provider', async () => {
    const model: AiModel = {
      id: 'model-456',
      name: 'azure-model',
      provider: 'azure',
    } as AiModel;

    const mockGenerationFn = vi.fn().mockResolvedValue({
      data: ['base64-azure-image'],
      output_format: 'webp',
    });

    mockConstructAzureImageGenerationFn.mockReturnValue(mockGenerationFn);

    const result = await generateImage(model, 'azure prompt');

    expect(mockConstructAzureImageGenerationFn).toHaveBeenCalledWith(model);
    expect(mockGenerationFn).toHaveBeenCalledWith({
      prompt: 'azure prompt',
      model: 'azure-model',
    });
    expect(result).toEqual({
      data: ['base64-azure-image'],
      output_format: 'webp',
    });
  });

  it('should generate image using Google provider', async () => {
    const model: AiModel = {
      id: 'model-789',
      name: 'google-model',
      provider: 'google',
    } as AiModel;

    const mockGenerationFn = vi.fn().mockResolvedValue({
      data: ['base64-google-image'],
      output_format: 'jpeg',
    });

    mockConstructGoogleImageGenerationFn.mockReturnValue(mockGenerationFn);

    const result = await generateImage(model, 'google prompt');

    expect(mockConstructGoogleImageGenerationFn).toHaveBeenCalledWith(model);
    expect(mockGenerationFn).toHaveBeenCalledWith({
      prompt: 'google prompt',
      model: 'google-model',
    });
    expect(result).toEqual({
      data: ['base64-google-image'],
      output_format: 'jpeg',
    });
  });

  it('should throw ProviderConfigurationError for unsupported provider', async () => {
    const model: AiModel = {
      id: 'model-999',
      name: 'unknown-model',
      provider: 'unsupported-provider' as any,
    } as AiModel;

    await expect(generateImage(model, 'test prompt')).rejects.toThrow(
      ProviderConfigurationError,
    );
    await expect(generateImage(model, 'test prompt')).rejects.toThrow(
      'No image generation function found for provider: unsupported-provider',
    );
  });

  it('should throw ProviderConfigurationError when provider function returns undefined', async () => {
    const model: AiModel = {
      id: 'model-123',
      name: 'ionos-model',
      provider: 'ionos',
    } as AiModel;

    mockConstructIonosImageGenerationFn.mockReturnValue(undefined as any);

    await expect(generateImage(model, 'test prompt')).rejects.toThrow(
      ProviderConfigurationError,
    );
  });
});
