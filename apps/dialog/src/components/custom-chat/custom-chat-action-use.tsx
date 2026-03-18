import { ChatTextIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';

export function CustomChatActionUse({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      <ChatTextIcon className="size-5" />
      Chatten
    </Button>
  );
}
