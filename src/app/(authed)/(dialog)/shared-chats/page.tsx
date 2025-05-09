import Refresh from '@/components/refresh';
import { dbGetSharedChatsByUserId } from '@/db/functions/shared-school-chat';
import { getUser } from '@/auth/utils';
import { SharedChatContainer } from './shared-chat-container';
import { enrichSharedChatWithPictureUrl } from './[sharedSchoolChatId]/utils';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getUser();
  const _sharedChats = await dbGetSharedChatsByUserId({ userId: user.id });
  const sharedChats = _sharedChats.filter((c) => c.name !== '');
  const enrichedSharedChats = await enrichSharedChatWithPictureUrl({ sharedChats });
  console.log(enrichedSharedChats);
  return (
    <main className="w-full p-6">
      <Refresh />
      <SharedChatContainer sharedChats={enrichedSharedChats} user={user} />
    </main>
  );
}
