'use client';

import DestructiveActionButton from '@/components/common/destructive-action-button';
import { CharacterWithShareDataModel } from '@shared/db/schema';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import { deleteCharacterAction } from './editor/[characterId]/actions';
import { useTranslations } from 'next-intl';
import CountDownTimer from '../learning-scenarios/_components/count-down';
import ShareIcon from '@/components/icons/share';
import TrashIcon from '@/components/icons/trash';
import SharedChatIcon from '@/components/icons/shared-chat';
import { iconClassName } from '@/utils/tailwind/icon';
import TelliClipboardButton from '@/components/common/clipboard-button';
import { createNewCharacterAction } from './actions';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import AvatarPicture from '@/components/common/avatar-picture';
import { CreateNewInstanceFromTemplate } from '../_components/create-new-instance-from-template';

type CharacterContainerProps = CharacterWithShareDataModel & {
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

  const t = useTranslations('characters');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('characters.toasts');

  async function handleDeleteCharacter() {
    const result = await deleteCharacterAction({ characterId: id });
    if (result.success) {
      toast.success(tToast('delete-toast-success'));
      router.refresh();
    } else {
      toast.error(tToast('delete-toast-error'));
    }
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

  const timeLeft = calculateTimeLeft(character);

  return (
    <Link
      href={`/characters/editor/${id}`}
      className="rounded-enterprise-md border p-6 flex items-center gap-4 w-full hover:border-primary"
    >
      <figure
        className="w-11 h-11 bg-light-gray rounded-enterprise-sm flex justify-center items-center"
        style={{ minWidth: '44px' }}
      >
        {maybeSignedPictureUrl ? (
          <AvatarPicture src={maybeSignedPictureUrl} alt={`${name} Avatar`} variant="small" />
        ) : (
          <EmptyImageIcon className="w-4 h-4" />
        )}
      </figure>
      <div className="flex flex-col gap-0 text-left min-w-0">
        <h2 className={cn('font-medium leading-none min-h-5', truncateClassName)}>{name}</h2>
        <span className={cn(truncateClassName, 'text-gray-600')}>{description}</span>
      </div>
      <div className="grow" />
      {timeLeft > 0 && character.maxUsageTimeLimit !== null && (
        <CountDownTimer
          leftTime={timeLeft}
          totalTime={character.maxUsageTimeLimit}
          className="p-1 me-2"
          stopWatchClassName="w-4 h-4"
        />
      )}
      {userId !== currentUserId && timeLeft <= 0 && (
        <CreateNewInstanceFromTemplate
          templateId={id}
          templatePictureId={character.pictureId ?? undefined}
          className={'w-8 h-8'}
          redirectPath="characters"
          createInstanceCallbackAction={createNewCharacterAction}
          {...{ title: t('form.copy-page.copy-template'), type: 'button' }}
        >
          <TelliClipboardButton
            text={t('form.copy-page.copy-template')}
            className="w-6 h-6"
            outerDivClassName="p-1 rounded-enterprise-sm"
          />
        </CreateNewInstanceFromTemplate>
      )}

      {timeLeft > 0 && (
        <button
          aria-label={t('shared.share')}
          onClick={handleNavigateToShare}
          className={cn(iconClassName)}
        >
          <ShareIcon aria-hidden="true" className="min-w-8 min-h-8" />
          <span className="sr-only">{t('shared.share')}</span>
        </button>
      )}
      {timeLeft < 1 && (
        <button
          type="button"
          aria-label={tCommon('new-chat')}
          onClick={handleNavigateToNewUnsharedChat}
          className={cn(iconClassName, 'min-w-8 min-h-8')}
        >
          <SharedChatIcon aria-hidden="true" className="min-w-8 min-h-8" />
          <span className="sr-only">{tCommon('new-chat')}</span>
        </button>
      )}

      {currentUserId === userId && character.accessLevel !== 'global' && (
        <DestructiveActionButton
          modalTitle={t('form.delete-character')}
          modalDescription={t('form.character-delete-modal-description')}
          confirmText={tCommon('delete')}
          actionFn={handleDeleteCharacter}
          aria-label={t('form.delete-character')}
          triggerButtonClassName={cn('border-transparent p-0', iconClassName)}
        >
          <TrashIcon aria-hidden="true" className="min-w-8 min-h-8" />
          <span className="sr-only">{t('form.delete-character')}</span>
        </DestructiveActionButton>
      )}
    </Link>
  );
}
