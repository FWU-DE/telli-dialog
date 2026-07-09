'use server';

import { requireAuth } from '@/auth/requireAuth';
import { ingestWebContent } from '@/app/api/rag/ingestWebContent';
import { runServerAction } from '@shared/actions/run-server-action';
import { INGEST_WEB_CONTENT_ACTION_NAME } from '@/server-action-names';

export async function ingestWebContentAction({ url }: { url: string }) {
  const { federalState } = await requireAuth();

  return runServerAction(
    INGEST_WEB_CONTENT_ACTION_NAME,
    ingestWebContent,
  )({
    urls: [url],
    federalStateId: federalState.id,
  });
}
