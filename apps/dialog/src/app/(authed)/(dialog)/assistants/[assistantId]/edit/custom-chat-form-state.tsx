export function CustomChatFormState({
  isDirty,
  isSubmitting,
}: {
  isDirty: boolean;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex justify-between">
      {isSubmitting && <span>Wird gespeichert...</span>}
      {!isSubmitting && isDirty && <span>Ungespeicherte Änderungen</span>}
      {!isSubmitting && !isDirty && <span>Gespeichert</span>}
    </div>
  );
}
