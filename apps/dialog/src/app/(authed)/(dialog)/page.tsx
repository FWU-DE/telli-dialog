import Chat from '@/components/chat/chat';
import { generateUUID } from '@shared/utils/uuid';
import { getRandomPromptSuggestions } from '@/utils/prompt-suggestions/utils';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import Logo from '@/components/common/logo';
import { buildLegacyUserAndContext } from '@/auth/types';
import { requireAuth } from '@/auth/requireAuth';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const id = generateUUID();
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const promptSuggestions = getRandomPromptSuggestions({
    userRole: userAndContext.school.userRole,
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
      <DefaultPageLayout>
        <ChatHeaderBar
          chatId={id}
          downloadConversationEnabled={false}
          userAndContext={userAndContext}
        />
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
