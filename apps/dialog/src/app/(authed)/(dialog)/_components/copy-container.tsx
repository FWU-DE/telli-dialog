import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { useTranslations } from 'next-intl';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import { CreateNewInstanceFromTemplate } from './create-new-instance-from-template';

export function CopyContainer({
  templateId,
  templatePictureId,
  startedAt,
  maxUsageTimeLimit,
  translationPath,
  redirectPath,
  createInstanceCallbackAction,
}: Pick<
  Parameters<typeof CreateNewInstanceFromTemplate>[0],
  'redirectPath' | 'createInstanceCallbackAction' | 'templateId' | 'templatePictureId'
> & {
  startedAt: Date | null;
  maxUsageTimeLimit: number | null;
  translationPath: Parameters<typeof useTranslations>[0];
}) {
  const sharedChatTimeLeft = calculateTimeLeft({ startedAt, maxUsageTimeLimit });
  const sharedChatActive = sharedChatTimeLeft > 0;
  const containerBg = !sharedChatActive ? 'bg-secondary/10' : 'bg-100/10';
  const t = useTranslations(translationPath);
  return (
    <CreateNewInstanceFromTemplate
      templateId={templateId}
      templatePictureId={templatePictureId}
      redirectPath={redirectPath}
      disabled={sharedChatActive}
      createInstanceCallbackAction={createInstanceCallbackAction}
    >
      <div
        className={cn(
          'flex flex-col gap-4 border rounded-enterprise-md border-gray-200 p-6 mt-12',
          containerBg,
        )}
      >
        <h2 className="font-medium">{t('copy-page.title')}</h2>
        <div>{t('copy-page.content')}</div>
        <button
          disabled={sharedChatActive}
          title={t('copy-page.copy-template')}
          className={cn(
            buttonPrimaryClassName,
            'min-w-max max-w-min h-11 flex gap-2 items-center group self-end',
          )}
          type="button"
        >
          <span>{t('copy-page.copy-template')}</span>
        </button>
      </div>
    </CreateNewInstanceFromTemplate>
  );
}
