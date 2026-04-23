'use client';

import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import type { UserAndContext } from '@/auth/types';
import type { ReactNode } from 'react';
import ProfileMenu from '../navigation/profile-menu';
import { ToggleSidebarButton } from '../navigation/sidebar/collapsible-sidebar';

type CustomChatHeaderProps = {
  userAndContext: UserAndContext;
  children?: ReactNode;
};

export default function CustomChatHeader({ userAndContext, children }: CustomChatHeaderProps) {
  return (
    <HeaderPortal>
      <ToggleSidebarButton />
      <div className="grow"></div>
      {children ? <div className="flex items-center gap-4">{children}</div> : null}
      <ProfileMenu userAndContext={userAndContext} />
    </HeaderPortal>
  );
}
