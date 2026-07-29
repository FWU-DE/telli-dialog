'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import { UrlPresetInsert, UrlPresetUpdate } from '@shared/web-search/url-presets/types';
import {
  insertUrlPreset,
  getAllUrlPresets,
  deleteUrlPreset,
  updateUrlPreset,
} from '@shared/web-search/url-presets/url-preset-admin-service';

export async function getUrlPresetsAction() {
  await requireAdminAuth();

  return runServerAction('getAllUrlPresets', getAllUrlPresets)();
}

export async function insertUrlPresetAction(data: UrlPresetInsert) {
  await requireAdminAuth();

  return runServerAction('insertUrlPreset', insertUrlPreset)(data);
}

export async function updateUrlPresetAction(id: string, data: UrlPresetUpdate) {
  await requireAdminAuth();

  return runServerAction('updateUrlPreset', updateUrlPreset)(id, data);
}

export async function deleteUrlPresetAction(id: string) {
  await requireAdminAuth();

  return runServerAction('deleteUrlPreset', deleteUrlPreset)(id);
}
