import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LlmModelSelectModel } from '../db/schema';

const { dbFindModelByRoleAndFederalStateId } = vi.hoisted(() => ({
  dbFindModelByRoleAndFederalStateId: vi.fn(),
}));

vi.mock('@shared/db/functions/llm-model', () => ({
  dbFindModelByRoleAndFederalStateId,
}));

import { getDefaultModel } from './llm-model-service';

const textModel = (id: string, name: string): LlmModelSelectModel => ({
  id,
  provider: 'test',
  name,
  displayName: name,
  description: '',
  priceMetadata: {
    type: 'text',
    completionTokenPrice: 0,
    promptTokenPrice: 0,
  },
  createdAt: new Date(),
  supportedImageFormats: [],
  isNew: false,
  isDeleted: false,
});

describe('getDefaultModel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the configured default model when it is available to the federal state', async () => {
    const configuredModel = textModel('configured', 'configured-model');
    dbFindModelByRoleAndFederalStateId.mockResolvedValue(configuredModel);

    await expect(
      getDefaultModel({
        federalStateId: 'DE-BY',
        models: [textModel('fallback', 'fallback-model')],
      }),
    ).resolves.toBe(configuredModel);
  });

  it('falls back to the first non-Mistral text model when the configured model is unavailable', async () => {
    dbFindModelByRoleAndFederalStateId.mockResolvedValue(undefined);
    const fallbackModel = textModel('fallback', 'fallback-model');

    await expect(
      getDefaultModel({
        federalStateId: 'DE-BY',
        models: [textModel('mistral', 'mistral-small'), fallbackModel],
      }),
    ).resolves.toBe(fallbackModel);
  });

  it('returns undefined when no compatible text model is available', async () => {
    dbFindModelByRoleAndFederalStateId.mockResolvedValue(undefined);

    await expect(getDefaultModel({ federalStateId: 'DE-BY', models: [] })).resolves.toBeUndefined();
  });
});
