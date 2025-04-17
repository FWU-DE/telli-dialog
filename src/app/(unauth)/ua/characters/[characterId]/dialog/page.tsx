import { z } from 'zod';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelById } from '@/db/functions/llm-model';
import NotFound from '@/app/not-found';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { dbGetCharacterByIdAndInviteCode } from '@/db/functions/character';
import CharacterSharedChat from './character-chat';

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

  if (model === undefined) {
    return <NotFound />;
  }
  return (
    <main className="h-[100dvh] w-full">
      <LlmModelsProvider models={[model]} defaultLlmModelByCookie={model.name}>
        <CharacterSharedChat {...character} inviteCode={searchParams.inviteCode} />
      </LlmModelsProvider>
    </main>
  );
}
