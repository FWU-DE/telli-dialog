import { TrashSimpleIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';
import { useTranslations } from 'next-intl';

export function CustomChatActionDelete({ onClick }: { onClick: () => void }) {
  const t = useTranslations('custom-chat');

  return (
    <Button variant="outline" onClick={onClick}>
      <TrashSimpleIcon className="size-5" />
      {t('delete')}
    </Button>
  );
}
