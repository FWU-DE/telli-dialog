'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { UrlPresetInsert, UrlPresetUpdate } from '@shared/web-search/url-presets/types';
import {
  insertUrlPreset,
  getAllUrlPresets,
  deleteUrlPreset,
  updateUrlPreset,
} from '@shared/web-search/url-presets/url-preset-admin-service';

export async function getUrlPresetsAction() {
  await requireAdminAuth();

  return getAllUrlPresets();
}

export async function insertUrlPresetAction(data: UrlPresetInsert) {
  await requireAdminAuth();

  return insertUrlPreset(data);
}

export async function updateUrlPresetAction(id: string, data: UrlPresetUpdate) {
  await requireAdminAuth();

  return updateUrlPreset(id, data);
}

export async function deleteUrlPresetAction(id: string) {
  await requireAdminAuth();

  return deleteUrlPreset(id);
}
