import { CheckCircleIcon, SpinnerIcon, WarningCircleIcon } from '@phosphor-icons/react';

export function CustomChatFormState({
  isDirty,
  isSubmitting,
  hasSaveError,
}: {
  isDirty: boolean;
  isSubmitting: boolean;
  hasSaveError?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      {isSubmitting && (
        <span className="flex items-center gap-1">
          <SpinnerIcon className="size-5 animate-spin" />
          Wird gespeichert...
        </span>
      )}
      {!isSubmitting && hasSaveError && (
        <span className="flex items-center gap-1">
          <WarningCircleIcon className="size-5 text-warning" /> Speichern fehlgeschlagen
        </span>
      )}
      {!isSubmitting && isDirty && !hasSaveError && (
        <span className="flex items-center gap-1">
          <WarningCircleIcon className="size-5 text-icon" /> Ungespeicherte Änderungen
        </span>
      )}
      {!isSubmitting && !isDirty && !hasSaveError && (
        <span className="flex items-center gap-1">
          <CheckCircleIcon className="size-5 text-success" /> Gespeichert
        </span>
      )}
    </div>
  );
}
