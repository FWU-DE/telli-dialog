'use client';

import { useToast } from '@/components/common/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import { CustomChatHeading2 } from '@/components/custom-chat/custom-chat-heading2';
import { Card, CardContent } from '@ui/components/card';
import { Button } from '@ui/components/button';
import { ShareFatIcon, StopIcon } from '@phosphor-icons/react';
import CountDownTimer from '../../../app/(authed)/(chat-bot)/learning-scenarios/_components/count-down';
import { RichText } from '../../common/rich-text';
import { z } from 'zod';
import {
  getMaxAvailablePercentage,
  resolveTokenPointsPercentageLimit,
} from './custom-chat-token-points-limit-select';
import { TokenPointsLimitSelect } from './custom-chat-token-points-limit-select';
import {
  tokenPointsPercentageValues,
  usageTimeValuesInMinutes,
} from './custom-chat-share-with-learners-limit-params';
import { TimeLimitSelect } from './custom-chat-time-limit-select';

const shareFormSchema = z.object({
  tokenPointsPercentageLimit: z.coerce.number(),
  usageTimeLimit: z.coerce.number(),
});

interface CustomChatShareWithLearnersProps {
  expiredAt: Date | null;
  manuallyStoppedAt: Date | null;
  maxUsageTimeLimit: number | null;
  tokenPointsLimit: number | null;
  usedBudget: number;
  maxBudget: number;
  onShare: (data: z.infer<typeof shareFormSchema>) => Promise<{ success: boolean }>;
  onUnshare: () => Promise<{ success: boolean }>;
  shareUILink: string;
  sharingDisabled?: boolean;
}

export function CustomChatShareWithLearners({
  expiredAt,
  manuallyStoppedAt,
  maxUsageTimeLimit,
  tokenPointsLimit,
  usedBudget,
  maxBudget,
  onShare,
  onUnshare,
  shareUILink,
  sharingDisabled = false,
}: CustomChatShareWithLearnersProps) {
  const toast = useToast();
  const router = useRouter();

  const t = useTranslations('custom-chat.share-with-learners');
  const tToast = useTranslations('custom-chat.toasts');

  const sharedChatTimeLeft = calculateTimeLeft({
    expiredAt,
    manuallyStoppedAt,
  });
  const sharedChatActive = sharedChatTimeLeft > 0;

  const maxAvailablePercentage = getMaxAvailablePercentage({ usedBudget, maxBudget });

  const preselectedTokenPointsPercentageLimit = resolveTokenPointsPercentageLimit({
    previousTokenPointsLimit: tokenPointsLimit,
    selectableFixedValues: tokenPointsPercentageValues.filter(
      (value) => value < maxAvailablePercentage,
    ),
  });

  const { getValues: getValuesShare, setValue: setShareValue } = useForm({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      tokenPointsPercentageLimit: preselectedTokenPointsPercentageLimit,
      usageTimeLimit: maxUsageTimeLimit ?? 45,
    },
  });

  async function handleStartSharing() {
    const data = getValuesShare();
    const parseResult = shareFormSchema.safeParse(data);
    if (!parseResult.success) {
      toast.error(tToast('share-toast-error'));
      return;
    }
    const result = await onShare(parseResult.data);

    if (result.success) {
      toast.success(tToast('share-toast-success'));
      router.push(shareUILink);
    } else {
      toast.error(tToast('share-toast-error'));
    }
  }

  async function handleStopSharing() {
    const result = await onUnshare();

    if (result.success) {
      toast.success(tToast('stop-share-toast-success'));
      router.refresh();
    } else {
      toast.error(tToast('stop-share-toast-error'));
    }
  }

  return (
    <div className="flex flex-col gap-3 mb-5">
      <CustomChatHeading2 text={t('title')} />
      <Card>
        <CardContent>
          <p className="mb-4">
            <RichText>{(tags) => t.rich('description', tags)}</RichText>
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <TokenPointsLimitSelect
              defaultValue={String(getValuesShare('tokenPointsPercentageLimit'))}
              onValueChange={(value) => setShareValue('tokenPointsPercentageLimit', value)}
              disabled={sharedChatActive || maxAvailablePercentage <= 0}
              pointsPercentageValues={tokenPointsPercentageValues}
              maxAvailablePercentage={maxAvailablePercentage}
            />
            <TimeLimitSelect
              defaultValue={String(getValuesShare('usageTimeLimit'))}
              onChange={(value) => setShareValue('usageTimeLimit', value)}
              disabled={sharedChatActive}
              usageTimeValuesInMinutes={usageTimeValuesInMinutes}
            />

            <div className="grow" />

            {!sharedChatActive && (
              <Button
                type="button"
                onClick={handleStartSharing}
                disabled={sharingDisabled || maxAvailablePercentage <= 0}
                data-testid="start-share-button"
              >
                <ShareFatIcon className="size-5" />
                {t('button-start')}
              </Button>
            )}

            {sharedChatActive && (
              <CountDownTimer
                leftTimeInSeconds={sharedChatTimeLeft}
                totalTimeInSeconds={(maxUsageTimeLimit ?? 0) * 60}
                stopWatchClassName="w-4 h-4"
              />
            )}

            {sharedChatActive && (
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleStopSharing}
                  aria-label={t('button-stop')}
                  size="icon-round"
                  data-testid="stop-share-button"
                >
                  <StopIcon className="size-5" />
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push(shareUILink)}
                  aria-label={t('share')}
                  size="icon-round"
                  data-testid="open-share-page-button"
                >
                  <ShareFatIcon className="size-5" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
