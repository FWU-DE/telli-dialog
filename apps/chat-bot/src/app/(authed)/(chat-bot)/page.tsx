import Chat from '@/components/chat/chat';
import { generateUUID } from '@shared/utils/uuid';
import { getRandomPromptSuggestions } from '@/utils/prompt-suggestions/utils';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import Logo from '@/components/common/logo';
import { requireAuth } from '@/auth/requireAuth';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common.page-titles');
  return {
    title: t('chat'),
  };
}

export default async function Page() {
  const id = generateUUID();
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
  };

  const promptSuggestions = getRandomPromptSuggestions({
    userRole: userAndContext.userRole,
  });

  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: userAndContext.federalState.id,
  });

  const logoElement = <Logo logoPath={userAndContext.federalState.pictureUrls?.logo} />;

  return (
    <LlmModelsProvider
      key={id}
      models={models}
      defaultLlmModelByCookie={userAndContext.lastUsedModel ?? DEFAULT_CHAT_MODEL}
    >
      <DefaultPageLayout
        layoutConfig={{
          layout: 'chat',
          headerConfig: {
            chatId: id,
            downloadConversationEnabled: false,
            userAndContext,
          },
        }}
      >
        <Chat
          id={id}
          initialMessages={[]}
          promptSuggestions={promptSuggestions}
          enableFileUpload={true}
          logoElement={logoElement}
        />
      </DefaultPageLayout>
    </LlmModelsProvider>
  );
}
