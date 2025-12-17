import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasAccessToImageModel } from './model-access';
import type { AiModel } from '../images/types';

// Mock the api-db functions
vi.mock('../api-db/functions', () => ({
  dbHasApiKeyAccessToModel: vi.fn(),
}));

import { dbHasApiKeyAccessToModel } from '../api-db/functions';

const mockDbHasApiKeyAccessToModel = vi.mocked(dbHasApiKeyAccessToModel);

describe('hasAccessToImageModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when API key has access to the model', async () => {
    const apiKeyId = 'test-api-key-123';
    const imageModel: AiModel = {
      id: 'model-123',
      name: 'test-model',
      provider: 'ionos',
    } as AiModel;

    mockDbHasApiKeyAccessToModel.mockResolvedValue(true as never);

    const result = await hasAccessToImageModel(apiKeyId, imageModel);

    expect(result).toBe(true);
    expect(mockDbHasApiKeyAccessToModel).toHaveBeenCalledWith({
      apiKeyId: 'test-api-key-123',
      modelId: 'model-123',
    });
  });

  it('should return false when API key does not have access to the model', async () => {
    const apiKeyId = 'test-api-key-456';
    const imageModel: AiModel = {
      id: 'model-789',
      name: 'restricted-model',
      provider: 'azure',
    } as AiModel;

    mockDbHasApiKeyAccessToModel.mockResolvedValue(false as never);

    const result = await hasAccessToImageModel(apiKeyId, imageModel);

    expect(result).toBe(false);
    expect(mockDbHasApiKeyAccessToModel).toHaveBeenCalledWith({
      apiKeyId: 'test-api-key-456',
      modelId: 'model-789',
    });
  });
});
