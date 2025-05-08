import { getUser } from '@/auth/utils';
import HeaderPortal from '../../header-portal';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import { dbCreateSharedSchoolChat } from '../actions';
import SharedSchoolChatForm from '../[sharedSchoolChatId]/shared-school-chat-form';

export default async function Page() {
  const user = await getUser();
  const defaultSharedSchoolChat = await dbCreateSharedSchoolChat({ userId: user.id });

  if (defaultSharedSchoolChat === undefined) {
    throw new Error('Could not create default shared school chat');
  }

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <SharedSchoolChatForm {...defaultSharedSchoolChat} existingFiles={[]} isCreating={true} />
      </div>
    </div>
  );
}
