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
    <div className="flex justify-between text-sm">
      {isSubmitting && (
        <span className="flex items-center gap-1">
          <SpinnerIcon className="size-5 animate-spin" />
          {t('saving')}
        </span>
      )}
      {!isSubmitting && hasSaveError && (
        <span className="flex items-center gap-1">
          <WarningCircleIcon className="size-5 text-warning" /> {t('save-error')}
        </span>
      )}
      {!isSubmitting && isDirty && !hasSaveError && (
        <span className="flex items-center gap-1">
          <WarningCircleIcon className="size-5 text-icon" /> {t('unsaved-changes')}
        </span>
      )}
      {!isSubmitting && !isDirty && !hasSaveError && (
        <span className="flex items-center gap-1" data-testid="autosave-saved">
          <CheckCircleIcon className="size-5 text-success" /> {t('saved')}
        </span>
      )}
    </div>
  );
}
