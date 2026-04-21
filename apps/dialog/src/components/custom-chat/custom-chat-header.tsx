import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { ToggleSidebarButton } from '../navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '../navigation/profile-menu';
import { UserAndContext } from '@/auth/types';

type CustomChatHeaderProps = {
  userAndContext: UserAndContext;
};

export default function CustomChatHeader({ userAndContext }: CustomChatHeaderProps) {
  return (
    <HeaderPortal>
      <ToggleSidebarButton />
      <div className="grow"></div>
      <ProfileMenu userAndContext={userAndContext} />
    </HeaderPortal>
  );
}
