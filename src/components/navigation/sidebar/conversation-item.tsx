'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import DotsHorizontalIcon from '@/components/icons/dots-horizontal';
import CheckIcon from '@/components/icons/check';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSidebarVisibility } from './sidebar-provider';
import useBreakpoints from '@/components/hooks/use-breakpoints';
import { cn } from '@/utils/tailwind';
import { usePathname } from 'next/navigation';
import { type ConversationModel } from '@/db/types';
import Link from 'next/link';

const renameSchema = z.object({
  name: z.string().min(1),
});

type RenameData = z.infer<typeof renameSchema>;

export default function ConversationItem({
  conversation,
  isPrivateMode,
  onDeleteConversation,
  onUpdateConversation,
}: {
  conversation: ConversationModel;
  active?: boolean;
  isPrivateMode?: boolean;
  onUpdateConversation(name: string): void;
  onDeleteConversation(conversationId: string): void;
}) {
  const renameForm = useForm<RenameData>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: conversation.name ?? '' },
  });
  const [isEditable, toggleEditable] = React.useReducer((s) => !s, false);
  const router = useRouter();
  const pathname = usePathname();
  const { isBelow } = useBreakpoints();
  const { toggle } = useSidebarVisibility();

  async function onSubmit(data: RenameData) {
    toggleEditable();
    onUpdateConversation(data.name);
    router.refresh();
  }

  const isSelected = pathname.includes(buildConversationUrl({ conversation }));

  const itemClasses = cn('text-main-900 hover:underline group', isSelected && 'underline');

  return (
    <div
      className={cn(
        'relative w-full group flex gap-4 items-center',
        isEditable ? 'p-0' : 'px-2 py-1.5',
        itemClasses,
      )}
    >
      {isEditable ? (
        <form className="flex w-full" onSubmit={renameForm.handleSubmit(onSubmit)}>
          <input
            className="py-2 truncate border text-primary border-black rounded-enterprise-md px-4 min-w-0"
            {...renameForm.register('name')}
          />
          <button className={cn('px-3 border border-black rounded-enterprise-md ml-2')}>
            <CheckIcon className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <Link
          title={conversation.name ?? undefined}
          className={cn('overflow-hidden flex-grow', 'text-primary')}
          href={buildConversationUrl({ conversation })}
          onClick={() => {
            if (!isPrivateMode && isBelow.md) {
              toggle();
            }
          }}
        >
          <p className="w-full rounded-lg text-left truncate text-base">
            {conversation.name ?? 'Neuer Chat'}
          </p>
        </Link>
      )}
      {/* TODO: Refactor this into a separate component */}
      {!isPrivateMode && (
        <div className={cn('md:invisible group-hover:visible group-focus-within:visible')}>
          <DropdownMenu.Root>
            {!isEditable && (
              <DropdownMenu.Trigger aria-label="Edit" asChild className="cursor-pointer">
                <DotsHorizontalIcon aria-hidden="true" className="h-5 w-5 sm:h-4 sm:w-4" />
              </DropdownMenu.Trigger>
            )}
            <DropdownMenu.Content
              sideOffset={5}
              className={cn(
                'z-20 flex flex-col w-[256px] bg-white shadow-dropdown rounded-enterprise-md',
              )}
            >
              <DropdownMenu.Item asChild>
                <button
                  onClick={() => onDeleteConversation(conversation.id)}
                  type="button"
                  className="text-main-red text-left px-4 py-3 font-normal text-sm bg-white hover:bg-main-300 active:bg-main-200 rounded-t"
                >
                  Löschen
                </button>
              </DropdownMenu.Item>
              <hr />
              <DropdownMenu.Item asChild>
                <button
                  onClick={toggleEditable}
                  type="button"
                  className="text-left text-main-black px-4 py-3 font-normal text-sm bg-white hover:bg-main-300 active:bg-main-200 rounded-b"
                >
                  Umbenennen
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      )}
    </div>
  );
}

function buildConversationUrl({ conversation }: { conversation: ConversationModel }) {
  if (conversation.characterId !== null) {
    return `/characters/d/${conversation.characterId}/${conversation.id}`;
  }
  return `/d/${conversation.id}`;
}
