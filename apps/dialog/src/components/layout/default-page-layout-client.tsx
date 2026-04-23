'use client';

import type { UserAndContext } from '@/auth/types';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import {
  CustomChatHeaderContentProvider,
  useCustomChatHeaderContent,
} from '@/components/custom-chat/custom-chat-header-content';
import { DialogHeaderContent } from '@/components/layout/dialog-header';
import { ReactNode } from 'react';

function DefaultPageHeader({ userAndContext }: { userAndContext?: UserAndContext }) {
  const { headerContent } = useCustomChatHeaderContent();

  if (!userAndContext) {
    return null;
  }

  return <CustomChatHeader userAndContext={userAndContext}>{headerContent}</CustomChatHeader>;
}

export function DefaultPageLayoutClient({
  children,
  userAndContext,
}: {
  children: ReactNode;
  userAndContext?: UserAndContext;
}) {
  return (
    <CustomChatHeaderContentProvider>
      {userAndContext ? (
        <DialogHeaderContent>
          <DefaultPageHeader userAndContext={userAndContext} />
        </DialogHeaderContent>
      ) : null}
      {children}
    </CustomChatHeaderContentProvider>
  );
}
