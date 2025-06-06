'use client';

import DestructiveActionButton from '@/components/common/destructive-action-button';
import { useToast } from '@/components/common/toast';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import SharedChatIcon from '@/components/icons/shared-chat';
import TrashIcon from '@/components/icons/trash';
import { CustomGptModel } from '@/db/schema';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { deleteCustomGptAction } from './editor/[customgptId]/actions';
import { createNewCustomGptAction } from './actions';
import ClipboardIcon from '@/components/icons/clipboard';
import { CreateNewCharacterFromTemplate } from '../characters/create-new-character-button';
import { iconClassName } from '@/utils/tailwind/icon';
import TelliClipboardButton from '@/components/common/clipboard-button';

type CustomGptContainerProps = CustomGptModel & {
  currentUserId: string;
  maybeSignedPictureUrl: string | undefined;
  accessLevel: 'global' | 'school' | 'private';
  pictureId: string | null;
};

export default function CustomGptContainer({
  id,
  name,
  description,
  userId,
  currentUserId,
  maybeSignedPictureUrl,
  accessLevel,
  pictureId,
}: CustomGptContainerProps) {
  const router = useRouter();
  const toast = useToast();

  const t = useTranslations('custom-gpt');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('custom-gpt.toasts');

  function handleDeleteCustomGpt() {
    deleteCustomGptAction({ gptId: id })
      .then(() => {
        toast.success(tToast('delete-toast-success'));
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('delete-toast-error'));
      });
  }

  function handleNavigateToNewChat(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/custom/d/${id}`);
  }
  const queryParams = new URLSearchParams({
    create: 'false',
  });
  return (
    <Link
      href={`/custom/editor/${id}?${queryParams.toString()}`}
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
      {accessLevel === 'global' && (
        <CreateNewCharacterFromTemplate
          redirectPath="custom"
          createInstanceCallback={createNewCustomGptAction}
          templateId={id}
          templatePictureId={pictureId ?? undefined}
          className="w-8 h-8"
          {...{ title: t('form.copy-page.copy-template'), type: 'button' }}
        >
          <button aria-label="copy-template" className={cn(iconClassName, 'w-8 h-8')}>
            <TelliClipboardButton
              text={t('form.copy-page.copy-template')}
              className="w-6 h-6"
              outerDivClassName="p-0 rounded-enterprise-sm"
            />
          </button>
        </CreateNewCharacterFromTemplate>
      )}
      {
        <button
          type="button"
          aria-label={tCommon('new-chat')}
          onClick={handleNavigateToNewChat}
          className={cn(iconClassName, 'border-transparent p-0')}
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
          actionFn={handleDeleteCustomGpt}
          aria-label={t('form.delete-gpt')}
          triggerButtonClassName={cn('border-transparent p-0', iconClassName)}
        >
          <TrashIcon aria-hidden="true" className="w-8 h-8" />
          <span className="sr-only">{t('form.delete-gpt')}</span>
        </DestructiveActionButton>
      )}
    </Link>
  );
}
