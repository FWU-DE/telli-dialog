'use client';

import { UserAndContext } from '@/auth/types';
import DefaultAuthedHeader from '@/components/header/default-authed-header';
import { useDialogHeader } from '@/components/providers/dialog-header-provider';
import { HEADER_PORTAL_ID } from './header-portal';

export default function DialogHeaderSlot({
  userAndContext,
  isNewUiDesignEnabled,
}: {
  userAndContext: UserAndContext;
  isNewUiDesignEnabled: boolean;
}) {
  const { content } = useDialogHeader();

  return (
    <div
      id={HEADER_PORTAL_ID}
      className="sticky z-10 top-0 py-4 h-19 px-6 flex gap-4 items-center justify-between bg-white"
      style={{
        position: '-webkit-sticky',
      }}
    >
      {content ?? (
        <DefaultAuthedHeader
          userAndContext={userAndContext}
          isNewUiDesignEnabled={isNewUiDesignEnabled}
        />
      )}
    </div>
  );
}
