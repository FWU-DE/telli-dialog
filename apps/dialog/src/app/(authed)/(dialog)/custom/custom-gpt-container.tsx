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
import { iconClassName } from '@/utils/tailwind/icon';

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
        <div onClick={(event) => event.stopPropagation()}>
          <Link
            type="button"
            aria-label={tCommon('new-chat')}
            href={`/custom/editor/${id}?${queryParams.toString()}`}
            className={cn(iconClassName, 'border-transparent p-1')}
          >
            <SharedChatIcon aria-hidden="true" className="w-6 h-6" />
            <span className="sr-only">{tCommon('new-chat')}</span>
          </Link>
        </div>
      }
      {currentUserId === userId && (
        <div onClick={(event) => event.stopPropagation()}>
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
