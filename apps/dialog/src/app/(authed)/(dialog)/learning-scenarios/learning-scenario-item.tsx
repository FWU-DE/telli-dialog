'use client';

import DestructiveActionButton from '@/components/common/destructive-action-button';
import { useToast } from '@/components/common/toast';
import ShareIcon from '@/components/icons/share';
import TrashIcon from '@/components/icons/trash';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createNewLearningScenarioFromTemplateAction,
  deleteLearningScenarioAction,
} from './actions';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import CountDownTimer from './_components/count-down';
import { useTranslations } from 'next-intl';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import { iconClassName } from '@/utils/tailwind/icon';
import { LearningScenarioWithImage } from '@shared/learning-scenarios/learning-scenario-service';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import AvatarPicture from '@/components/common/avatar-picture';
import TelliClipboardButton from '@/components/common/clipboard-button';
import { InvalidArgumentError } from '@shared/error';
import { CreateNewInstanceFromTemplate } from '../_components/create-new-instance-from-template';

type LearningScenarioItemProps = LearningScenarioWithImage & { currentUserId: string };

export default function LearningScenarioItem({
  currentUserId,
  ...learningScenario
}: LearningScenarioItemProps) {
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

  async function handleCreateNewLearningScenarioFromTemplate({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    templatePictureId,
    templateId,
  }: {
    templatePictureId?: string;
    templateId?: string;
  }) {
    if (!templateId) {
      return {
        success: false as const,
        error: new InvalidArgumentError('Template ID is required'),
      };
    }
    return createNewLearningScenarioFromTemplateAction(templateId);
  }

  const timeLeft = calculateTimeLeft(learningScenario);

  return (
    <Link
      href={`/learning-scenarios/editor/${learningScenario.id}`}
      className="rounded-enterprise-md border p-6 flex items-center gap-4 w-full hover:border-primary"
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
      <div className="flex flex-col gap-1 text-left min-w-0">
        <h2 className={cn('font-medium leading-none', truncateClassName)}>
          {learningScenario.name}
        </h2>
        <span className={cn('text-gray-400', truncateClassName)}>
          {learningScenario.description}
        </span>
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
      {learningScenario.accessLevel === 'global' && (
        <div onClick={(event) => event.stopPropagation()} className="flex items-center">
          <CreateNewInstanceFromTemplate
            redirectPath="learning-scenarios"
            createInstanceCallback={handleCreateNewLearningScenarioFromTemplate}
            templateId={learningScenario.id}
            templatePictureId={learningScenario.pictureId ?? undefined}
            className="w-8 h-8 flex items-center justify-center"
            {...{ title: t('form.copy-page.copy-template'), type: 'button' }}
          >
            <TelliClipboardButton
              text={t('form.copy-page.copy-template')}
              className="w-6 h-6"
              outerDivClassName="p-1 rounded-enterprise-sm"
            />
          </CreateNewInstanceFromTemplate>
        </div>
      )}
      {currentUserId === learningScenario.userId && (
        <div onClick={(event) => event.stopPropagation()} className="flex items-center">
          <DestructiveActionButton
            aria-label={tCommon('delete')}
            modalDescription={t('form.delete-description')}
            modalTitle={t('form.delete-title')}
            confirmText={tCommon('delete')}
            actionFn={handleDeleteLearningScenario}
            triggerButtonClassName={cn('border-transparent p-0', iconClassName)}
          >
            <TrashIcon aria-hidden="true" className="w-8 h-8" />
            <span className="sr-only">{tCommon('delete')}</span>
          </DestructiveActionButton>
        </div>
      )}
    </Link>
  );
}
