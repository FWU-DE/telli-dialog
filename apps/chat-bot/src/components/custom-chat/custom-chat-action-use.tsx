import { ChatTextIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';
import { useTranslations } from 'next-intl';

export function CustomChatActionUse({ onClick }: { onClick: () => void }) {
  const t = useTranslations('custom-chat');

  return (
    <Button variant="outline" onClick={onClick}>
      <ChatTextIcon className="size-5" />
      {t('chat')}
    </Button>
  );
}
