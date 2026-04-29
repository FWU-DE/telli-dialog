'use client';

import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import {
  CustomChatHeaderContentProvider,
  useCustomChatHeaderContent,
} from '@/components/custom-chat/custom-chat-header-content';
import {
  ChatHeaderBarCompactMenuContent,
  ChatHeaderBarContent,
} from '@/components/chat/header-bar';
import SelectImageModel from '@/components/image-generation/select-image-model';
import SelectImageStyle from '@/components/image-generation/select-image-style';
import {
  DialogHeaderCompactMenuContent,
  DialogHeaderContent,
} from '@/components/layout/dialog-header';
import type { DefaultPageLayoutHeaderConfig } from '@/components/layout/default-page-layout';
import { ReactNode } from 'react';

function DefaultPageHeader({ header }: { header?: DefaultPageLayoutHeaderConfig }) {
  const { formStateProps } = useCustomChatHeaderContent();

  if (!header?.headerType) {
    return null;
  }

  if (header.headerType === 'form') {
    return (
      <DialogHeaderContent>
        <CustomChatHeader
          showFormState={Boolean(formStateProps)}
          formStateProps={formStateProps ?? undefined}
        />
      </DialogHeaderContent>
    );
  }

  if (header.headerType === 'image') {
    return (
      <DialogHeaderContent>
        <div className="flex w-full gap-4">
          <SelectImageModel />
          <SelectImageStyle />
        </div>
      </DialogHeaderContent>
    );
  }

  return (
    <>
      <DialogHeaderCompactMenuContent>
        <ChatHeaderBarCompactMenuContent
          chatId={header.chatId}
          title={header.title}
          downloadConversationEnabled={header.downloadConversationEnabled}
        />
      </DialogHeaderCompactMenuContent>
      <DialogHeaderContent>
        <ChatHeaderBarContent
          userAndContext={header.userAndContext}
          chatId={header.chatId}
          title={header.title}
          downloadConversationEnabled={header.downloadConversationEnabled}
        />
      </DialogHeaderContent>
    </>
  );
}

export function DefaultPageLayoutClient({
  children,
  header,
}: {
  children: ReactNode;
  header?: DefaultPageLayoutHeaderConfig;
}) {
  return (
    <CustomChatHeaderContentProvider>
      <DefaultPageHeader header={header} />
      {children}
    </CustomChatHeaderContentProvider>
  );
}
