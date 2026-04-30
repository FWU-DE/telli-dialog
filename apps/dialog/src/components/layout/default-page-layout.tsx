import { ReactNode } from 'react';
import { DefaultPageLayoutClient } from '@/components/layout/default-page-layout-client';
import type { UserAndContext } from '@/auth/types';

export type DefaultPageLayoutHeaderConfig =
  | {
      headerType: 'chat';
      chatId: string;
      downloadConversationEnabled: boolean;
      userAndContext: UserAndContext;
      title?: string;
    }
  | {
      headerType: 'image';
    }
  | {
      headerType: 'form';
    }
  | {
      headerType?: undefined;
    };

export function DefaultPageLayout({
  children,
  header,
}: {
  children: ReactNode;
  header?: DefaultPageLayoutHeaderConfig;
}) {
  return (
    <DefaultPageLayoutClient header={header}>
      <div className="data-page-layout h-full max-w-5xl mx-auto px-6 pb-8">{children}</div>
    </DefaultPageLayoutClient>
  );
}
