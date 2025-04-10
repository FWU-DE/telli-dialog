'use client';

import DestructiveActionButton from '@/components/common/destructive-action-button';
import { CustomGptModel } from '@/db/schema';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import Image from 'next/image';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import { useTranslations } from 'next-intl';
import CountDownTimer from '../shared-chats/_components/count-down';
import ShareIcon from '@/components/icons/share';
import TrashIcon from '@/components/icons/trash';
import SharedChatIcon from '@/components/icons/shared-chat';
import { calculateTimeLeftBySharedChat } from '../shared-chats/[sharedSchoolChatId]/utils';
import { deleteCharacterAction } from '../characters/editor/[characterId]/actions';

type CustomGptContainerProps = CustomGptModel & {
  currentUserId: string;
};

export default function CustomGptContainer({
  id,
  name,
  description,
  userId,
  currentUserId,
  ...character
}: CustomGptContainerProps) {
  const router = useRouter();
  const toast = useToast();

  const t = useTranslations('custom-gpt');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('customgpt.toasts');

  function handleDeleteCharacter() {
    deleteCharacterAction({ characterId: id })
      .then(() => {
        toast.success(tToast('delete-toast-success'));
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('delete-toast-error'));
      });
  }

  function handleNavigateToNewUnsharedChat(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/custom/d/${id}`);
  }

  function handleNavigateToShare(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/custom/editor/${id}/share`);
  }

  // const timeLeft = calculateTimeLeftBySharedChat(character);

  return (
    <Link
      href={`/custom/editor/${id}`}
      className="rounded-enterprise-md border p-6 flex items-center gap-4 w-full hover:border-primary"
    >
      <div className="flex flex-col gap-1 text-left min-w-0">
        <h2 className={cn('font-medium leading-none', truncateClassName)}>{name}</h2>
        <span className={cn(truncateClassName, 'text-gray-400')}>{description}</span>
      </div>
      {currentUserId === userId && (
        <DestructiveActionButton
          modalTitle={t('form.delete-character')}
          modalDescription={t('form.character-delete-modal-description')}
          confirmText={tCommon('delete')}
          actionFn={handleDeleteCharacter}
          aria-label={t('form.delete-character')}
          triggerButtonClassName="border-transparent justify-center flex flex-col rounded-enterprise-sm hover:bg-vidis-hover-green/20 p-0"
        >
          <TrashIcon aria-hidden="true" className="w-8 h-8 text-primary" />
          <span className="sr-only">{t('form.delete-character')}</span>
        </DestructiveActionButton>
      )}
    </Link>
  );
}
