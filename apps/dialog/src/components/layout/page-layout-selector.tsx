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
        showFormState={formStateProps !== undefined}
        formStateProps={formStateProps ?? undefined}
      />
    </DialogHeaderContent>
  );
}

function ImagePageHeader() {
  return (
    <DialogHeaderContent>
      <div className="flex w-full gap-4">
        <SelectImageModel />
        <SelectImageStyle />
      </div>
    </DialogHeaderContent>
  );
}

function ChatPageHeader({
  layoutConfig,
}: {
  layoutConfig: Extract<DefaultPageLayoutConfig, { layout: 'chat' }>;
}) {
  return (
    <>
      <DialogHeaderCompactMenuContent>
        <ChatHeaderBarCompactMenuContent
          chatId={layoutConfig.headerConfig.chatId}
          title={layoutConfig.headerConfig.title}
          downloadConversationEnabled={layoutConfig.headerConfig.downloadConversationEnabled}
        />
      </DialogHeaderCompactMenuContent>
      <DialogHeaderContent>
        <ChatHeaderBarContent
          userAndContext={layoutConfig.headerConfig.userAndContext}
          chatId={layoutConfig.headerConfig.chatId}
          title={layoutConfig.headerConfig.title}
          downloadConversationEnabled={layoutConfig.headerConfig.downloadConversationEnabled}
        />
      </DialogHeaderContent>
    </>
  );
}

function DefaultPageHeader({ layoutConfig }: { layoutConfig: DefaultPageLayoutConfig }) {
  if (!layoutConfig) {
    return null;
  }

  switch (layoutConfig.layout) {
    case 'form':
      return <FormPageHeader />;
    case 'image':
      return <ImagePageHeader />;
    case 'chat':
      return <ChatPageHeader layoutConfig={layoutConfig} />;
  }
}

export function PageLayoutSelector({
  children,
  layoutType,
}: {
  children: ReactNode;
  layoutType?: DefaultPageLayoutConfig;
}) {
  return (
    // Always render the chat header provider so any descendant that calls
    // `useCustomChatHeaderContent()` is guaranteed to have a provider in the tree,
    // regardless of which header layout branch is currently rendered.
    <CustomChatHeaderContentProvider>
      {layoutType && <DefaultPageHeader layoutConfig={layoutType} />}
      <div
        className={`data-page-layout h-full max-w-5xl mx-auto px-6 ${layoutType?.layout === 'chat' ? 'pb-4' : 'pb-8'}`}
      >
        {children}
      </div>
    </CustomChatHeaderContentProvider>
  );
}
