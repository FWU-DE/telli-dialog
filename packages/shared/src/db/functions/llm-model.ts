import { and, eq, inArray } from 'drizzle-orm';
import { db } from '..';
import { federalStateLlmModelMappingTable, LlmModel, llmModelTable } from '../schema';
import { KnotenpunktLlmModel } from '../../knotenpunkt/schema';
import {
  dbGetFederalStateWithDecryptedApiKeyWithResult,
  dbGetFederalStates,
} from './federal-state';
import { fetchLlmModels } from '../../knotenpunkt';

export async function dbGetLlmModelById({ modelId }: { modelId: string | undefined }) {
  if (modelId === undefined) return undefined;

  return (await db.select().from(llmModelTable).where(eq(llmModelTable.id, modelId)))[0];
}

export async function dbGetModelByName(name: string) {
  return (await db.select().from(llmModelTable).where(eq(llmModelTable.name, name)))[0];
}

export async function dbGetAllLlmModels() {
  return await db.select().from(llmModelTable).orderBy(llmModelTable.createdAt);
}

export async function dbGetLlmModelsByFederalStateId({
  federalStateId,
}: {
  federalStateId: string;
}): Promise<LlmModel[]> {
  const rows = await db
    .select()
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
    );

  return rows.map((r) => r.llm_model);
}

export async function dbUpdateLlmModelsByFederalStateId({
  federalStateId,
}: {
  federalStateId: string;
}): Promise<LlmModel[]> {
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

export async function dbUpdateLlmModelsForAllFederalStates(): Promise<Record<string, LlmModel[]>> {
  const states = await dbGetFederalStates();

  const models: Record<string, LlmModel[]> = {};
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
    .select()
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
    );

  return result?.llm_model;
}

export async function dbUpsertLlmModelsByModelsAndFederalStateId({
  federalStateId,
  models,
}: {
  federalStateId: string;
  models: KnotenpunktLlmModel[];
}) {
  const insertedModels: LlmModel[] = [];
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
