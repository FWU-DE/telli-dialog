import { eq } from 'drizzle-orm';
import { dbGetModelsByApiKeyId } from '../../../../api-database/src/functions/models';
import type { LlmModel as ApiLlmModel } from '../../../../api-database/src/schema';
import { db } from '..';
import { LlmModelSelectModel, llmModelTable } from '../schema';
import { dbGetFederalStateById, dbGetFederalStates } from './federal-state';
import { logError } from '@shared/logging';

type PublicLlmModelSource = Pick<
  ApiLlmModel,
  | 'id'
  | 'provider'
  | 'name'
  | 'displayName'
  | 'description'
  | 'priceMetadata'
  | 'createdAt'
  | 'supportedImageFormats'
  | 'isNew'
  | 'isDeleted'
>;

function toPublicLlmModel(model: ApiLlmModel): PublicLlmModelSource {
  return {
    id: model.id,
    provider: model.provider,
    name: model.name,
    displayName: model.displayName,
    description: model.description,
    priceMetadata: model.priceMetadata,
    createdAt: model.createdAt,
    supportedImageFormats: model.supportedImageFormats,
    isNew: model.isNew,
    isDeleted: model.isDeleted,
  };
}

function sortModels(models: PublicLlmModelSource[]) {
  return [...models].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
}

async function dbGetSourceLlmModelsByFederalStateId({
  federalStateId,
}: {
  federalStateId: string;
}): Promise<PublicLlmModelSource[]> {
  const federalState = await dbGetFederalStateById(federalStateId);

  if (federalState?.apiKeyId === null || federalState?.apiKeyId === undefined) {
    logError(
      'Federal state has no API key ID',
      new Error(`Missing apiKeyId for ${federalStateId}`),
      {
        federalStateId,
      },
    );
    return [];
  }

  const models = await dbGetModelsByApiKeyId({ apiKeyId: federalState.apiKeyId });

  return sortModels(models.map(toPublicLlmModel));
}

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
  const models = await dbGetSourceLlmModelsByFederalStateId({ federalStateId });

  return models.filter((model) => !model.isDeleted) as LlmModelSelectModel[];
}

export async function dbUpdateLlmModelsByFederalStateId({
  federalStateId,
}: {
  federalStateId: string;
}): Promise<LlmModelSelectModel[]> {
  const models = await dbGetSourceLlmModelsByFederalStateId({ federalStateId });

  await dbUpsertLlmModelsByModels({ models });

  return models as LlmModelSelectModel[];
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
  const models = await dbGetLlmModelsByFederalStateId({ federalStateId });

  return models.find((model) => model.id === modelId);
}

export async function dbUpsertLlmModelsByModelsAndFederalStateId({
  models,
}: {
  federalStateId: string;
  models: PublicLlmModelSource[];
}) {
  return dbUpsertLlmModelsByModels({ models });
}

async function dbUpsertLlmModelsByModels({ models }: { models: PublicLlmModelSource[] }) {
  const insertedModels: PublicLlmModelSource[] = [];

  for (const model of models) {
    await db
      .insert(llmModelTable)
      .values(model)
      .onConflictDoUpdate({
        target: [llmModelTable.provider, llmModelTable.name],
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
  }

  return insertedModels;
}
