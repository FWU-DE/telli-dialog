'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  getStaticModelConfiguration,
  type StaticModelConfigurationInput,
  updateStaticModelConfiguration,
} from '@shared/llm-models/llm-model-service';

export async function getStaticModelConfigurationAction() {
  await requireAdminAuth();
  return runServerAction('getStaticModelConfigurationAction', getStaticModelConfiguration)();
}

export async function updateStaticModelConfigurationAction(
  configurations: StaticModelConfigurationInput,
) {
  await requireAdminAuth();
  return runServerAction(
    'updateStaticModelConfigurationAction',
    updateStaticModelConfiguration,
  )(configurations);
}
