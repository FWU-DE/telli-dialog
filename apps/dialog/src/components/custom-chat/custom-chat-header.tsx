import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import { ToggleSidebarButton } from '../navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '../navigation/profile-menu';
import { UserAndContext } from '@/auth/types';

type CustomChatHeaderProps = {
  userAndContext: UserAndContext;
  isNewUiDesignEnabled: boolean;
};

export default function CustomChatHeader({
  userAndContext,
  isNewUiDesignEnabled,
}: CustomChatHeaderProps) {
  return (
    <HeaderPortal>
      <ToggleSidebarButton isNewUiDesignEnabled={isNewUiDesignEnabled} />
      <div className="grow"></div>
      <ProfileMenu userAndContext={userAndContext} />
    </HeaderPortal>
  );
}
