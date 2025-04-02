import { generateUUID } from '@/utils/uuid';
import { NewChatButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import DownloadConversationButton from '../../../download-conversation-button';
import HeaderPortal from '../../../header-portal';
import { getUser } from '@/auth/utils';
import { redirect } from 'next/navigation';
import Chat from '@/components/chat/chat';
import { dbGetCustomGptById } from '@/db/functions/custom-gpts';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetAndUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import SelectLlmModel from '@/components/conversation/select-llm-model';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ gptId: string }> }) {
  const gptId = (await params).gptId;
  const id = generateUUID();
  const user = await getUser();

  const customGpt = await dbGetCustomGptById({
    customGptId: gptId,
  });

  if (customGpt === undefined) {
    console.error(`GPT with id ${customGpt} not found`);
    redirect('/');
  }

  const models = await dbGetAndUpdateLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  const currentModel = user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <HeaderPortal>
        <div className="flex w-full gap-4 justify-center items-center z-30">
          <ToggleSidebarButton />
          <NewChatButton />
          {customGpt.name === 'Hilfe-Assistent' && (
            <SelectLlmModel isStudent={user.school.userRole === 'student'} />
          )}
          <span className="font-normal text-xl">{customGpt.name}</span>
          <div className="flex-grow"></div>
          <DownloadConversationButton conversationId={id} characterName={customGpt.name} disabled />
          <ProfileMenu {...user} />
        </div>
      </HeaderPortal>
      <Chat key={id} id={id} initialMessages={[]} customGpt={customGpt} />
    </LlmModelsProvider>
  );
}
