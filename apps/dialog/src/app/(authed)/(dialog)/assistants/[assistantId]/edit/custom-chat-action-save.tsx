import { FloppyDiskIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';

export function CustomChatActionSave({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      <FloppyDiskIcon className="size-5" />
      Speichern
    </Button>
  );
}
