'use client';

import DestructiveActionButton from '@/components/common/destructive-action-button';
import { CustomGptModel } from '@/db/schema';
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import { useTranslations } from 'next-intl';
import TrashIcon from '@/components/icons/trash';
import { deleteCharacterAction } from '../characters/editor/[characterId]/actions';
import ShareIcon from '@/components/icons/share';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import SharedChatIcon from '@/components/icons/shared-chat';

type CustomGptContainerProps = CustomGptModel & {
  currentUserId: string;
  maybeSignedPictureUrl: string | undefined;
};

export default function CustomGptContainer({
  id,
  name,
  description,
  userId,
  currentUserId,
  maybeSignedPictureUrl,
  ...character
}: CustomGptContainerProps) {
  const router = useRouter();
  const toast = useToast();

  const t = useTranslations('custom-gpt');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('custom-gpt.toasts');

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
      <figure
        className="w-11 h-11 bg-light-gray rounded-enterprise-sm flex justify-center items-center"
        style={{ minWidth: '44px' }}
      >
        {maybeSignedPictureUrl !== undefined && (
          <Image
            src={maybeSignedPictureUrl}
            alt={`${name} Avatar`}
            width={44}
            height={44}
            className="rounded-enterprise-sm"
          />
        )}
        {maybeSignedPictureUrl === undefined && <EmptyImageIcon className="w-4 h-4" />}
      </figure>
      <div className="flex flex-col gap-1 text-left min-w-0">
        <h2 className={cn('font-medium leading-none', truncateClassName)}>{name}</h2>
        <span className={cn(truncateClassName, 'text-gray-400')}>{description}</span>
      </div>
      <div className="flex-grow" />
      {
        <button
          type="button"
          aria-label={tCommon('new-chat')}
          onClick={handleNavigateToNewUnsharedChat}
          className="text-vidis-hover-purple hover:bg-vidis-hover-green/20 rounded-enterprise-sm"
        >
          <SharedChatIcon aria-hidden="true" className="w-8 h-8" />
          <span className="sr-only">{tCommon('new-chat')}</span>
        </button>
      }
      {currentUserId === userId && (
        <DestructiveActionButton
          modalTitle={t('form.delete-gpt')}
          modalDescription={t('form.gpt-delete-modal-description')}
          confirmText={tCommon('delete')}
          actionFn={handleDeleteCharacter}
          aria-label={t('form.delete-gpt')}
          triggerButtonClassName="border-transparent justify-center flex flex-col rounded-enterprise-sm hover:bg-vidis-hover-green/20 p-0"
        >
          <TrashIcon aria-hidden="true" className="w-8 h-8 text-primary" />
          <span className="sr-only">{t('form.delete-gpt')}</span>
        </DestructiveActionButton>
      )}
    </Link>
  );
}
