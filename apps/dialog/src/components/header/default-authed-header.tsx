'use client';

import { UserAndContext } from '@/auth/types';
import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';

export default function DefaultAuthedHeader({
  userAndContext,
  isNewUiDesignEnabled,
}: {
  userAndContext: UserAndContext;
  isNewUiDesignEnabled: boolean;
}) {
  return (
    <>
      <ToggleSidebarButton isNewUiDesignEnabled={isNewUiDesignEnabled} />
      <div className="grow"></div>
      <ProfileMenu userAndContext={userAndContext} />
    </>
  );
}
