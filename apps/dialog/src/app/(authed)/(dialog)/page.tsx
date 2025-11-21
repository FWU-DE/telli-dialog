import Chat from '@/components/chat/chat';
import { generateUUID } from '@shared/utils/uuid';
import SelectLlmModel from '@/components/conversation/select-llm-model';
import { NewChatButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import DownloadConversationButton from './download-conversation-button';
import HeaderPortal from './header-portal';
import { getUser } from '@/auth/utils';
import { getRandomPromptSuggestions } from '@/utils/prompt-suggestions/utils';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import Logo from '@/components/common/logo';
export const dynamic = 'force-dynamic';

export default async function Page() {
  const id = generateUUID();
  const user = await getUser();

  const promptSuggestions = getRandomPromptSuggestions({ userRole: user.school.userRole });

  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  const logoElement = <Logo federalStateId={user.school.federalStateId} />;
  return (
    <LlmModelsProvider
      models={models}
      defaultLlmModelByCookie={user.lastUsedModel ?? DEFAULT_CHAT_MODEL}
    >
      <HeaderPortal>
        <div className="flex w-full gap-4 justify-center items-center z-30">
          <ToggleSidebarButton />
          <NewChatButton />
          <SelectLlmModel isStudent={user.school.userRole === 'student'} />
          <div className="flex-grow"></div>
          <DownloadConversationButton conversationId={id} disabled />
          <ProfileMenu {...user} />
        </div>
      </HeaderPortal>
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
