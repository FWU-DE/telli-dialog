'use server';
import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { getTemplates, createTemplateFromUrl } from '@telli/shared/services/templateService';

export async function getTemplatesAction() {
  await requireAdminAuth();

  return getTemplates();
}

export async function createTemplateFromUrlAction(url: string) {
  await requireAdminAuth();

  return createTemplateFromUrl(url);
}
