import { CopyIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';

export function CustomChatActionDuplicate({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      <CopyIcon className="size-5" />
      Duplizieren
    </Button>
  );
}
