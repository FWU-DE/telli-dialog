import type { UserAndContext } from '@/auth/types';
import { ReactNode } from 'react';
import { DefaultPageLayoutClient } from '@/components/layout/default-page-layout-client';

export function DefaultPageLayout({
  children,
  userAndContext,
}: {
  children: ReactNode;
  userAndContext?: UserAndContext;
}) {
  return (
    <DefaultPageLayoutClient userAndContext={userAndContext}>
      <div className="data-page-layout h-full max-w-5xl mx-auto px-6 pb-8">{children}</div>
    </DefaultPageLayoutClient>
  );
}
