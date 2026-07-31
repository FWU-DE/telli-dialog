'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  getStaticModelConfiguration,
  updateStaticModelConfiguration,
} from '@shared/llm-models/llm-model-service';

export async function getStaticModelConfigurationAction() {
  await requireAdminAuth();
  return runServerAction('getStaticModelConfigurationAction', getStaticModelConfiguration)();
}

export async function updateStaticModelConfigurationAction(configuration: unknown) {
  await requireAdminAuth();
  return runServerAction(
    'updateStaticModelConfigurationAction',
    updateStaticModelConfiguration,
  )(configuration);
}
