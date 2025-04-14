import { generateUUID } from '@/utils/uuid';
import SelectLlmModel from '@/components/conversation/select-llm-model';
import { NewChatButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import DownloadConversationButton from '../../../download-conversation-button';
import HeaderPortal from '../../../header-portal';
import { getUser } from '@/auth/utils';
import { notFound, redirect } from 'next/navigation';
import { dbGetCharactersById } from '@/db/functions/character';
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

  const character = await dbGetCharactersById({ characterId });

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
