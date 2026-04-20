import React from 'react';
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
} from '@ui/components/AlertDialog';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@ui/components/Button';

type DestructiveActionButtonProps = {
  triggerButtonVariant?: React.ComponentProps<typeof Button>['variant'];
  triggerButtonClassName?: string;
  children: React.ReactNode;
  modalTitle: string;
  modalDescription: string;
  confirmText?: string;
  actionFn: () => void;
} & React.ComponentProps<'button'>;

export default function DestructiveActionButton({
  triggerButtonVariant = 'outline',
  triggerButtonClassName,
  children,
  onClick,
  actionFn,
  modalTitle,
  modalDescription,
  confirmText,
  ...buttonProps
}: DestructiveActionButtonProps) {
  const queryClient = useQueryClient();
  const t = useTranslations('common');

  function refetchConversations() {
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={triggerButtonVariant}
          className={triggerButtonClassName}
          onClick={(event) => {
            event.stopPropagation();
            onClick?.(event);
          }}
          type="button"
          data-testid="custom-chat-delete-button"
          {...buttonProps}
        >
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{modalTitle}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>{modalDescription}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.stopPropagation();
              actionFn();
              refetchConversations();
            }}
            data-testid="custom-chat-confirm-button"
          >
            {confirmText ?? t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
