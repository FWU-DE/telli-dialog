import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelById } from '@shared/db/functions/llm-model';
import { dbGetCharacterByIdAndInviteCode } from '@shared/db/functions/character';
import CharacterSharedChat from '@/components/chat/character-shared-chat';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { dbGetFederalStateBySchoolId } from '@shared/db/functions/school';
import { DEFAULT_DESIGN_CONFIGURATION } from '@/db/const';
import { notFound } from 'next/navigation';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { getAvatarPictureUrl } from '@shared/files/fileService';

const searchParamsSchema = z.object({ inviteCode: z.string() });

export default async function Page(props: PageProps<'/ua/characters/[characterId]/dialog'>) {
  const { characterId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);

  const character = await dbGetCharacterByIdAndInviteCode({
    id: characterId,
    inviteCode: searchParams.inviteCode,
  });

  if (!character) {
    notFound();
  }
  const model = await dbGetLlmModelById({ modelId: character.modelId });
  const avatarPictureUrl = await getAvatarPictureUrl(character.pictureId);

  if (model === undefined) {
    notFound();
  }
  const federalState = await dbGetFederalStateBySchoolId({ schoolId: character.schoolId });
  const designConfiguration = federalState?.designConfiguration ?? DEFAULT_DESIGN_CONFIGURATION;

  return (
    <main className="h-dvh w-full">
      <LlmModelsProvider models={[model]} defaultLlmModelByCookie={model.name}>
        <ThemeProvider designConfiguration={designConfiguration}>
          <CharacterSharedChat
            {...character}
            initialMessage={character.initialMessage ?? ''}
            inviteCode={searchParams.inviteCode}
            imageSource={avatarPictureUrl}
          />
        </ThemeProvider>
      </LlmModelsProvider>
    </main>
  );
}
