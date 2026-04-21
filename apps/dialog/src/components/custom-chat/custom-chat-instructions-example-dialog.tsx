'use client';

import { ReactElement, useState } from 'react';
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
import { CaretRightIcon } from '@phosphor-icons/react';

type CustomChatInstructionsExampleDialogProps = {
  descriptionContent: ReactElement;
};

export function CustomChatInstructionsExampleDialog({
  descriptionContent,
}: CustomChatInstructionsExampleDialogProps) {
  const [open, setOpen] = useState(false);

  const t = useTranslations('custom-chat.instructions-example');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          type="button"
          className="text-sm font-medium h-auto p-0 leading-none gap-0 flex items-center"
          aria-label={t('button')}
        >
          {t('button')}
          <CaretRightIcon className="size-3.5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="overflow-hidden">
        <div className="min-h-0 overflow-y-auto">
          <DialogTitle className="mb-2">{t('title')}</DialogTitle>
          <DialogDescription asChild>{descriptionContent}</DialogDescription>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">{t('close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
