'use client';

import { useToast } from '@/components/common/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import { CustomChatHeading2 } from '@/components/custom-chat/custom-chat-heading2';
import { Card, CardContent } from '@ui/components/Card';
import { Field, FieldLabel } from '@ui/components/Field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/Select';
import { Button } from '@ui/components/Button';
import { ShareFatIcon, StopIcon } from '@phosphor-icons/react';
import CountDownTimer from '../../app/(authed)/(dialog)/learning-scenarios/_components/count-down';
import RichText from '../common/rich-text';
import { z } from 'zod';

const shareFormSchema = z.object({
  telliPointsPercentageLimit: z.coerce.number(),
  usageTimeLimit: z.coerce.number(),
});

interface CustomChatShareWithLearnersProps {
  startedAt: Date | null;
  maxUsageTimeLimit: number | null;
  pointsPercentageValues: number[];
  usageTimeValues: number[];
  onShare: (data: z.infer<typeof shareFormSchema>) => Promise<{ success: boolean }>;
  onUnshare: () => Promise<{ success: boolean }>;
  shareUILink: string;
}

export function CustomChatShareWithLearners({
  startedAt,
  maxUsageTimeLimit,
  pointsPercentageValues,
  usageTimeValues,
  onShare,
  onUnshare,
  shareUILink,
}: CustomChatShareWithLearnersProps) {
  const toast = useToast();
  const router = useRouter();

  const t = useTranslations('learning-scenarios.share-with-learners');
  const tToast = useTranslations('learning-scenarios.toasts');

  const sharedChatTimeLeft = calculateTimeLeft({
    startedAt,
    maxUsageTimeLimit,
  });
  const sharedChatActive = sharedChatTimeLeft > 0;

  const { getValues: getValuesShare, setValue: setShareValue } = useForm({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      telliPointsPercentageLimit: 10,
      usageTimeLimit: maxUsageTimeLimit ?? 45,
    },
  });

  async function handleStartSharing() {
    const data = getValuesShare();
    const parsedData = shareFormSchema.parse(data);
    const result = await onShare(parsedData);

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
    <div className="flex flex-col gap-3">
      <CustomChatHeading2 text={t('title')} />
      <Card>
        <CardContent>
          <p className="mb-4">
            <RichText>{(tags) => t.rich('description', tags)}</RichText>
          </p>
          <div className="flex gap-4 items-end">
            <div className="whitespace-nowrap flex-1">
              <Field>
                <FieldLabel>telli-Points</FieldLabel>
                <Select
                  defaultValue={String(getValuesShare('telliPointsPercentageLimit'))}
                  onValueChange={(value) =>
                    setShareValue('telliPointsPercentageLimit', Number(value))
                  }
                  disabled={sharedChatActive}
                >
                  <SelectTrigger aria-label="telli-Points" data-testid="telli-points-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pointsPercentageValues.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value} %
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="whitespace-nowrap flex-1">
              <Field>
                <FieldLabel>{t('max-usage')}</FieldLabel>
                <Select
                  defaultValue={String(getValuesShare('usageTimeLimit'))}
                  onValueChange={(value) => setShareValue('usageTimeLimit', Number(value))}
                  disabled={sharedChatActive}
                >
                  <SelectTrigger aria-label={t('max-usage')} data-testid="usage-time-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {usageTimeValues.map((value) => {
                      let displayLabel = `${value} Minuten`;
                      if (value >= 1440) {
                        const days = value / 1440;
                        displayLabel = days === 1 ? '1 Tag' : `${days} Tage`;
                      }
                      return (
                        <SelectItem key={value} value={String(value)}>
                          {displayLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grow" />

            {!sharedChatActive && (
              <Button type="button" onClick={handleStartSharing}>
                <ShareFatIcon className="size-5" />
                {t('button-start')}
              </Button>
            )}

            {sharedChatActive && (
              <CountDownTimer
                leftTime={sharedChatTimeLeft}
                totalTime={maxUsageTimeLimit ?? 0}
                stopWatchClassName="w-4 h-4"
              />
            )}

            {sharedChatActive && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleStopSharing}
                  aria-label={t('button-stop')}
                >
                  <StopIcon className="size-5" />
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push(shareUILink)}
                  aria-label={t('share')}
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
