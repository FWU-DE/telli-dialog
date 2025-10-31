import { z } from 'zod';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelById } from '@shared/db/functions/llm-model';
import NotFound from '@/app/not-found';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { dbGetCharacterByIdAndInviteCode } from '@shared/db/functions/character';

import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import CharacterSharedChat from '@/components/chat/character-chat';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { dbGetFederalStateBySchoolId } from '@shared/db/functions/school';
import { DEFAULT_DESIGN_CONFIGURATION } from '@shared/db/const';

const pageContextSchema = z.object({
  params: z.object({
    characterId: z.string(),
  }),
  searchParams: z.object({
    inviteCode: z.string(),
  }),
});

export default async function Page(context: PageContext) {
  const { params, searchParams } = pageContextSchema.parse(await awaitPageContext(context));

  const character = await dbGetCharacterByIdAndInviteCode({
    id: params.characterId,
    inviteCode: searchParams.inviteCode,
  });

  if (character === undefined || character?.userId === null) {
    return <NotFound />;
  }
  const model = await dbGetLlmModelById({ modelId: character.modelId });
  const maybeSignedImageUrl = await getMaybeSignedUrlFromS3Get({ key: character.pictureId });

  if (model === undefined) {
    return <NotFound />;
  }
  const federalState = await dbGetFederalStateBySchoolId({ schoolId: character.schoolId });
  const designConfiguration = federalState?.designConfiguration ?? DEFAULT_DESIGN_CONFIGURATION;

  return (
    <main className="h-[100dvh] w-full">
      <LlmModelsProvider models={[model]} defaultLlmModelByCookie={model.name}>
        <ThemeProvider designConfiguration={designConfiguration}>
          <CharacterSharedChat
            {...character}
            initialMessage={character.initialMessage ?? ''}
            inviteCode={searchParams.inviteCode}
            imageSource={maybeSignedImageUrl}
          />
        </ThemeProvider>
      </LlmModelsProvider>
    </main>
  );
}
