import { generateUUID } from '@/utils/uuid';
import SelectLlmModel from '@/components/conversation/select-llm-model';
import { NewChatButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import DownloadConversationButton from '../../../download-conversation-button';
import HeaderPortal from '../../../header-portal';
import { getUser } from '@/auth/utils';
import { redirect } from 'next/navigation';
import { dbGetCharacterByIdOrSchoolId, dbGetCharactersById } from '@/db/functions/character';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import Chat from '@/components/chat/chat';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ characterId: string }> }) {
  const characterId = (await params).characterId;
  const id = generateUUID();
  const user = await getUser();

  const character = await dbGetCharactersById({characterId});

  if (character === undefined) {
    console.warn(`GPT with id ${characterId} not found`);
    redirect('/');
  }

  const maybeSignedImageUrl = await getMaybeSignedUrlFromS3Get({ key: character.pictureId });

  return (
    <>
      <HeaderPortal>
        <div className="flex w-full gap-4 justify-center items-center z-30">
          <ToggleSidebarButton />
          <NewChatButton />
          <SelectLlmModel isStudent={user.school.userRole === 'student'} />
          <div className="flex-grow"></div>
          <DownloadConversationButton conversationId={id} characterName={character.name} disabled />
          <ProfileMenu {...user} />
        </div>
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
