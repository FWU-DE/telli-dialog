import { FloppyDiskIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';
import { useTranslations } from 'next-intl';

export function CustomChatActionSave({ onClick }: { onClick: () => void }) {
  const t = useTranslations('custom-chat');

  return (
    <Button variant="outline" onClick={onClick}>
      <FloppyDiskIcon className="size-5" />
      {t('save')}
    </Button>
  );
}
