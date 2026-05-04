import { ImageModelsProvider } from '@/components/providers/image-model-provider';
import { ImageStyleProvider } from '@/components/providers/image-style-provider';
import ImageGenerationChat from '@/components/image-generation/image-generation-chat';
import {
  getAvailableImageModelsForFederalState,
  getDefaultImageModel,
} from '@shared/image-generation/image-generation-service';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/auth/requireAuth';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function ImageGenerationPage() {
  const { federalState } = await requireAuth();

  if (!(federalState.featureToggles.isImageGenerationEnabled ?? false)) {
    redirect('/');
  }

  const imageModels = await getAvailableImageModelsForFederalState({
    federalStateId: federalState.id,
  });
  const selectedModel = getDefaultImageModel(imageModels);

  return (
    <ImageModelsProvider models={imageModels} defaultImageModel={selectedModel}>
      <ImageStyleProvider>
        <DefaultPageLayout header={{ headerType: 'image' }}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
              <ImageGenerationChat />
            </div>
          </div>
        </DefaultPageLayout>
      </ImageStyleProvider>
    </ImageModelsProvider>
  );
}
