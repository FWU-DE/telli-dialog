'use client';

import DestructiveActionButton from '@/components/common/destructive-action-button';
import { useToast } from '@/components/common/toast';
import { SharedSchoolConversationModel } from '@/db/schema';
import ShareIcon from '@/components/icons/share';
import TrashIcon from '@/components/icons/trash';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteSharedChatAction } from './actions';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import { calculateTimeLeftBySharedChat } from './[sharedSchoolChatId]/utils';
import CountDownTimer from './_components/count-down';
import { useTranslations } from 'next-intl';

type SharedChatItemProps = SharedSchoolConversationModel;

export default function SharedChatItem({ ...sharedSchoolChat }: SharedChatItemProps) {
  const toast = useToast();
  const router = useRouter();
  const t = useTranslations('shared-chats');
  const tCommon = useTranslations('common');

  function handleDeleteSharedChat() {
    deleteSharedChatAction({ id: sharedSchoolChat.id })
      .then(() => {
        toast.success(t('toasts.delete-toast-success'));
        router.refresh();
      })
      .catch(() => {
        toast.error(t('toasts.delete-toast-error'));
      });
  }

  const timeLeft = calculateTimeLeftBySharedChat(sharedSchoolChat);

  return (
    <Link
      href={`/shared-chats/${sharedSchoolChat.id}`}
      className="flex gap-2 items-center border rounded-enterprise-md p-4 hover:border-primary"
    >
      <div className="min-w-0">
        <h3 className={cn('font-medium text-primary', truncateClassName)}>
          {sharedSchoolChat.name}
        </h3>
        <span className={cn('text-gray-100', truncateClassName)}>
          {sharedSchoolChat.description}
        </span>
      </div>
      <div className="flex-grow" />
      {sharedSchoolChat.startedAt !== null && timeLeft > 0 && (
        <CountDownTimer
          className="p-1 me-2"
          leftTime={timeLeft}
          totalTime={sharedSchoolChat.maxUsageTimeLimit ?? 0}
        />
      )}
      {timeLeft > 0 && (
        <Link
          href={`/shared-chats/${sharedSchoolChat.id}/share`}
          className="text-vidis-hover-purple hover:bg-vidis-hover-green/20 rounded-enterprise-sm"
        >
          <ShareIcon className="w-8 h-8" />
        </Link>
      )}
      <DestructiveActionButton
        modalDescription={t('form.delete-modal-description')}
        modalTitle={t('form.delete-title')}
        confirmText={tCommon('delete')}
        actionFn={handleDeleteSharedChat}
        triggerButtonClassName="border-transparent justify-center flex flex-col rounded-enterprise-sm hover:bg-vidis-hover-green/20 p-0"
      >
        <TrashIcon className="w-8 h-8 text-primary" />
      </DestructiveActionButton>
    </Link>
  );
}
