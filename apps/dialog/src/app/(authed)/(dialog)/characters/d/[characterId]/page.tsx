import { generateUUID } from '@shared/utils/uuid';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import HeaderPortal from '../../../header-portal';
import { notFound } from 'next/navigation';
import Chat from '@/components/chat/chat';
import Logo from '@/components/common/logo';
import { type ChatMessage as Message } from '@/types/chat';
import { getCharacterForChatSession } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { getAvatarPictureUrl } from '@shared/files/fileService';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/characters/d/[characterId]'>) {
  const { characterId } = await props.params;

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

  const avatarPictureUrl = await getAvatarPictureUrl(character.pictureId);
  const logoElement = <Logo federalStateId={federalState.id} />;
  return (
    <>
      <HeaderPortal>
        <ChatHeaderBar
          chatId={id}
          title={character.name}
          hasMessages={false}
          userAndContext={userAndContext}
        />
      </HeaderPortal>
      <Chat
        key={id}
        id={id}
        initialMessages={initialMessages}
        character={character}
        imageSource={avatarPictureUrl}
        enableFileUpload={false}
        logoElement={logoElement}
      />
    </>
  );
}
