'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import {
  dbGetAllLlmModels,
  dbGetStaticModelConfigurationWithModels,
  dbUpdateStaticModelConfigurations,
} from '@shared/db/functions/llm-model';
import { staticModelRoleSchema, type StaticModelRole } from '@shared/db/schema';

export async function getStaticModelConfigurationAction() {
  await requireAdminAuth();
  const [models, configurations] = await Promise.all([
    dbGetAllLlmModels(),
    dbGetStaticModelConfigurationWithModels(),
  ]);
  return { models, configurations };
}

export async function updateStaticModelConfigurationAction(
  configurations: { role: StaticModelRole; modelId: string }[],
) {
  await requireAdminAuth();
  for (const configuration of configurations) staticModelRoleSchema.parse(configuration.role);
  return dbUpdateStaticModelConfigurations(configurations);
}
