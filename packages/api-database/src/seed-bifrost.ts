import { syncBifrostProviders } from './bifrost-provider-sync';
import { LlmModel, LlmInsertModel } from './schema';

const BIFROST_UPSTREAM_PROVIDERS = new Set(['azure', 'openai', 'ionos', 'google']);

type SeedModel = LlmInsertModel | LlmModel;

export function normalizeSeedModelForBifrost<TModel extends SeedModel>(model: TModel): TModel {
  if (!BIFROST_UPSTREAM_PROVIDERS.has(model.setting.provider)) return model;

  return {
    ...model,
    provider: 'bifrost',
  };
}

export function normalizeSeedModelsForBifrost<TModel extends SeedModel>(
  models: TModel[],
): TModel[] {
  return models.map(normalizeSeedModelForBifrost);
}

export async function syncSeedModelsToBifrost(models: LlmModel[]): Promise<void> {
  await syncBifrostProviders(models, {
    bifrostAdminUrl: process.env.BIFROST_ADMIN_URL,
    bifrostAdminUsername: process.env.BIFROST_ADMIN_USERNAME,
    bifrostAdminPassword: process.env.BIFROST_ADMIN_PASSWORD,
    logger: {
      info: (message, context) => {
        console.log(message, context ?? '');
      },
      warning: (message, context) => {
        console.warn(message, context ?? '');
      },
      error: (message, error, context) => {
        console.error(message, error ?? '', context ?? '');
      },
    },
  });
}
