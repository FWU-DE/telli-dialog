import { generateUUID } from '@shared/utils/uuid';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import HeaderPortal from '../../../header-portal';
import { notFound } from 'next/navigation';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import Chat from '@/components/chat/chat';
import { z } from 'zod';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import Logo from '@/components/common/logo';
import { Message } from 'ai';
import { getCharacterForChatSession } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';

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
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const character = await getCharacterForChatSession({
    characterId,
    userId: user.id,
    schoolId: school.id,
  }).catch(() => {
    notFound();
  });

  const initialMessages: Message[] = character.initialMessage
    ? [{ id: 'initial-message', role: 'assistant', content: character.initialMessage }]
    : [];

  const maybeSignedImageUrl = await getMaybeSignedUrlFromS3Get({ key: character.pictureId });
  const logoElement = <Logo federalStateId={federalState.id} />;
  return (
    <>
      <HeaderPortal>
        <ChatHeaderBar
          chatId={id}
          title={character.name}
          user={userAndContext}
          downloadButtonDisabled={true}
        />
      </HeaderPortal>
      <Chat
        key={id}
        id={id}
        initialMessages={initialMessages}
        character={character}
        imageSource={maybeSignedImageUrl}
        enableFileUpload={false}
        logoElement={logoElement}
      />
    </>
  );
}
