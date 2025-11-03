import { and, eq } from 'drizzle-orm';
import { db } from '..';
import { federalStateLlmModelMappingTable, LlmModel, llmModelTable } from '../schema';
import { KnotenpunktLlmModel } from '../../knotenpunkt/schema';
import { dbGetFederalStateWithDecryptedApiKeyWithResult } from './federal-state';
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
