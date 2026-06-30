'use client';

import { useToast } from '@/components/common/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import { CustomChatHeading2 } from '@/components/custom-chat/custom-chat-heading2';
import { Card, CardContent } from '@ui/components/card';
import { Button } from '@ui/components/button';
import { ShareFatIcon, TrashSimpleIcon } from '@phosphor-icons/react';
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
import { TokenPointsLeftRing } from './custom-chat-token-points-left-ring';
import { CustomChatExtendShareExpirationButton } from './custom-chat-extend-share-expiration-button';

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
  budgetUsedBySharedChat: number;
  maxBudget: number;
  onShare: (data: z.infer<typeof shareFormSchema>) => Promise<{ success: boolean }>;
  onUnshare: () => Promise<{ success: boolean }>;
  onAddTime: (data: { additionalTimeInMinutes: number }) => Promise<{
    success: boolean;
    expiredAt?: Date;
  }>;
  shareUILink: string;
  sharingDisabled?: boolean;
}

export function CustomChatShareWithLearners({
  expiredAt,
  manuallyStoppedAt,
  maxUsageTimeLimit,
  tokenPointsLimit,
  usedBudget,
  budgetUsedBySharedChat,
  maxBudget,
  onShare,
  onUnshare,
  onAddTime,
  shareUILink,
  sharingDisabled = false,
}: CustomChatShareWithLearnersProps) {
  const toast = useToast();
  const router = useRouter();

  const t = useTranslations('custom-chat.share-with-learners');
  const tToast = useTranslations('custom-chat.toasts');

  const [expiredAtOverride, setExpiredAtOverride] = useState<Date | null>(null);
  const currentExpiredAt = expiredAtOverride ?? expiredAt;

  const sharedChatTimeLeft = calculateTimeLeft({
    expiredAt: currentExpiredAt,
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

  const preselectedUsageTimeLimit =
    maxUsageTimeLimit !== null && usageTimeValuesInMinutes.includes(maxUsageTimeLimit)
      ? maxUsageTimeLimit
      : 45;

  const { getValues: getValuesShare, setValue: setShareValue } = useForm({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      tokenPointsPercentageLimit: preselectedTokenPointsPercentageLimit,
      usageTimeLimit: preselectedUsageTimeLimit,
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
          {sharedChatActive ? (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch w-full">
                <div className="flex flex-col lg:flex-row gap-4 items-stretch w-full lg:w-1/2">
                  <Card className="bg-background-2 min-w-0 flex-1 py-4">
                    <CardContent className="px-2 h-full flex flex-col">
                      <div className="space-y-2">
                        <p className="text-sm">{t('max-token-points')}</p>
                        <div className="pr-6">
                          <TokenPointsLimitSelect
                            ariaLabel={t('max-token-points')}
                            defaultValue={String(getValuesShare('tokenPointsPercentageLimit'))}
                            onValueChange={() => {}}
                            disabled
                            pointsPercentageValues={[preselectedTokenPointsPercentageLimit]}
                            maxAvailablePercentage={maxAvailablePercentage}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex-1 space-y-2">
                        <p className="text-sm">{t('token-points-left')}</p>
                        <TokenPointsLeftRing
                          tokenLimit={(maxBudget * preselectedTokenPointsPercentageLimit) / 100}
                          spentTokens={budgetUsedBySharedChat}
                          spentLabel={t('token-points-spent')}
                          ariaLabel={t('token-points-left')}
                          className="w-6 h-6"
                        />
                      </div>
                      <div className="mt-4 flex justify-center">
                        <Button>{t('button-adjust-token-limit')}</Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background-2 min-w-0 flex-1 py-4">
                    <CardContent className="px-2 h-full flex flex-col">
                      <div className="space-y-2">
                        <p className="text-sm">{t('max-usage-time')}</p>
                        <div className="pr-6">
                          <TimeLimitSelect
                            ariaLabel={t('max-usage-time')}
                            defaultValue={String(getValuesShare('usageTimeLimit'))}
                            onChange={() => {}}
                            disabled
                            usageTimeValuesInMinutes={[preselectedUsageTimeLimit]}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex-1 space-y-2">
                        <p className="text-sm">{t('usage-time-left')}</p>
                        <CountDownTimer
                          leftTimeInSeconds={sharedChatTimeLeft}
                          totalTimeInSeconds={(maxUsageTimeLimit ?? 0) * 60}
                          className="!bg-transparent"
                          stopWatchClassName="w-4 h-4"
                        />
                      </div>
                      <div className="mt-4 flex justify-center">
                        <CustomChatExtendShareExpirationButton
                          sharedChatActive={sharedChatActive}
                          preselectedUsageTimeLimit={preselectedUsageTimeLimit}
                          onAddTime={onAddTime}
                          onAddTimeSuccess={(newExpiredAt) => {
                            setExpiredAtOverride(newExpiredAt);
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="w-full lg:w-1/2 lg:shrink-0 lg:flex lg:items-center lg:justify-center">
                  <div className="flex flex-col gap-3">
                    <Button
                      type="button"
                      onClick={() => router.push(shareUILink)}
                      aria-label={t('share')}
                      data-testid="open-share-page-button"
                    >
                      <ShareFatIcon className="size-5" /> {t('button-to-share-page')}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleStopSharing}
                      aria-label={t('button-stop')}
                      data-testid="stop-share-button"
                    >
                      <TrashSimpleIcon className="size-5" /> {t('button-close-session')}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-4 items-end">
              <TokenPointsLimitSelect
                label={t('token-points')}
                ariaLabel={t('token-points')}
                defaultValue={String(getValuesShare('tokenPointsPercentageLimit'))}
                onValueChange={(value) => setShareValue('tokenPointsPercentageLimit', value)}
                disabled={sharedChatActive || maxAvailablePercentage <= 0}
                pointsPercentageValues={tokenPointsPercentageValues}
                maxAvailablePercentage={maxAvailablePercentage}
              />
              <TimeLimitSelect
                label={t('max-usage-time')}
                ariaLabel={t('max-usage-time')}
                defaultValue={String(getValuesShare('usageTimeLimit'))}
                onChange={(value) => setShareValue('usageTimeLimit', value)}
                disabled={sharedChatActive}
                usageTimeValuesInMinutes={usageTimeValuesInMinutes}
              />
              <div className="grow" />

              <Button
                type="button"
                onClick={handleStartSharing}
                disabled={sharingDisabled || maxAvailablePercentage <= 0}
                data-testid="start-share-button"
              >
                <ShareFatIcon className="size-5" />
                {t('button-start')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
