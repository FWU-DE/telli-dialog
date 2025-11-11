import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { getUser } from '@/auth/utils';
import Chat from '@/components/chat/chat';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import Logo from '@/components/common/logo';
import { dbGetCharacterByIdWithShareData } from '@shared/db/functions/character';
import { dbGetConversationById, dbGetCoversationMessages } from '@shared/db/functions/chat';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { convertMessageModelToMessage } from '@/utils/chat/messages';

const pageContextSchema = z.object({
  params: z.object({
    characterId: z.string(),
    conversationId: z.string(),
  }),
});

export default async function Page(context: PageContext) {
  const result = pageContextSchema.safeParse(await awaitPageContext(context));
  if (!result.success) redirect('/');
  const params = result.data.params;
  const [chat, user] = await Promise.all([dbGetConversationById(params.conversationId), getUser()]);

  if (!chat) {
    throw new Error('Chat not found');
  }

  const rawChatMessages = await dbGetCoversationMessages({
    conversationId: chat.id,
    userId: user.id,
  });

  const chatMessages = convertMessageModelToMessage(rawChatMessages);

  const character = await dbGetCharacterByIdWithShareData({
    characterId: params.characterId,
    userId: user.id,
  });

  if (character === undefined) {
    console.warn(`GPT with id ${params.characterId} not found`);
    redirect('/');
  }
  const maybeSignedImageUrl = await getMaybeSignedUrlFromS3Get({ key: character.pictureId });
  const logoElement = <Logo federalStateId={user.federalState.id} />;
  return (
    <>
      <HeaderPortal>
        <ChatHeaderBar
          chatId={chat.id}
          title={character.name}
          user={user}
          downloadButtonDisabled={false}
        />
      </HeaderPortal>
      <Chat
        id={chat.id}
        initialMessages={chatMessages}
        character={character}
        enableFileUpload={false}
        imageSource={maybeSignedImageUrl}
        logoElement={logoElement}
      />
    </>
  );
}
