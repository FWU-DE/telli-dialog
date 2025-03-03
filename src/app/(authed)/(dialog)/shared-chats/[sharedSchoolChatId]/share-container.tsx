import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { labelClassName } from '@/utils/tailwind/input';
import CountDownTimer from '../_components/count-down';
import {
  intelliPointsPercentageValueSchema,
  SharedConversationShareFormValues,
  sharedConversationFormValuesSchema,
  usageTimeValueSchema,
} from './schema';
import { SharedSchoolConversationModel } from '@/db/schema';
import { handleInitiateSharedChatShareAction, handleStopSharedChatShareAction } from './actions';
import {
  calculateTimeLeftBySharedChat,
  getIntelliPointsValueOrDefault,
  getMaxUsageTimeValueOrDefault,
} from './utils';
import { useToast } from '@/components/common/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { selectSVGBackground } from '@/utils/tailwind/select';
import { buttonSecondaryClassName } from '@/utils/tailwind/button';
import { useTranslations } from 'next-intl';
import FilledShareIcon from '@/components/icons/filled-share';

type ShareContainerProps = SharedSchoolConversationModel;

export default function ShareContainer({ ...sharedSchoolChat }: ShareContainerProps) {
  const toast = useToast();
  const router = useRouter();
  const t = useTranslations('shared-chats.shared');
  const tToast = useTranslations('shared-chats.toasts');
  const tCommon = useTranslations('common');

  const sharedChatTimeLeft = calculateTimeLeftBySharedChat(sharedSchoolChat);
  const sharedChatActive = sharedChatTimeLeft > 0;

  const { register: registerShare, getValues: getValuesShare } =
    useForm<SharedConversationShareFormValues>({
      resolver: zodResolver(sharedConversationFormValuesSchema),
      defaultValues: {
        intelliPointsPercentageLimit: getIntelliPointsValueOrDefault(
          sharedSchoolChat.intelligencePointsLimit,
          '10',
        ),
        usageTimeLimit: getMaxUsageTimeValueOrDefault(sharedSchoolChat.maxUsageTimeLimit, '45'),
      },
      disabled: sharedChatActive,
    });

  const shareUILink = `/shared-chats/${sharedSchoolChat.id}/share`;

  function handleStartSharing() {
    const data = getValuesShare();

    handleInitiateSharedChatShareAction({ ...data, id: sharedSchoolChat.id })
      .then(() => {
        toast.success(tToast('share-toast-success'));
        router.push(shareUILink);
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('share-toast-error'));
      });
  }

  function handleStopSharing() {
    handleStopSharedChatShareAction({ id: sharedSchoolChat.id })
      .then(() => {
        toast.success(tToast('stop-share-toast-success'));
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('stop-share-toast-error'));
      });
  }

  return (
    <div className="flex flex-col gap-4 border-[1px] rounded-enterprise-md border-gray-200 p-6">
      <h2 className="font-medium">{t('title')}</h2>
      <p>{t('description')}</p>
      <div className="flex gap-6 items-center flex-wrap">
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>Telli-Points</label>
          <select
            {...registerShare('intelliPointsPercentageLimit')}
            className="py-2 pl-4 pr-8 bg-white border-[1px] rounded-enterprise-md border-gray-200"
            style={{ WebkitAppearance: 'none', background: selectSVGBackground }}
          >
            {intelliPointsPercentageValueSchema.options.map((value) => (
              <option key={value} value={value}>
                {value} %
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>{t('max-usage')}</label>
          <select
            {...registerShare('usageTimeLimit')}
            className="py-2 pl-4 pr-8 bg-white border-[1px] rounded-enterprise-md border-gray-200"
            style={{ WebkitAppearance: 'none', background: selectSVGBackground }}
          >
            {usageTimeValueSchema.options.map((value) => (
              <option key={value} value={value}>
                {value} {tCommon('minutes')}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-grow" />
        {!sharedChatActive && <div />}
        {sharedChatActive && (
          <div className="flex flex-col gap-4">
            <label className={cn(labelClassName)}>{t('time')}</label>
            <CountDownTimer
              leftTime={sharedChatTimeLeft}
              totalTime={sharedSchoolChat.maxUsageTimeLimit ?? 0}
            />
          </div>
        )}
        <div className="flex flex-col gap-4 flex-wrap">
          <label className={cn(labelClassName, 'invisible')}>{t('share')}</label>
          <div className="flex gap-3 justify-end">
            {sharedChatActive && (
              <button
                className={cn(
                  'flex items-center justify-center',
                  buttonSecondaryClassName,
                  'hover:border-primary hover:bg-vidis-hover-green/20 p-3 rounded-enterprise-sm',
                )}
                type="button"
                onClick={handleStopSharing}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="12" height="12" rx="4" fill="#46217E" />
                </svg>
              </button>
            )}
            {sharedChatActive && (
              <button
                className={cn(
                  'flex items-center justify-center',
                  buttonSecondaryClassName,
                  'hover:border-primary hover:bg-vidis-hover-green/20 p-2.5 rounded-enterprise-sm',
                )}
                type="button"
                onClick={() => router.push(shareUILink)}
              >
                <FilledShareIcon className="w-4 h-4" />
              </button>
            )}
            {!sharedChatActive && (
              <button
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
