import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { KnotenpunktLlmModel } from '../../knotenpunkt/schema';

// vi.mock factories are hoisted before variable declarations, so shared state
// must be created with vi.hoisted().
const { chain, getDbResult, setDbResult } = vi.hoisted(() => {
  let dbResult: unknown[] = [];

  // Minimal chainable Drizzle mock — every method returns `chain`.
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    'select',
    'from',
    'innerJoin',
    'where',
    '$withCache',
    'insert',
    'values',
    'onConflictDoUpdate',
    'onConflictDoNothing',
    'delete',
    'orderBy',
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockImplementation(() => chain);
  }
  chain['$withCache']!.mockImplementation(() => Promise.resolve(dbResult));
  chain['onConflictDoNothing']!.mockImplementation(() => Promise.resolve());

  return {
    chain,
    getDbResult: () => dbResult,
    setDbResult: (v: unknown[]) => {
      dbResult = v;
      chain['$withCache']!.mockImplementation(() => Promise.resolve(dbResult));
    },
  };
});

vi.mock('..', () => ({ db: chain }));

vi.mock('./federal-state', () => ({
  dbGetFederalStateWithDecryptedApiKeyWithResult: vi.fn(),
  dbGetFederalStates: vi.fn(),
}));

vi.mock('../../knotenpunkt', () => ({
  fetchLlmModels: vi.fn(),
}));

import {
  dbUpsertLlmModelsByModelsAndFederalStateId,
  dbUpdateLlmModelsByFederalStateId,
} from './llm-model';
import { dbGetFederalStateWithDecryptedApiKeyWithResult } from './federal-state';
import { fetchLlmModels } from '../../knotenpunkt';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseModel: KnotenpunktLlmModel = {
  id: 'model-1',
  name: 'gpt-4',
  displayName: 'GPT-4',
  provider: 'openai',
  description: 'Test model',
  priceMetadata: { type: 'text', completionTokenPrice: 1, promptTokenPrice: 1 },
  supportedImageFormats: [],
  createdAt: new Date('2025-01-01'),
  isNew: false,
  isDeleted: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  setDbResult([]);

  for (const m of Object.keys(chain)) {
    chain[m]!.mockImplementation(() => chain);
  }
  chain['$withCache']!.mockImplementation(() => Promise.resolve(getDbResult()));
  chain['onConflictDoNothing']!.mockImplementation(() => Promise.resolve());
});

// ── dbUpsertLlmModelsByModelsAndFederalStateId ────────────────────────────────

describe('dbUpsertLlmModelsByModelsAndFederalStateId', () => {
  it('returns inserted models with tier/openSource/dataLocation set to null', async () => {
    const result = await dbUpsertLlmModelsByModelsAndFederalStateId({
      federalStateId: 'state-1',
      models: [baseModel],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'model-1',
      name: 'gpt-4',
      tier: null,
      openSource: null,
      dataLocation: null,
    });
  });

  it('returns empty array when called with no models', async () => {
    const result = await dbUpsertLlmModelsByModelsAndFederalStateId({
      federalStateId: 'state-1',
      models: [],
    });

    expect(result).toEqual([]);
  });
});

// ── dbUpdateLlmModelsByFederalStateId ─────────────────────────────────────────

describe('dbUpdateLlmModelsByFederalStateId', () => {
  it('returns refreshed model list from DB after upsert', async () => {
    const storedModel = { ...baseModel, tier: null, openSource: null, dataLocation: null };

    (dbGetFederalStateWithDecryptedApiKeyWithResult as ReturnType<typeof vi.fn>).mockResolvedValue([
      null,
      { decryptedApiKey: 'key-123' },
    ]);
    (fetchLlmModels as ReturnType<typeof vi.fn>).mockResolvedValue([baseModel]);

    // First $withCache → existing models (empty); second → final result after upsert
    let callCount = 0;
    chain['$withCache']!.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? [] : [storedModel]);
    });

    const result = await dbUpdateLlmModelsByFederalStateId({ federalStateId: 'state-1' });

    expect(result).toEqual([storedModel]);
  });

  it('returns empty array when federal state lookup fails', async () => {
    (dbGetFederalStateWithDecryptedApiKeyWithResult as ReturnType<typeof vi.fn>).mockResolvedValue([
      new Error('not found'),
      null,
    ]);

    const result = await dbUpdateLlmModelsByFederalStateId({ federalStateId: 'state-x' });

    expect(result).toEqual([]);
  });
});
