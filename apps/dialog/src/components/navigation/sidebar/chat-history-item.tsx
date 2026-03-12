'use client';

import { HELP_MODE_GPT_ID } from '@shared/db/const';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@telli/ui/components/Sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components/DropdownMenu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cloneElement, type ReactElement, useState } from 'react';
import { ConversationModel } from '@shared/db/types';
import {
  CheckSquareIcon,
  DotsThreeIcon,
  ImageSquareIcon,
  LegoSmileyIcon,
  StudentIcon,
  TrashIcon,
  XSquareIcon,
} from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@ui/components/Input';
import { useTranslations } from 'next-intl';

const renameChatHistorySchema = z.object({
  name: z.string().min(1).max(256),
});

type RenameChatHistoryValues = z.infer<typeof renameChatHistorySchema>;

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
  const [isEditable, setIsEditable] = useState(false);
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const t = useTranslations('sidebar');
  const renameForm = useForm({
    resolver: zodResolver(renameChatHistorySchema),
    defaultValues: { name: conversation.name ?? '' },
  });
  const href = buildConversationUrl({ conversation });
  const icon = determineConversationIcon(conversation);

  const isActive = () => {
    // special case for help mode because it is also a custom gpt and starts with the same path
    if (pathname.startsWith(`/custom/d/${HELP_MODE_GPT_ID}`)) return pathname === href;

    return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  };

  async function onSubmit(data: RenameChatHistoryValues) {
    setIsEditable(false);
    onUpdateConversation(data.name);
  }

  async function onAbort() {
    setIsEditable(false);
  }

  function closeOnMobile() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  const iconWithStyle = icon
    ? cloneElement(icon, { weight: isActive() ? 'bold' : 'regular' })
    : undefined;

  return (
    <SidebarMenuItem>
      {isEditable && (
        <form className="w-full flex gap-1" onSubmit={renameForm.handleSubmit(onSubmit)}>
          <Input
            {...renameForm.register('name')}
            className="min-w-0 p-1 text-foreground border border-foreground rounded-md"
          />

          <button
            type="submit"
            aria-label={t('rename-save')}
            className="px-2 border border-foreground rounded-md"
          >
            <CheckSquareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onAbort}
            aria-label={t('rename-cancel')}
            className="px-2 border border-foreground rounded-md"
          >
            <XSquareIcon className="h-4 w-4" />
          </button>
        </form>
      )}

      {!isEditable && (
        <>
          <SidebarMenuButton
            asChild
            isActive={isActive()}
            variant="history"
            className="gap-1 text-sm text-ellipsis"
          >
            <Link href={href} onClick={closeOnMobile} prefetch={false}>
              {iconWithStyle}
              <span>{conversation.name}</span>
            </Link>
          </SidebarMenuButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction
                showOnHover={true}
                aria-label={t('conversation-actions')}
                data-testid="conversation-actions"
              >
                <DotsThreeIcon />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsEditable(true)}>
                <span>{t('rename-chat')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                data-testid="delete-conversation"
                onClick={() => onDeleteConversation(conversation.id)}
              >
                <TrashIcon />
                <span>{t('delete-chat')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
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

function determineConversationIcon(
  conversation: ConversationModel,
): ReactElement<{ weight?: 'regular' | 'bold' }> | undefined {
  switch (conversation.type) {
    case 'chat':
      if (conversation.characterId) {
        return <StudentIcon />;
      }
      if (conversation.customGptId) {
        return <LegoSmileyIcon />;
      }
      return undefined;
    case 'image-generation':
      return <ImageSquareIcon />;
    default:
      return undefined;
  }
}
