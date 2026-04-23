'use client';

import type { UserAndContext } from '@/auth/types';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import {
  CustomChatHeaderContentProvider,
  useCustomChatHeaderContent,
} from '@/components/custom-chat/custom-chat-header-content';
import { ReactNode } from 'react';

type DefaultPageLayoutProps = {
  children: ReactNode;
  userAndContext?: UserAndContext;
};

function DefaultPageHeader({ userAndContext }: { userAndContext?: UserAndContext }) {
  const { headerContent } = useCustomChatHeaderContent();

  if (!userAndContext) {
    return null;
  }

  return <CustomChatHeader userAndContext={userAndContext}>{headerContent}</CustomChatHeader>;
}

export function DefaultPageLayout({ children, userAndContext }: DefaultPageLayoutProps) {
  return (
    <CustomChatHeaderContentProvider>
      <DefaultPageHeader userAndContext={userAndContext} />
      <div className="data-page-layout h-full max-w-5xl mx-auto px-6 pb-8">{children}</div>
    </CustomChatHeaderContentProvider>
  );
}
