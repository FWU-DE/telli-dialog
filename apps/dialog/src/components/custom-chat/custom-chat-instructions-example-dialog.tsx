'use client';

import { ReactNode, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@ui/components/Dialog';
import { Button } from '@ui/components/Button';
import { useTranslations } from 'next-intl';

type CustomChatInstructionsExampleDialogProps = {
  descriptionContent: ReactNode;
};

export function CustomChatInstructionsExampleDialog({
  descriptionContent,
}: CustomChatInstructionsExampleDialogProps) {
  const [open, setOpen] = useState(false);

  const t = useTranslations('custom-chat.instructions-example');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-sm font-medium h-auto" aria-label={t('button')}>
          {t('button')}
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription asChild>{descriptionContent}</DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button>{t('close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
