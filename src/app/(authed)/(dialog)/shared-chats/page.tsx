import Refresh from '@/components/refresh';
import { dbGetSharedChatsByUserId } from '@/db/functions/shared-school-chat';
import { getUser } from '@/auth/utils';
import { SharedChatContainer } from './shared-chat-container';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getUser();
  const sharedChats = await dbGetSharedChatsByUserId({ userId: user.id });

  return (
    <main className="w-full p-8">
      <Refresh />
      <SharedChatContainer sharedChats={sharedChats} user={user} />
    </main>
  );
}
