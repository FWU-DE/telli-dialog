import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { labelClassName } from '@/utils/tailwind/input';
import {
  intelliPointsPercentageValueSchema,
  SharedConversationShareFormValues,
  usageTimeValueSchema,
  sharedConversationFormValuesSchema,
} from '../../../shared-chats/[sharedSchoolChatId]/schema';
import { CharacterModel } from '@/db/schema';
import { handleInitiateCharacterShareAction, handleStopCharacaterShareAction } from './actions';
import {
  calculateTimeLeftBySharedChat,
  getIntelliPointsValueOrDefault,
  getMaxUsageTimeValueOrDefault,
} from '../../../shared-chats/[sharedSchoolChatId]/utils';
import { useToast } from '@/components/common/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { selectSVGBackground } from '@/utils/tailwind/select';
import { buttonSecondaryClassName } from '@/utils/tailwind/button';
import { useTranslations } from 'next-intl';
import CountDownTimer from '../../../shared-chats/_components/count-down';
import FilledShareIcon from '@/components/icons/filled-share';

type ShareContainerProps = CharacterModel;

export default function ShareContainer({ ...character }: ShareContainerProps) {
  const toast = useToast();
  const router = useRouter();
  const t = useTranslations('characters.shared');
  const tToasts = useTranslations('characters.toasts');

  const sharedChatTimeLeft = calculateTimeLeftBySharedChat(character);
  const sharedChatActive = sharedChatTimeLeft > 0;

  const { register: registerShare, getValues: getValuesShare } =
    useForm<SharedConversationShareFormValues>({
      resolver: zodResolver(sharedConversationFormValuesSchema),
      defaultValues: {
        intelliPointsPercentageLimit: getIntelliPointsValueOrDefault(
          character.intelligencePointsLimit,
          '10',
        ),
        usageTimeLimit: getMaxUsageTimeValueOrDefault(character.maxUsageTimeLimit, '45'),
      },
      disabled: sharedChatActive,
    });

  const shareUILink = `/characters/editor/${character.id}/share`;

  function handleStartSharing() {
    const data = getValuesShare();

    handleInitiateCharacterShareAction({ ...data, id: character.id })
      .then(() => {
        toast.success(tToasts('share-toast-success'));
        router.push(shareUILink);
        router.refresh();
      })
      .catch(() => {
        toast.error(tToasts('share-toast-error'));
      });
  }

  function handleStopSharing() {
    handleStopCharacaterShareAction({ id: character.id })
      .then(() => {
        toast.success(tToasts('stop-share-toast-success'));
        router.refresh();
      })
      .catch(() => {
        toast.error(tToasts('stop-share-toast-error'));
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
            className={cn(
              'py-2 pl-4 pr-8 bg-[#EEEEEE] border-[1px] rounded-enterprise-md border-gray-600',
              sharedChatActive && 'cursor-not-allowed',
            )}
            style={{
              WebkitAppearance: 'none',
              background: !sharedChatActive ? selectSVGBackground : undefined,
            }}
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
            className={cn(
              'py-2 pl-4 pr-8 bg-[#EEEEEE] border-[1px] rounded-enterprise-md border-gray-600',
              sharedChatActive && 'cursor-not-allowed',
            )}
            style={{
              WebkitAppearance: 'none',
              background: !sharedChatActive ? selectSVGBackground : undefined,
            }}
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
              totalTime={character.maxUsageTimeLimit ?? 0}
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
                  'hover:border-primary hover:bg-vidis-hover-green/20 rounded-enterprise-sm p-2.5',
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
