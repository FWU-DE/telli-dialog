import { permanentRedirect } from 'next/navigation';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { getAssistantByUser } from '@shared/assistants/assistant-service';
import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { Suspense } from 'react';
import { Spinner } from '@ui/components/spinner';

const searchParamsSchema = z.object({
  create: z.string().optional().default('false'),
  templateId: z.string().optional(),
});

export default function Page(props: PageProps<'/custom/editor/[customGptId]'>) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Spinner className="size-8" />
        </div>
      }
    >
      <PageContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function PageContent({
  params,
  searchParams: searchParamsPromise,
}: PageProps<'/custom/editor/[customGptId]'>) {
  const { customGptId: assistantId } = await params;
  const { create } = parseSearchParams(searchParamsSchema, await searchParamsPromise);

  const { user } = await requireAuth();

  const { assistant } = await getAssistantByUser({
    assistantId,
    user,
  }).catch(handleErrorInServerComponent);

  const readOnly = assistant.userId !== user.id;

  if (readOnly) {
    permanentRedirect(`/assistants/${assistantId}`);
  }
  permanentRedirect(`/assistants/editor/${assistantId}${create === 'true' ? '?create=true' : ''}`);
  return null;
}
