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

  const logoElement = <Logo federalStateId={userAndContext.school.federalStateId} />;

  return (
    <LlmModelsProvider
      models={models}
      defaultLlmModelByCookie={userAndContext.lastUsedModel ?? DEFAULT_CHAT_MODEL}
    >
      <ChatHeaderBar chatId={id} hasMessages={false} userAndContext={userAndContext} />
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        promptSuggestions={promptSuggestions}
        enableFileUpload={true}
        logoElement={logoElement}
      />
    </LlmModelsProvider>
  );
}
