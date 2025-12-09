import { getUser } from '@/auth/utils';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import HeaderPortal from '../header-portal';
import { ImageModelsProvider } from '@/components/providers/image-model-provider';
import { ImageStyleProvider } from '@/components/providers/image-style-provider';
import ImageGenerationChat from '@/components/image-generation/image-generation-chat';
import SelectImageModel from '@/components/image-generation/select-image-model';
import SelectImageStyle from '@/components/image-generation/select-image-style';
import { getAvailableImageModels } from './actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ImageGenerationPage() {
  const user = await getUser();

  if (!(user.federalState.featureToggles.isImageGenerationEnabled ?? false)) {
    redirect('/');
  }
  const imageModels = await getAvailableImageModels();

  // Use first model as default for now
  const selectedModel = imageModels[0];
  return (
    <ImageModelsProvider models={imageModels} defaultImageModel={selectedModel}>
      <ImageStyleProvider>
        <div className="w-full h-full overflow-auto">
          <HeaderPortal>
            <div className="flex w-full gap-4 justify-center items-center z-30">
              <ToggleSidebarButton />
              <SelectImageModel />
              <SelectImageStyle />
              <div className="flex-grow"></div>
              <ProfileMenu {...user} />
            </div>
          </HeaderPortal>

          <ImageGenerationChat />
        </div>
      </ImageStyleProvider>
    </ImageModelsProvider>
  );
}
