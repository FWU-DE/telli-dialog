import { getUser } from '@/auth/utils';
import { dbGetConversationAndMessages } from '@shared/db/functions/chat';
import { dbGetRelatedFiles } from '@shared/db/functions/files';
import { redirect } from 'next/navigation';
import ImageGenerationChat from '@/components/image-generation/image-generation-chat';
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
}

export default async function Page(props: PageProps) {
  const { conversationId } = await props.params;
  const user = await getUser();

  if (!(user.federalState.featureToggles.isImageGenerationEnabled ?? false)) {
    redirect('/');
  }

  const conversationObject = await dbGetConversationAndMessages({
    conversationId,
    userId: user.id,
  });

  if (conversationObject === undefined) {
    redirect('/image-generation');
  }

  const { messages } = conversationObject;

  // Get file mappings for the conversation
  const fileMapping = await dbGetRelatedFiles(conversationId);

  // Get available image models
  const imageModels = await getAvailableImageModels();

  // Find the last used model or use the first available image model
  const lastUsedModelInChat = messages.at(-1)?.modelName ?? undefined;
  // Use first model as default for now
  const selectedModel =
    imageModels.find((model) => model.name === lastUsedModelInChat) ?? imageModels[0];
  const lastUsedStyleInChat = messages
    .slice()
    .reverse()
    .find((msg) => msg.parameters?.imageStyle !== undefined)?.parameters?.imageStyle;

  return (
    <ImageModelsProvider models={imageModels} defaultImageModel={selectedModel}>
      <ImageStyleProvider defaultImageStyle={lastUsedStyleInChat}>
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
            initialMessages={messages}
            fileMapping={fileMapping}
          />
        </div>
      </ImageStyleProvider>
    </ImageModelsProvider>
  );
}
