import { and, eq, getTableColumns, inArray } from 'drizzle-orm';
import { db } from '..';
import { federalStateLlmModelMappingTable, LlmModelSelectModel, llmModelTable } from '../schema';
import { KnotenpunktLlmModel } from '../../knotenpunkt/schema';
import {
  dbGetFederalStateWithDecryptedApiKeyWithResult,
  dbGetFederalStates,
} from './federal-state';
import { fetchLlmModels } from '../../knotenpunkt';

export async function dbGetLlmModelById({ modelId }: { modelId: string | undefined }) {
  if (modelId === undefined) return undefined;
  const [model] = await db
    .select()
    .from(llmModelTable)
    .where(eq(llmModelTable.id, modelId))
    .$withCache();
  return model;
}

export async function dbGetModelByName(name: string) {
  const [model] = await db
    .select()
    .from(llmModelTable)
    .where(eq(llmModelTable.name, name))
    .$withCache();
  return model;
}

export async function dbGetAllLlmModels() {
  return db.select().from(llmModelTable).orderBy(llmModelTable.createdAt).$withCache();
}

export async function dbGetLlmModelsByFederalStateId({
  federalStateId,
}: {
  federalStateId: string;
}): Promise<LlmModelSelectModel[]> {
  return db
    .select({ ...getTableColumns(llmModelTable) })
    .from(llmModelTable)
    .innerJoin(
      federalStateLlmModelMappingTable,
      eq(federalStateLlmModelMappingTable.llmModelId, llmModelTable.id),
    )
    .where(
      and(
        eq(federalStateLlmModelMappingTable.federalStateId, federalStateId),
        eq(llmModelTable.isDeleted, false),
      ),
    )
    .$withCache();
}

export async function dbUpdateLlmModelsByFederalStateId({
  federalStateId,
}: {
  federalStateId: string;
}): Promise<LlmModelSelectModel[]> {
  const [error, result] = await dbGetFederalStateWithDecryptedApiKeyWithResult({ federalStateId });
  if (error !== null) {
    console.error({ error });
    return [];
  }
  // Fetch models from Knotenpunkt and load existing models in parallel
  const [models, existingModels] = await Promise.all([
    fetchLlmModels({ apiKey: result.decryptedApiKey }),
    dbGetLlmModelsByFederalStateId({ federalStateId }),
  ]);

  // Determine models to remove
  const modelsToRemove = existingModels
    .filter((existingModel) => !models.some((model) => model.id === existingModel.id))
    .map((model) => model.id);

  // Remove outdated models and upsert new/updated models in parallel
  await Promise.all([
    dbRemoveLlmModelsFromFederalState({
      federalStateId,
      modelIds: modelsToRemove,
    }),
    dbUpsertLlmModelsByModelsAndFederalStateId({
      federalStateId,
      models,
    }),
  ]);
  return models;
}

export async function dbUpdateLlmModelsForAllFederalStates(): Promise<
  Record<string, LlmModelSelectModel[]>
> {
  const states = await dbGetFederalStates();

  const models: Record<string, LlmModelSelectModel[]> = {};
  for (const state of states) {
    models[state.id] = await dbUpdateLlmModelsByFederalStateId({ federalStateId: state.id });
  }

  return models;
}

export async function dbGetModelByIdAndFederalStateId({
  modelId,
  federalStateId,
}: {
  modelId: string;
  federalStateId: string;
}) {
  const [result] = await db
    .select({ ...getTableColumns(llmModelTable) })
    .from(llmModelTable)
    .innerJoin(
      federalStateLlmModelMappingTable,
      eq(federalStateLlmModelMappingTable.llmModelId, llmModelTable.id),
    )
    .where(
      and(
        eq(llmModelTable.id, modelId),
        eq(federalStateLlmModelMappingTable.federalStateId, federalStateId),
      ),
    )
    .$withCache();

  return result;
}

export async function dbUpsertLlmModelsByModelsAndFederalStateId({
  federalStateId,
  models,
}: {
  federalStateId: string;
  models: KnotenpunktLlmModel[];
}) {
  const insertedModels: LlmModelSelectModel[] = [];
  for (const model of models) {
    await db
      .insert(llmModelTable)
      .values(model)
      .onConflictDoUpdate({
        target: [llmModelTable.name, llmModelTable.provider],
        set: {
          name: model.name,
          displayName: model.displayName,
          provider: model.provider,
          description: model.description,
          priceMetadata: model.priceMetadata,
          supportedImageFormats: model.supportedImageFormats,
          isNew: model.isNew,
          isDeleted: model.isDeleted,
        },
      });
    insertedModels.push(model);
    await db
      .insert(federalStateLlmModelMappingTable)
      .values({ federalStateId, llmModelId: model.id })
      .onConflictDoNothing();
  }
  return insertedModels;
}

/**
 * Removes the association between specified LLM models and a federal state.
 *
 * This function deletes entries from the federal state LLM model mapping table
 * that match both the given federal state ID and any of the provided model IDs.
 * If no model IDs are provided, the function returns early without performing any deletion.
 *
 * @param params.federalStateId - The ID of the federal state to remove model associations from
 * @param params.modelIds - An array of LLM model IDs to disassociate from the federal state
 * @returns A promise that resolves when the deletion is complete
 *
 * @example
 * ```typescript
 * await dbRemoveLlmModelsFromFederalState({
 *   federalStateId: 'state-123',
 *   modelIds: ['model-1', 'model-2']
 * });
 * ```
 */
export async function dbRemoveLlmModelsFromFederalState({
  federalStateId,
  modelIds,
}: {
  federalStateId: string;
  modelIds: string[];
}) {
  if (modelIds.length === 0) return;

  await db
    .delete(federalStateLlmModelMappingTable)
    .where(
      and(
        eq(federalStateLlmModelMappingTable.federalStateId, federalStateId),
        inArray(federalStateLlmModelMappingTable.llmModelId, modelIds),
      ),
    );
}
