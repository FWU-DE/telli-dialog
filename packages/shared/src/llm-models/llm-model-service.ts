import {
  dbFindModelByRoleAndFederalStateId,
  dbGetAllLlmModels,
  dbGetStaticModelConfigurationWithModels,
  dbUpdateStaticModelConfigurations,
} from '@shared/db/functions/llm-model';
import {
  staticModelRoleSchema,
  type LlmModelSelectModel,
  type StaticModelRole,
} from '../db/schema';
import { InvalidArgumentError } from '@shared/error/invalid-argument-error';
import { getFirstTextModel } from './llm-model-utils';
import { z } from 'zod';

const staticModelConfigurationsSchema = z
  .array(
    z.object({
      role: staticModelRoleSchema,
      modelId: z.string().uuid(),
    }),
  )
  .length(staticModelRoleSchema.options.length)
  .refine(
    (configurations) =>
      new Set(configurations.map((configuration) => configuration.role)).size ===
      configurations.length,
    'Each static model role must be configured exactly once.',
  );

export type StaticModelConfigurationInput = z.infer<typeof staticModelConfigurationsSchema>;

/** Returns all models and their current static role assignments for administration. */
export async function getStaticModelConfiguration() {
  const [models, configurations] = await Promise.all([
    dbGetAllLlmModels(),
    dbGetStaticModelConfigurationWithModels(),
  ]);
  return { models, configurations };
}

/** Validates and persists a complete set of static model role assignments. */
export async function updateStaticModelConfiguration(input: unknown) {
  const configurations = staticModelConfigurationsSchema.safeParse(input);
  if (!configurations.success) {
    throw new InvalidArgumentError('Static model configuration is invalid.');
  }

  const models = await dbGetAllLlmModels();
  const modelsById = new Map(models.map((model) => [model.id, model]));

  for (const configuration of configurations.data) {
    const model = modelsById.get(configuration.modelId);
    if (!model || model.isDeleted) {
      throw new InvalidArgumentError(`Configured model is not available: ${configuration.role}`);
    }

    const requiresImageModel = configuration.role === 'default-image';
    if ((model.priceMetadata.type === 'image') !== requiresImageModel) {
      throw new InvalidArgumentError(`Configured model type is invalid: ${configuration.role}`);
    }
  }

  return dbUpdateStaticModelConfigurations(configurations.data);
}

/** Finds a configured model only when it is available to the given federal state. */
export async function findStaticModelByRoleAndFederalStateId({
  role,
  federalStateId,
}: {
  role: StaticModelRole;
  federalStateId: string;
}) {
  return dbFindModelByRoleAndFederalStateId({ role, federalStateId });
}

/** Resolves the configured default chat model with a compatible text-model fallback. */
export async function getDefaultModel({
  federalStateId,
  models,
}: {
  federalStateId: string;
  models: LlmModelSelectModel[];
}): Promise<LlmModelSelectModel | undefined> {
  return (
    (await findStaticModelByRoleAndFederalStateId({ role: 'default-chat', federalStateId })) ??
    getFirstTextModel(models)
  );
}

export async function getDefaultModelNameByFederalStateId(
  federalStateId: string,
  models: LlmModelSelectModel[],
) {
  const model = await getDefaultModel({ federalStateId, models });
  if (!model) throw new Error(`No default text model found for federal state ${federalStateId}`);
  return model.name;
}
