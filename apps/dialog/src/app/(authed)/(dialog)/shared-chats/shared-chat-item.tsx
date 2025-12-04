'use client';

import DestructiveActionButton from '@/components/common/destructive-action-button';
import { useToast } from '@/components/common/toast';
import ShareIcon from '@/components/icons/share';
import TrashIcon from '@/components/icons/trash';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteLearningScenarioAction } from './actions';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import CountDownTimer from './_components/count-down';
import { useTranslations } from 'next-intl';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import Image from 'next/image';
import { iconClassName } from '@/utils/tailwind/icon';
import {
  calculateTimeLeftForLearningScenario,
  LearningScenarioWithImage,
} from '@shared/learning-scenarios/learning-scenario-service';

type SharedChatItemProps = LearningScenarioWithImage;

export default function SharedChatItem({ ...sharedSchoolChat }: SharedChatItemProps) {
  const toast = useToast();
  const router = useRouter();
  const t = useTranslations('shared-chats');
  const tCommon = useTranslations('common');

  async function handleDeleteSharedChat() {
    const result = await deleteLearningScenarioAction({ id: sharedSchoolChat.id });
    if (result.success) {
      toast.success(t('toasts.delete-toast-success'));
      router.refresh();
    } else {
      toast.error(t('toasts.delete-toast-error'));
    }
  }

  const timeLeft = calculateTimeLeftForLearningScenario(sharedSchoolChat);

  return (
    <Link
      href={`/shared-chats/${sharedSchoolChat.id}`}
      className="flex gap-2 items-center border rounded-enterprise-md p-4 hover:border-primary"
    >
      <figure
        className="w-11 h-11 bg-light-gray rounded-enterprise-sm flex justify-center items-center"
        style={{ minWidth: '44px' }}
      >
        {sharedSchoolChat.maybeSignedPictureUrl !== undefined && (
          <Image
            src={sharedSchoolChat.maybeSignedPictureUrl}
            alt={`${sharedSchoolChat.name} Avatar`}
            width={44}
            height={44}
            className="rounded-enterprise-sm"
          />
        )}
        {sharedSchoolChat.maybeSignedPictureUrl === undefined && (
          <EmptyImageIcon className="w-4 h-4" />
        )}
      </figure>
      <div className="min-w-0">
        <h1 className={cn('font-medium text-primary', truncateClassName)}>
          {sharedSchoolChat.name}
        </h1>
        <h2 className={cn('text-gray-400', truncateClassName)}>{sharedSchoolChat.description}</h2>
      </div>
      <div className="flex-grow" />
      {sharedSchoolChat.startedAt !== null && timeLeft > 0 && (
        <CountDownTimer
          className="p-1 me-2"
          leftTime={timeLeft}
          totalTime={sharedSchoolChat.maxUsageTimeLimit ?? 0}
          stopWatchClassName="w-4 h-4"
        />
      )}
      {timeLeft > 0 && (
        <Link
          aria-label={t('shared.share')}
          href={`/shared-chats/${sharedSchoolChat.id}/share`}
          className={cn('rounded-enterprise-sm', iconClassName)}
        >
          <ShareIcon aria-hidden="true" className="w-8 h-8" />
          <span className="sr-only">{t('shared.share')}</span>
        </Link>
      )}
      <DestructiveActionButton
        aria-label={tCommon('delete')}
        modalDescription={t('form.delete-description')}
        modalTitle={t('form.delete-title')}
        confirmText={tCommon('delete')}
        actionFn={handleDeleteSharedChat}
        triggerButtonClassName={cn(
          'border-transparent justify-center flex flex-col rounded-enterprise-sm p-0',
          iconClassName,
        )}
      >
        <TrashIcon aria-hidden="true" className="w-8 h-8" />
        <span className="sr-only">{tCommon('delete')}</span>
      </DestructiveActionButton>
    </Link>
  );
}
