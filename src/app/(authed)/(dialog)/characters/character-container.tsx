'use client';

import DestructiveActionButton from '@/components/common/destructive-action-button';
import { CharacterModel } from '@/db/schema';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import Image from 'next/image';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import { deleteCharacterAction } from './editor/[characterId]/actions';
import { useTranslations } from 'next-intl';
import CountDownTimer from '../shared-chats/_components/count-down';
import ShareIcon from '@/components/icons/share';
import TrashIcon from '@/components/icons/trash';
import SharedChatIcon from '@/components/icons/shared-chat';
import { calculateTimeLeftBySharedChat } from '../shared-chats/[sharedSchoolChatId]/utils';

type CharacterContainerProps = CharacterModel & {
  currentUserId: string;
  maybeSignedPictureUrl: string | undefined;
};

export default function CharacterContainer({
  id,
  name,
  description,
  userId,
  currentUserId,
  maybeSignedPictureUrl,
  ...character
}: CharacterContainerProps) {
  const router = useRouter();
  const toast = useToast();

  const tToast = useTranslations('characters.toasts');

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
    router.push(`/characters/d/${id}`);
  }

  function handleNavigateToShare(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/characters/editor/${id}/share`);
  }

  const t = useTranslations('characters.form');
  const tCommon = useTranslations('common');

  const timeLeft = calculateTimeLeftBySharedChat(character);

  return (
    <Link
      href={`/characters/editor/${id}`}
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
      {timeLeft > 0 && character.maxUsageTimeLimit !== null && (
        <CountDownTimer leftTime={timeLeft} totalTime={character.maxUsageTimeLimit} />
      )}
      {timeLeft > 0 && (
        <button
          onClick={handleNavigateToShare}
          className="text-vidis-hover-purple hover:bg-vidis-hover-green/20 rounded-enterprise-sm"
        >
          <ShareIcon className="w-8 h-8" />
        </button>
      )}
      {timeLeft < 1 && (
        <button
          type="button"
          onClick={handleNavigateToNewUnsharedChat}
          className="text-vidis-hover-purple hover:bg-vidis-hover-green/20 rounded-enterprise-sm"
        >
          <SharedChatIcon className="w-8 h-8" />
        </button>
      )}
      {currentUserId === userId && (
        <DestructiveActionButton
          modalTitle={t('delete-character')}
          modalDescription={t('character-delete-modal-description')}
          confirmText={tCommon('delete')}
          actionFn={handleDeleteCharacter}
          triggerButtonClassName="border-transparent justify-center flex flex-col rounded-enterprise-sm hover:bg-vidis-hover-green/20 p-0"
        >
          <TrashIcon className="w-8 h-8 text-primary" />
        </DestructiveActionButton>
      )}
    </Link>
  );
}
