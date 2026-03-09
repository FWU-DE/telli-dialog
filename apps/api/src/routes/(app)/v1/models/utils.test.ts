import { describe, it, expect } from 'vitest';
import { obscureModels } from './utils';
import type { LlmModel } from '@telli/api-database';

const baseModel: LlmModel = {
  id: 'model-1',
  provider: 'openai',
  name: 'gpt-4',
  displayName: 'GPT-4',
  description: 'A test model',
  setting: { apiKey: 'sk-secret', baseUrl: 'https://api.openai.com/v1', provider: 'openai' },
  priceMetadata: { type: 'text', completionTokenPrice: 1, promptTokenPrice: 1 },
  organizationId: 'org-123',
  createdAt: new Date('2025-01-01'),
  supportedImageFormats: [],
  additionalParameters: {},
  isNew: false,
  isDeleted: false,
};

describe('obscureModels', () => {
  it('removes setting and organizationId from each model', () => {
    const result = obscureModels([baseModel]);
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('setting');
    expect(result[0]).not.toHaveProperty('organizationId');
  });

  it('preserves all other model fields', () => {
    const [obscured] = obscureModels([baseModel]);
    expect(obscured!.id).toBe('model-1');
    expect(obscured!.name).toBe('gpt-4');
    expect(obscured!.displayName).toBe('GPT-4');
    expect(obscured!.provider).toBe('openai');
    expect(obscured!.description).toBe('A test model');
  });

  it('returns empty array for empty input', () => {
    expect(obscureModels([])).toEqual([]);
  });
});
