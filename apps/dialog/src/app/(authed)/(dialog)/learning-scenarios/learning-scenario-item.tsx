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
import { iconClassName } from '@/utils/tailwind/icon';
import { LearningScenarioWithImage } from '@shared/learning-scenarios/learning-scenario-service';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import AvatarPicture from '@/components/common/avatar-picture';

type LearningScenarioItemProps = LearningScenarioWithImage;

export default function LearningScenarioItem({ ...learningScenario }: LearningScenarioItemProps) {
  const toast = useToast();
  const router = useRouter();
  const t = useTranslations('learning-scenarios');
  const tCommon = useTranslations('common');

  async function handleDeleteLearningScenario() {
    const result = await deleteLearningScenarioAction({ id: learningScenario.id });
    if (result.success) {
      toast.success(t('toasts.delete-toast-success'));
      router.refresh();
    } else {
      toast.error(t('toasts.delete-toast-error'));
    }
  }

  const timeLeft = calculateTimeLeft(learningScenario);

  return (
    <Link
      href={`/learning-scenarios/editor/${learningScenario.id}`}
      className="flex gap-2 items-center border rounded-enterprise-md p-4 hover:border-primary"
    >
      <figure
        className="w-11 h-11 bg-light-gray rounded-enterprise-sm flex justify-center items-center"
        style={{ minWidth: '44px' }}
      >
        {learningScenario.maybeSignedPictureUrl ? (
          <AvatarPicture
            src={learningScenario.maybeSignedPictureUrl}
            alt={`${learningScenario.name} Avatar`}
            variant="small"
          />
        ) : (
          <EmptyImageIcon className="w-4 h-4" />
        )}
      </figure>
      <div className="min-w-0">
        <h1 className={cn('font-medium text-primary', truncateClassName)}>
          {learningScenario.name}
        </h1>
        <h2 className={cn('text-gray-400', truncateClassName)}>{learningScenario.description}</h2>
      </div>
      <div className="flex-grow" />
      {learningScenario.startedAt !== null && timeLeft > 0 && (
        <CountDownTimer
          className="p-1 me-2"
          leftTime={timeLeft}
          totalTime={learningScenario.maxUsageTimeLimit ?? 0}
          stopWatchClassName="w-4 h-4"
        />
      )}
      {timeLeft > 0 && (
        <Link
          aria-label={t('shared.share')}
          href={`/learning-scenarios/editor/${learningScenario.id}/share`}
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
        actionFn={handleDeleteLearningScenario}
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
