import { and, eq } from 'drizzle-orm';
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
}): Promise<LlmModel[]> {
  const rows = await db
    .select({ llmModelTable })
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

  return rows.map((r) => r.llmModelTable);
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
  const models = await fetchLlmModels({ apiKey: result.decryptedApiKey });

  const upsertedModels = await dbUpsertLlmModelsByModelsAndFederalStateId({
    federalStateId,
    models,
  });
  if (models.length !== upsertedModels.length) {
    return upsertedModels;
  }
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
    .select({ llmModelTable })
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

  return result?.llmModelTable;
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
