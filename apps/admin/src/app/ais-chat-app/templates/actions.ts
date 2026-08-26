'use server';
import { requireAdminAppAccess } from '@/auth/requireAdminAuth';
import { getTemplates, createTemplateFromUrl } from '@ais-chat/shared/templates/template-service';

export async function getTemplatesAction() {
  await requireAdminAppAccess();

  return getTemplates();
}

export async function createTemplateFromUrlAction(url: string) {
  await requireAdminAppAccess();

  return createTemplateFromUrl(url);
}
