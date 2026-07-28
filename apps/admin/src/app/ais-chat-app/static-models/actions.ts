'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  dbGetAllLlmModels,
  dbGetStaticModelConfigurationWithModels,
  dbUpdateStaticModelConfigurations,
} from '@shared/db/functions/llm-model';
import { staticModelRoleSchema, type StaticModelRole } from '@shared/db/schema';
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

export async function getStaticModelConfigurationAction() {
  await requireAdminAuth();
  return runServerAction('getStaticModelConfigurationAction', async () => {
    const [models, configurations] = await Promise.all([
      dbGetAllLlmModels(),
      dbGetStaticModelConfigurationWithModels(),
    ]);
    return { models, configurations };
  })();
}

export async function updateStaticModelConfigurationAction(
  configurations: { role: StaticModelRole; modelId: string }[],
) {
  await requireAdminAuth();
  return runServerAction('updateStaticModelConfigurationAction', async () =>
    dbUpdateStaticModelConfigurations(staticModelConfigurationsSchema.parse(configurations)),
  )();
}
