import { useState } from 'react';
import { CopyIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ui/components/Dialog';
import { useTranslations } from 'next-intl';

export function CustomChatActionDuplicate({ onClick }: { onClick: () => void }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('custom-chat');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        data-testid="custom-chat-duplicate-button"
      >
        <CopyIcon className="size-5" />
        {t('duplicate')}
      </Button>
      <DialogContent>
        <DialogTitle>{t('duplicate-dialog.title')}</DialogTitle>
        <DialogDescription>{t('duplicate-dialog.description')}</DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              {t('duplicate-dialog.cancel')}
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={() => {
              onClick();
              setOpen(false);
            }}
            data-testid="custom-chat-confirm-button"
          >
            {t('duplicate-dialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
