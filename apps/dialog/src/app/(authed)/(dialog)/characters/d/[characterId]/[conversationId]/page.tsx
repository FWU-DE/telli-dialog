import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import Chat from '@/components/chat/chat';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import Logo from '@/components/common/logo';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { convertMessageModelToMessage } from '@/utils/chat/messages';
import { requireAuth } from '@/auth/requireAuth';
import {
  getConversation,
  getConversationMessages,
} from '@shared/conversation/conversation-service';
import { handleErrorInServerComponent } from '@shared/error/handle-error-in-server-component';
import { buildLegacyUserAndContext } from '@/auth/types';
import { getCharacterForChatSession } from '@shared/characters/character-service';

export const dynamic = 'force-dynamic';

export default async function Page(
  props: PageProps<'/characters/d/[characterId]/[conversationId]'>,
) {
  const params = await props.params;
  const { user, school, federalState } = await requireAuth();
  const userWithContext = buildLegacyUserAndContext(user, school, federalState);

  const [chat, rawChatMessages, character] = await Promise.all([
    getConversation({
      conversationId: params.conversationId,
      userId: user.id,
    }),
    getConversationMessages({
      conversationId: params.conversationId,
      userId: user.id,
    }),
    getCharacterForChatSession({
      characterId: params.characterId,
      userId: user.id,
      schoolId: school.id,
    }),
  ]).catch(handleErrorInServerComponent);

  const chatMessages = convertMessageModelToMessage(rawChatMessages);
  const maybeSignedImageUrl = await getMaybeSignedUrlFromS3Get({ key: character.pictureId });
  const logoElement = <Logo federalStateId={federalState.id} />;
  return (
    <>
      <HeaderPortal>
        <ChatHeaderBar
          chatId={chat.id}
          title={character.name}
          user={userWithContext}
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
