import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { labelClassName } from '@/utils/tailwind/input';
import CountDownTimer from '../_components/count-down';
import {
  SharedConversationShareFormValues,
  intelliPointsPercentageValues,
  sharedConversationFormValuesSchema,
  usageTimeValuesInMinutes,
} from './schema';
import { SharedSchoolConversationModel } from '@shared/db/schema';
import { shareLearningScenarioAction, unshareLearningScenarioAction } from './actions';
import { useToast } from '@/components/common/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { selectSVGBackground } from '@/utils/tailwind/select';
import { buttonSecondaryClassName } from '@/utils/tailwind/button';
import { useTranslations } from 'next-intl';
import FilledShareIcon from '@/components/icons/filled-share';
import ChatStopIcon from '@/components/icons/chat-stop';
import { iconClassName } from '@/utils/tailwind/icon';
import { calculateTimeLeftForLearningScenario } from '@shared/learning-scenarios/learning-scenario-service.client';

type ShareContainerProps = SharedSchoolConversationModel;

export default function ShareContainer({ ...sharedSchoolChat }: ShareContainerProps) {
  const toast = useToast();
  const router = useRouter();

  const t = useTranslations('shared-chats.shared');
  const tToast = useTranslations('shared-chats.toasts');
  const tCommon = useTranslations('common');

  const sharedChatTimeLeft = calculateTimeLeftForLearningScenario(sharedSchoolChat);
  const sharedChatActive = sharedChatTimeLeft > 0;

  const { register: registerShare, getValues: getValuesShare } =
    useForm<SharedConversationShareFormValues>({
      resolver: zodResolver(sharedConversationFormValuesSchema),
      defaultValues: {
        intelliPointsPercentageLimit: sharedSchoolChat.intelligencePointsLimit ?? 10,
        usageTimeLimit: sharedSchoolChat.maxUsageTimeLimit ?? 45,
      },
      disabled: sharedChatActive,
    });

  const shareUILink = `/shared-chats/${sharedSchoolChat.id}/share`;

  async function handleStartSharing() {
    const data = getValuesShare();
    // getValuesShare returns strings instead of numbers, so we have to parse/coerce them here
    const parsedData = sharedConversationFormValuesSchema.parse(data);
    const result = await shareLearningScenarioAction({
      learningScenarioId: sharedSchoolChat.id,
      data: parsedData,
    });

    if (result.success) {
      toast.success(tToast('share-toast-success'));
      router.push(shareUILink);
      router.refresh();
    } else {
      toast.error(tToast('share-toast-error'));
    }
  }

  async function handleStopSharing() {
    const result = await unshareLearningScenarioAction({ learningScenarioId: sharedSchoolChat.id });

    if (result.success) {
      toast.success(tToast('stop-share-toast-success'));
      router.refresh();
    } else {
      toast.error(tToast('stop-share-toast-error'));
    }
  }

  return (
    <div className="flex flex-col gap-4 border-[1px] rounded-enterprise-md border-gray-200 p-6">
      <h2 className="font-medium">{t('title')}</h2>
      <p>{t('description')}</p>
      <div className="flex gap-6 items-center flex-wrap">
        <div className="flex flex-col gap-4">
          <label htmlFor="Telli-Points" className={cn(labelClassName, 'text-sm')}>
            telli-Points
          </label>
          <select
            id="Telli-Points"
            aria-label="Telli-Points"
            {...registerShare('intelliPointsPercentageLimit')}
            className={cn(
              'py-2 pl-4 pr-8 bg-[#EEEEEE] border-[1px] rounded-enterprise-md border-gray-600',
              sharedChatActive && 'cursor-not-allowed',
            )}
            style={{
              WebkitAppearance: 'none',
              background: !sharedChatActive ? selectSVGBackground : undefined,
            }}
          >
            {intelliPointsPercentageValues.map((value) => (
              <option key={value} value={value}>
                {value} %
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-4">
          <label htmlFor="maxUsage" className={cn(labelClassName, 'text-sm')}>
            {t('max-usage')}
          </label>
          <select
            id="maxUsage"
            aria-label={t('max-usage')}
            {...registerShare('usageTimeLimit')}
            className={cn(
              'py-2 pl-4 pr-8 bg-[#EEEEEE] border-[1px] rounded-enterprise-md border-gray-600',
              sharedChatActive && 'cursor-not-allowed',
            )}
            style={{
              WebkitAppearance: 'none',
              background: !sharedChatActive ? selectSVGBackground : undefined,
            }}
          >
            {usageTimeValuesInMinutes.map((value) => {
              let displayLabel = `${value} Minuten`;
              if (value >= 1440) {
                const days = value / 1440;
                displayLabel = days === 1 ? '1 Tag' : `${days} Tage`;
              }

              return (
                <option key={value} value={value}>
                  {displayLabel}
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex-grow" />
        {sharedChatActive && (
          <div className="flex flex-col gap-4">
            <label className={cn(labelClassName)}>{t('time')}</label>
            <CountDownTimer
              leftTime={sharedChatTimeLeft}
              totalTime={sharedSchoolChat.maxUsageTimeLimit ?? 0}
              stopWatchClassName="w-4 h-4"
            />
          </div>
        )}
        <div className="flex flex-col gap-4 flex-wrap">
          <label className={cn(labelClassName, 'invisible')}>{t('share')}</label>
          <div className="flex gap-3 justify-end">
            {sharedChatActive && (
              <button
                aria-label={tCommon('stop')}
                className={cn(
                  'flex items-center justify-center',
                  buttonSecondaryClassName,
                  iconClassName,
                  'p-3 rounded-enterprise-sm',
                )}
                type="button"
                onClick={handleStopSharing}
              >
                <ChatStopIcon aria-hidden="true" className="w-3 h-3" />
                <span className="sr-only">{tCommon('stop')}</span>
              </button>
            )}
            {sharedChatActive && (
              <button
                aria-label={t('share')}
                className={cn(
                  'flex items-center justify-center',
                  buttonSecondaryClassName,
                  'p-2.5 rounded-enterprise-sm',
                  iconClassName,
                )}
                type="button"
                onClick={() => router.push(shareUILink)}
              >
                <FilledShareIcon aria-hidden="true" className="w-3 h-3" />
                <span className="sr-only">{t('share')}</span>
              </button>
            )}
            {!sharedChatActive && (
              <button
                title={t('button-start')}
                className={cn(
                  buttonPrimaryClassName,
                  'min-w-max max-w-min h-11 flex gap-2 items-center group',
                )}
                type="button"
                onClick={handleStartSharing}
              >
                <span>{t('button-start')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
