import { isWebSearchAvailableForFederalState } from '@/app/api/chat/websearch';
import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAssistantByUser } from '@shared/assistants/assistant-service';
import { AssistantView } from './assistant-view';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Spinner } from '@ui/components/spinner';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('assistants.page-titles');
  return {
    title: t('view'),
  };
}

export default function Page(props: PageProps<'/assistants/[assistantId]'>) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Spinner className="size-8" />
        </div>
      }
    >
      <PageContent params={props.params} />
    </Suspense>
  );
}

async function PageContent({ params }: { params: PageProps<'/assistants/[assistantId]'>['params'] }) {
  const { assistantId } = await params;
  const { user, federalState } = await requireAuth();

  const { assistant, fileMappings, pictureUrl } = await getAssistantByUser({
    assistantId: assistantId,
    user,
  }).catch(handleErrorInServerComponent);

  return (
    <DefaultPageLayout>
      <AssistantView
        assistant={assistant}
        fileMappings={fileMappings}
        pictureUrl={pictureUrl}
        isWebSearchAvailable={isWebSearchAvailableForFederalState(federalState.featureToggles)}
      />
    </DefaultPageLayout>
  );
}
