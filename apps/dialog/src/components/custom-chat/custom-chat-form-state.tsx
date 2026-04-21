import { CheckCircleIcon, SpinnerIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

export function CustomChatFormState({
  isDirty,
  isSubmitting,
  hasSaveError,
}: {
  isDirty: boolean;
  isSubmitting: boolean;
  hasSaveError?: boolean;
}) {
  const t = useTranslations('custom-chat.form');
  return (
    <div className="ml-auto flex min-h-10 shrink-0 items-center text-sm justify-end">
      {isSubmitting && (
        <span className="flex gap-1 leading-tight">
          <SpinnerIcon className=" size-5 shrink-0 animate-spin" />
          <span className="whitespace-break-spaces text-right">{t('saving')}</span>
        </span>
      )}
      {!isSubmitting && hasSaveError && (
        <span className="flex gap-1 leading-tight">
          <WarningCircleIcon className="size-5 shrink-0 text-warning" />
          <span className="whitespace-break-spaces text-right">{t('save-error')}</span>
        </span>
      )}
      {!isSubmitting && isDirty && !hasSaveError && (
        <span className="flex gap-1 leading-tight">
          <WarningCircleIcon className="size-5 shrink-0 text-icon" />
          <span className="whitespace-break-spaces text-right">{t('unsaved-changes')}</span>
        </span>
      )}
      {!isSubmitting && !isDirty && !hasSaveError && (
        <span className="flex gap-1 leading-tight " data-testid="autosave-saved">
          <CheckCircleIcon className="size-5 shrink-0 text-success" />
          <span className="whitespace-break-spaces text-right">{t('saved')}</span>
        </span>
      )}
    </div>
  );
}
