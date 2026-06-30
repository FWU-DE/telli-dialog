'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/common/toast';
import { Button } from '@ui/components/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@ui/components/alert-dialog';
import { TimeLimitSelect } from './custom-chat-time-limit-select';
import { usageTimeValuesInMinutes } from './custom-chat-share-with-learners-limit-params';

type CustomChatExtendShareExpirationButtonProps = {
  sharedChatActive: boolean;
  preselectedUsageTimeLimit: number;
  onAddTime: (data: { additionalTimeInMinutes: number }) => Promise<{
    success: boolean;
    expiredAt?: Date;
  }>;
  onAddTimeSuccess: (newExpiredAt: Date) => void;
};

export function CustomChatExtendShareExpirationButton({
  sharedChatActive,
  preselectedUsageTimeLimit,
  onAddTime,
  onAddTimeSuccess,
}: CustomChatExtendShareExpirationButtonProps) {
  const toast = useToast();

  const t = useTranslations('custom-chat.share-with-learners');
  const tToast = useTranslations('custom-chat.toasts');
  const tCommon = useTranslations('common');

  const [open, setOpen] = React.useState(false);
  const [additionalTimeInMinutes, setAdditionalTimeInMinutes] = React.useState(45);
  const [selectVersion, setSelectVersion] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleAddTime() {
    setIsSubmitting(true);
    try {
      const result = await onAddTime({ additionalTimeInMinutes });
      if (result.success && result.expiredAt) {
        toast.success(tToast('add-time-toast-success'));
        setOpen(false);
        onAddTimeSuccess(result.expiredAt);
      } else {
        toast.error(tToast('add-time-toast-error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setAdditionalTimeInMinutes(preselectedUsageTimeLimit);
      setSelectVersion((current) => current + 1);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" disabled={!sharedChatActive} data-testid="add-additional-time-button">
          {t('button-additional-time')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle>{t('additional-time-modal-title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('additional-time-modal-description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <TimeLimitSelect
            key={selectVersion}
            ariaLabel={t('additional-time-modal-aria')}
            defaultValue={String(preselectedUsageTimeLimit)}
            onChange={setAdditionalTimeInMinutes}
            disabled={isSubmitting}
            usageTimeValuesInMinutes={usageTimeValuesInMinutes}
            isAdditionalTime
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>{tCommon('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="default"
            disabled={isSubmitting}
            onClick={() => {
              void handleAddTime();
            }}
          >
            {t('button-add')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
