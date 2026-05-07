import { CheckCircleIcon, SpinnerIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/Tooltip';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

type FormStateStatus = 'saving' | 'save-error' | 'unsaved-changes' | 'saved';

const MIN_STATUS_VISIBLE_MS = 600;

export type CustomChatFormStateProps = {
  isDirty: boolean;
  isSubmitting: boolean;
  hasSaveError?: boolean;
};

export function CustomChatFormState({
  isDirty,
  isSubmitting,
  hasSaveError,
}: CustomChatFormStateProps) {
  const t = useTranslations('custom-chat.form');

  const targetStatus: FormStateStatus = isSubmitting
    ? 'saving'
    : hasSaveError
      ? 'save-error'
      : isDirty
        ? 'unsaved-changes'
        : 'saved';

  const [displayedStatus, setDisplayedStatus] = useState<FormStateStatus>(targetStatus);
  const displayedStatusRef = useRef<FormStateStatus>(targetStatus);
  const lockUntilRef = useRef<number>(0);
  const pendingStatusRef = useRef<FormStateStatus | null>(null);
  const pendingSwitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingSwitchTimeout = () => {
    if (pendingSwitchTimeoutRef.current) {
      clearTimeout(pendingSwitchTimeoutRef.current);
      pendingSwitchTimeoutRef.current = null;
    }
  };

  const applyStatus = (nextStatus: FormStateStatus) => {
    setDisplayedStatus(nextStatus);
    displayedStatusRef.current = nextStatus;
    lockUntilRef.current = Date.now() + MIN_STATUS_VISIBLE_MS;
  };

  useEffect(() => {
    displayedStatusRef.current = displayedStatus;
  }, [displayedStatus]);

  useEffect(() => {
    if (targetStatus === displayedStatusRef.current) {
      pendingStatusRef.current = null;
      return;
    }

    const remainingLockTime = Math.max(lockUntilRef.current - Date.now(), 0);
    clearPendingSwitchTimeout();

    if (remainingLockTime === 0) {
      pendingStatusRef.current = null;

      pendingSwitchTimeoutRef.current = setTimeout(() => {
        if (targetStatus !== displayedStatusRef.current) {
          applyStatus(targetStatus);
        }
        pendingSwitchTimeoutRef.current = null;
      }, 0);

      return;
    }

    pendingStatusRef.current = targetStatus;

    pendingSwitchTimeoutRef.current = setTimeout(() => {
      pendingSwitchTimeoutRef.current = null;

      const queuedStatus = pendingStatusRef.current;
      if (!queuedStatus || queuedStatus === displayedStatusRef.current) {
        return;
      }

      pendingStatusRef.current = null;
      applyStatus(queuedStatus);
    }, remainingLockTime);
  }, [targetStatus]);

  useEffect(() => {
    return clearPendingSwitchTimeout;
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className="ml-auto flex min-h-10 shrink-0 items-center justify-end rounded-lg border border-transparent bg-clip-padding bg-transparent p-0 text-right text-sm outline-none transition-all focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {displayedStatus === 'saving' && (
          <span className="flex gap-1 leading-tight">
            <SpinnerIcon className="size-5 shrink-0 animate-spin" />
            <span className="whitespace-break-spaces text-right">{t('saving')}</span>
          </span>
        )}
        {displayedStatus === 'save-error' && (
          <span className="flex gap-1 leading-tight">
            <WarningCircleIcon className="size-5 shrink-0 text-warning" />
            <span className="whitespace-break-spaces text-right">{t('save-error')}</span>
          </span>
        )}
        {displayedStatus === 'unsaved-changes' && (
          <span className="flex gap-1 leading-tight">
            <WarningCircleIcon className="size-5 shrink-0 text-icon" />
            <span className="whitespace-break-spaces text-right">{t('unsaved-changes')}</span>
          </span>
        )}
        {displayedStatus === 'saved' && (
          <span className="flex gap-1 leading-tight" data-testid="autosave-saved">
            <CheckCircleIcon className="size-5 shrink-0 text-success" />
            <span className="whitespace-break-spaces text-right">{t('saved')}</span>
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent>{t('tooltip')}</TooltipContent>
    </Tooltip>
  );
}
