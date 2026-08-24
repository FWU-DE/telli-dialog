'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import { getAllUrlPresets } from '@shared/web-search/url-presets/url-preset-service';

export async function getAllUrlPresetsAction() {
  await requireAuth();

  return runServerAction('getAllUrlPresetsAction', getAllUrlPresets)();
}
