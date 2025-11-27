import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { getUser } from '@/auth/utils';
import Chat from '@/components/chat/chat';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import Logo from '@/components/common/logo';
import { dbGetCharacterByIdWithShareData } from '@shared/db/functions/character';
import { dbGetConversationById, dbGetCoversationMessages } from '@shared/db/functions/chat';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { notFound, redirect } from 'next/navigation';
import { convertMessageModelToMessage } from '@/utils/chat/messages';

export default async function Page(
  props: PageProps<'/characters/d/[characterId]/[conversationId]'>,
) {
  const params = await props.params;

  const [chat, user] = await Promise.all([dbGetConversationById(params.conversationId), getUser()]);

  if (!chat) {
    notFound();
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
