import { CheckCircleIcon, SpinnerIcon, WarningCircleIcon } from '@phosphor-icons/react';

export function CustomChatFormState({
  isDirty,
  isSubmitting,
}: {
  isDirty: boolean;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      {isSubmitting && (
        <span className="flex items-center gap-1">
          <SpinnerIcon className="size-5 animate-spin" />
          Wird gespeichert...
        </span>
      )}
      {!isSubmitting && isDirty && (
        <span className="flex items-center gap-1">
          <WarningCircleIcon className="size-5 text-warning" /> Ungespeicherte Änderungen
        </span>
      )}
      {!isSubmitting && !isDirty && (
        <span className="flex items-center gap-1">
          <CheckCircleIcon className="size-5 text-success" /> Gespeichert
        </span>
      )}
    </div>
  );
}
