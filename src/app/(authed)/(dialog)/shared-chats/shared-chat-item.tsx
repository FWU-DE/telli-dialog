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

type SharedChatItemProps = SharedSchoolConversationModel;

export default function SharedChatItem({ ...sharedSchoolChat }: SharedChatItemProps) {
  const toast = useToast();
  const router = useRouter();

  function handleDeleteSharedChat() {
    deleteSharedChatAction({ id: sharedSchoolChat.id })
      .then(() => {
        toast.success('Der Klassendialog wurde erfolgreich gelöscht.');
        router.refresh();
      })
      .catch(() => {
        toast.error('Der Klassendialog konnte nicht gelöscht werden.');
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
          className="p-1.5 rounded-enterprise-sm text-primary hover:bg-vidis-hover-green/20"
        >
          <ShareIcon className="w-4 h-4" />
        </Link>
      )}
      <DestructiveActionButton
        modalDescription="Bist du sicher, dass du diesen Klassendialog löschen möchtest? Dabei werden alle mit diesem Dialog verbundenen Konversationen unwiderruflich gelöscht."
        modalTitle="Klassendialog löschen"
        confirmText="Löschen"
        actionFn={handleDeleteSharedChat}
        triggerButtonClassName="border-transparent justify-center flex flex-col rounded-enterprise-sm hover:bg-vidis-hover-green/20 p-0"
      >
        <TrashIcon className="w-8 h-8 text-primary" />
      </DestructiveActionButton>
    </Link>
  );
}
