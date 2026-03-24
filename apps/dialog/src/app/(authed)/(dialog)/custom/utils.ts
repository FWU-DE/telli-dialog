import { AssistantSelectModel } from '@shared/db/schema';
import { getAvatarPictureUrl } from '@shared/files/fileService';

export type AssistantWithImage = AssistantSelectModel & {
  maybeSignedPictureUrl: string | undefined;
};

export async function enrichGptWithImage({
  assistants,
}: {
  assistants: AssistantSelectModel[];
}): Promise<AssistantWithImage[]> {
  return await Promise.all(
    assistants.map(async (assistant) => ({
      ...assistant,
      maybeSignedPictureUrl: await getAvatarPictureUrl(assistant.pictureId),
    })),
  );
}
