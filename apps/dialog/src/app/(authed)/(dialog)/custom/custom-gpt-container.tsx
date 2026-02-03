'use client';

import DestructiveActionButton from '@/components/common/destructive-action-button';
import { useToast } from '@/components/common/toast';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import SettingsIcon from '@/components/icons/settings';
import TrashIcon from '@/components/icons/trash';
import { AccessLevel, CustomGptSelectModel } from '@shared/db/schema';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { deleteCustomGptAction } from './editor/[customGptId]/actions';
import { iconClassName } from '@/utils/tailwind/icon';
import { CreateNewCharacterFromTemplate } from '../characters/create-new-character-from-template';
import TelliClipboardButton from '@/components/common/clipboard-button';
import { createNewCustomGptAction } from './actions';
import AvatarPicture from '@/components/common/avatar-picture';

type CustomGptContainerProps = CustomGptSelectModel & {
  currentUserId: string;
  maybeSignedPictureUrl: string | undefined;
  accessLevel: AccessLevel;
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

  function handleNavigateToNewChat(e: React.MouseEvent) {
    e.preventDefault();
    router.push(`/custom/d/${id}`);
  }
  const queryParams = new URLSearchParams({
    create: 'false',
  });
  return (
    <div
      onClick={handleNavigateToNewChat}
      className="rounded-enterprise-md border p-6 flex items-center gap-4 w-full hover:border-primary cursor-pointer"
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
      <div className="flex flex-col gap-1 text-left min-w-0">
        <h2 className={cn('font-medium leading-none', truncateClassName)}>{name}</h2>
        <span className={cn(truncateClassName, 'text-gray-400')}>{description}</span>
      </div>
      <div className="flex-grow" />
      {accessLevel === 'global' && (
        <div onClick={(event) => event.stopPropagation()} className="flex items-center">
          <CreateNewCharacterFromTemplate
            redirectPath="custom"
            createInstanceCallback={createNewCustomGptAction}
            templateId={id}
            templatePictureId={pictureId ?? undefined}
            className="w-8 h-8 flex items-center justify-center"
            {...{ title: t('form.copy-page.copy-template'), type: 'button' }}
          >
            <TelliClipboardButton
              text={t('form.copy-page.copy-template')}
              className="w-6 h-6"
              outerDivClassName="p-1 rounded-enterprise-sm"
            />
          </CreateNewCharacterFromTemplate>
        </div>
      )}
      {
        <div onClick={(event) => event.stopPropagation()} className="flex items-center">
          <Link
            type="button"
            aria-label={tCommon('edit')}
            href={`/custom/editor/${id}?${queryParams.toString()}`}
            className={cn(iconClassName, 'border-transparent p-1')}
          >
            <SettingsIcon aria-hidden="true" className="w-6 h-6" />
            <span className="sr-only">{tCommon('edit')}</span>
          </Link>
        </div>
      }
      {currentUserId === userId && (
        <div onClick={(event) => event.stopPropagation()} className="flex items-center">
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
        </div>
      )}
    </div>
  );
}
