import { getUser } from '@/auth/utils';
import { dbGetConversationAndMessages } from '@shared/db/functions/chat';
import { redirect } from 'next/navigation';
import ImageGenerationChat from '@/components/image-generation/image-generation-chat';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { ImageModelsProvider } from '@/components/providers/image-model-provider';
import { ImageStyleProvider } from '@/components/providers/image-style-provider';
import { getAvailableImageModels } from '../../actions';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { NewChatButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import HeaderPortal from '../../../header-portal';
import SelectImageModel from '@/components/image-generation/select-image-model';
import SelectImageStyle from '@/components/image-generation/select-image-style';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ prompt?: string }>;
}

export default async function Page(props: PageProps) {
  const { conversationId } = await props.params;
  const searchParams = await props.searchParams;
  const user = await getUser();

  const conversationObject = await dbGetConversationAndMessages({
    conversationId,
    userId: user.id,
  });

  if (conversationObject === undefined) {
    redirect('/image-generation');
  }

  const { conversation, messages } = conversationObject;

  // Get available image models
  const imageModels = await getAvailableImageModels();

  // Get all LLM models (for potential future use)
  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  // Find the last used model or use the first available image model
  const lastUsedModelInChat = messages.at(-1)?.modelName ?? undefined;
  const currentModel = lastUsedModelInChat ?? imageModels[0]?.name ?? '';

  // Convert messages to display format (filter for image generation messages)
  const imageMessages = messages.filter(
    (message) => message.role === 'user' || message.content.startsWith('http'),
  );

  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <ImageModelsProvider models={imageModels} defaultImageModel={currentModel}>
        <ImageStyleProvider>
          <div className="w-full h-full overflow-auto">
            <HeaderPortal>
              <div className="flex w-full gap-4 justify-center items-center z-30">
                <ToggleSidebarButton />
                <NewChatButton />
                <SelectImageModel />
                <SelectImageStyle />
                <div className="flex-grow"></div>
                <ProfileMenu {...user} />
              </div>
            </HeaderPortal>
            <ImageGenerationChat
              conversationId={conversationId}
              initialMessages={imageMessages}
              autoPrompt={searchParams.prompt}
            />
          </div>
        </ImageStyleProvider>
      </ImageModelsProvider>
    </LlmModelsProvider>
  );
}
