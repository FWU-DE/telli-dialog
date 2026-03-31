import { CopyIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';
import { useTranslations } from 'next-intl';

export function CustomChatActionDuplicate({ onClick }: { onClick: () => void }) {
  const t = useTranslations('custom-chat');

  return (
    <Button variant="outline" onClick={onClick}>
      <CopyIcon className="size-5" />
      {t('duplicate')}
    </Button>
  );
}
