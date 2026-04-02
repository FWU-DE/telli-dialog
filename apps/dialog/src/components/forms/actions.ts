'use server';

import { requireAuth } from '@/auth/requireAuth';
import { ingestWebContent } from '@/app/api/rag/ingestWebContent';
import { runServerAction } from '@shared/actions/run-server-action';

export async function ingestWebContentAction({ url }: { url: string }) {
  const { federalState } = await requireAuth();

  return runServerAction(ingestWebContent)({
    urls: [url],
    federalStateId: federalState.id,
  });
}
