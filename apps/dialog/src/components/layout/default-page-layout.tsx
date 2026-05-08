import { ReactNode } from 'react';
import { DefaultPageLayoutSelector } from '@/components/layout/default-page-layout-client';
import type { UserAndContext } from '@/auth/types';

export type DefaultPageLayoutConfig =
  | {
      layout: 'chat';
      headerConfig: {
        chatId: string;
        downloadConversationEnabled: boolean;
        userAndContext: UserAndContext;
        title?: string;
      };
    }
  | {
      layout: 'image';
    }
  | {
      layout: 'form';
    }
  | {
      layout: 'default';
    };

export function DefaultPageLayout({
  children,
  layoutConfig,
}: {
  children: ReactNode;
  layoutConfig?: DefaultPageLayoutConfig;
}) {
  return (
    <DefaultPageLayoutSelector layoutType={layoutConfig}>{children}</DefaultPageLayoutSelector>
  );
}
