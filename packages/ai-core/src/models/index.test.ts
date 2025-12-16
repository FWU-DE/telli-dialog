import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getImageModelById } from './index';

// Mock the temp-db functions
vi.mock('../temp-db/functions', () => ({
  dbGetModelById: vi.fn(),
}));

import { dbGetModelById } from '../temp-db/functions';

const mockDbGetModelById = vi.mocked(dbGetModelById);

describe('getImageModelById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return model when found', async () => {
    const mockModel = {
      id: 'model-123',
      name: 'test-model',
      provider: 'ionos',
      priceMetadata: {
        type: 'image',
        pricePerImageInCent: 50,
      },
    };

    mockDbGetModelById.mockResolvedValue(mockModel as never);

    const result = await getImageModelById('model-123');

    expect(result).toEqual(mockModel);
    expect(mockDbGetModelById).toHaveBeenCalledWith('model-123');
  });

  it('should throw error when model is not found', async () => {
    mockDbGetModelById.mockResolvedValue(null as never);

    await expect(getImageModelById('non-existent-model')).rejects.toThrow(
      'Model with id non-existent-model not found',
    );
    expect(mockDbGetModelById).toHaveBeenCalledWith('non-existent-model');
  });
});
