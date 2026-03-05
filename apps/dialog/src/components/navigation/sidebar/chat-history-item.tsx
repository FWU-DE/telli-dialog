'use client';

import { HELP_MODE_GPT_ID } from '@shared/db/const';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@telli/ui/components/Sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useSidebarVisibility } from './sidebar-provider';
import { useSidebar } from '@telli/ui/components/Sidebar';
import { ConversationModel } from '@shared/db/types';
import { DotsThreeIcon, ImageSquareIcon, LegoSmileyIcon, StudentIcon } from '@phosphor-icons/react';

type ChatHistoryItemProps = {
  conversation: ConversationModel;
  onUpdateConversation(name: string): void;
  onDeleteConversation(conversationId: string): void;
};

export function ChatHistoryItem({
  conversation,
  onUpdateConversation,
  onDeleteConversation,
}: ChatHistoryItemProps) {
  const pathname = usePathname();
  const { close } = useSidebarVisibility();
  const { isMobile } = useSidebar();

  const href = buildConversationUrl({ conversation });
  const icon = determineConversationIcon(conversation);

  const isActive = () => {
    // special case for help mode because it is also a custom gpt and starts with the same path
    if (pathname.startsWith(`/custom/d/${HELP_MODE_GPT_ID}`)) return pathname === href;

    return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive()} className="gap-1 text-sm text-ellipsis">
        <Link
          href={href}
          onClick={() => {
            if (isMobile) {
              close();
            }
          }}
          prefetch={false}
        >
          {icon}
          <span>{conversation.name}</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuAction showOnHover={true}>
        <DotsThreeIcon />
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}

function buildConversationUrl({ conversation }: { conversation: ConversationModel }) {
  if (conversation.characterId !== null) {
    return `/characters/d/${conversation.characterId}/${conversation.id}`;
  }

  if (conversation.customGptId !== null) {
    return `/custom/d/${conversation.customGptId}/${conversation.id}`;
  }

  if (conversation.type === 'image-generation') {
    return `/image-generation/d/${conversation.id}`;
  }

  return `/d/${conversation.id}`;
}

function determineConversationIcon(conversation: ConversationModel): ReactNode {
  switch (conversation.type) {
    case 'chat':
      if (conversation.characterId) {
        return <LegoSmileyIcon />;
      }
      if (conversation.customGptId) {
        return <StudentIcon />;
      }
      return <></>;
    case 'image-generation':
      return <ImageSquareIcon />;
    default:
      return <></>;
  }
}
