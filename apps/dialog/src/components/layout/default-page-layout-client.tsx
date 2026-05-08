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
import type { DefaultPageLayoutConfig } from '@/components/layout/default-page-layout';
import { ReactNode } from 'react';

function FormPageHeader() {
  const { formStateProps } = useCustomChatHeaderContent();

  return (
    <DialogHeaderContent>
      <CustomChatHeader
        showFormState={Boolean(formStateProps)}
        formStateProps={formStateProps ?? undefined}
      />
    </DialogHeaderContent>
  );
}

function DefaultPageHeader({ header }: { header?: DefaultPageLayoutConfig }) {
  if (!header) {
    return null;
  }

  switch (header.layout) {
    case 'default':
      return null;
    case 'form':
      return <FormPageHeader />;
    case 'image':
      return (
        <DialogHeaderContent>
          <div className="flex w-full gap-4">
            <SelectImageModel />
            <SelectImageStyle />
          </div>
        </DialogHeaderContent>
      );
    case 'chat':
      return (
        <>
          <DialogHeaderCompactMenuContent>
            <ChatHeaderBarCompactMenuContent
              chatId={header.headerConfig.chatId}
              title={header.headerConfig.title}
              downloadConversationEnabled={header.headerConfig.downloadConversationEnabled}
            />
          </DialogHeaderCompactMenuContent>
          <DialogHeaderContent>
            <ChatHeaderBarContent
              userAndContext={header.headerConfig.userAndContext}
              chatId={header.headerConfig.chatId}
              title={header.headerConfig.title}
              downloadConversationEnabled={header.headerConfig.downloadConversationEnabled}
            />
          </DialogHeaderContent>
        </>
      );
  }
}

export function DefaultPageLayoutSelector({
  children,
  layoutType,
}: {
  children: ReactNode;
  layoutType?: DefaultPageLayoutConfig;
}) {
  return (
    // Hooks can not be called unconditionally, so we need to always render the chat header provider,
    // even if the header is not a chat header. The context value will just be undefined in that case and
    // the components that consume the context are only rendered for chat headers.
    <CustomChatHeaderContentProvider>
      <DefaultPageHeader header={layoutType} />
      <div
        className={`data-page-layout h-full max-w-5xl mx-auto px-6 ${layoutType?.layout === 'chat' ? 'pb-4' : 'pb-8'}`}
      >
        {children}
      </div>
    </CustomChatHeaderContentProvider>
  );
}
