import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { labelClassName } from '@/utils/tailwind/input';
import CountDownTimer from '../_components/count-down';
import {
  intelliPointsPercentageValueSchema,
  SharedSchoolChatShareFormValues,
  sharedSchoolChatShareFormValuesSchema,
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
import ShareIcon from '@/components/icons/share';
import { selectSVGBackground } from '@/utils/tailwind/select';
import { buttonSecondaryClassName } from '@/utils/tailwind/button';
import { useTranslations } from 'next-intl';

type ShareContainerProps = SharedSchoolConversationModel;

export default function ShareContainer({ ...sharedSchoolChat }: ShareContainerProps) {
  const toast = useToast();
  const router = useRouter();
  const t = useTranslations('Chat.shared-chats.shared');

  const sharedChatTimeLeft = calculateTimeLeftBySharedChat(sharedSchoolChat);
  const sharedChatActive = sharedChatTimeLeft > 0;

  const { register: registerShare, getValues: getValuesShare } =
    useForm<SharedSchoolChatShareFormValues>({
      resolver: zodResolver(sharedSchoolChatShareFormValuesSchema),
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
        toast.success('Klassendialog erfolgreich geteilt.');
        router.push(shareUILink);
        router.refresh();
      })
      .catch(() => {
        toast.error('Etwas ist beim Teilen des Klassendialogs schief gelaufen.');
      });
  }

  function handleStopSharing() {
    handleStopSharedChatShareAction({ id: sharedSchoolChat.id })
      .then(() => {
        toast.success('Klassendialog wird nicht mehr geteilt.');
        router.refresh();
      })
      .catch(() => {
        toast.error('Etwas ist beim Beenden des Teilens schief gelaufen.');
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
                {value} Minuten
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
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="10" height="10" fill="currentColor" />
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
                <ShareIcon />
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
