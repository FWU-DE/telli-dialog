'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@telli/ui/components/AlertDialog';

type ConfirmationDialogProps = {
  trigger: React.ReactElement;
  title: React.ReactNode;
  content?: React.ReactNode;
  confirmLabel: React.ReactNode;
  cancelLabel?: React.ReactNode;
  confirmTestId?: string;
  cancelTestId?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
};

export function ConfirmationDialog({
  trigger,
  title,
  content,
  confirmLabel,
  cancelLabel,
  confirmTestId,
  cancelTestId,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const t = useTranslations('common');

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true);
    }
  }, []);

  const handleCancel = React.useCallback(() => {
    onCancel?.();
    setOpen(false);
  }, [onCancel]);

  const handleConfirm = React.useCallback(async () => {
    setIsConfirming(true);

    try {
      await onConfirm();
    } finally {
      // close dialog in any case, even if onConfirm throws an error
      setIsConfirming(false);
      setOpen(false);
    }
  }, [onConfirm]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
        </AlertDialogHeader>
        {content !== undefined && <div className="overflow-y-auto">{content}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel
            data-testid={cancelTestId}
            disabled={isConfirming}
            onClick={handleCancel}
          >
            {cancelLabel ?? t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid={confirmTestId}
            disabled={isConfirming}
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
