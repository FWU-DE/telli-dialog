import { TrashSimpleIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';

export function CustomChatActionDelete({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      <TrashSimpleIcon className="size-5" />
      Löschen
    </Button>
  );
}
