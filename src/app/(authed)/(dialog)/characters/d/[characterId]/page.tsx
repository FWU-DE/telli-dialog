import { generateUUID } from '@/utils/uuid';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import HeaderPortal from '../../../header-portal';
import { getUser } from '@/auth/utils';
import { notFound, redirect } from 'next/navigation';
import { dbGetCharacterByIdWithShareData } from '@/db/functions/character';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import Chat from '@/components/chat/chat';
import { z } from 'zod';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';

export const dynamic = 'force-dynamic';

const pageContextSchema = z.object({
  params: z.object({
    characterId: z.string(),
  }),
});

export default async function Page(context: PageContext) {
  const result = pageContextSchema.safeParse(await awaitPageContext(context));
  if (!result.success) notFound();
  const { params } = result.data;
  const characterId = params.characterId;
  const id = generateUUID();
  const user = await getUser();

  const character = await dbGetCharacterByIdWithShareData({ characterId, userId: user.id });

  if (character === undefined) {
    console.warn(`GPT with id ${characterId} not found`);
    redirect('/');
  }

  const maybeSignedImageUrl = await getMaybeSignedUrlFromS3Get({ key: character.pictureId });

  return (
    <>
      <HeaderPortal>
        <ChatHeaderBar chatId={id} title={character.name} user={user} downloadButtonDisabled={true} />
      </HeaderPortal>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        character={character}
        imageSource={maybeSignedImageUrl}
        enableFileUpload={false}
      />
    </>
  );
}
