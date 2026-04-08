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

type DestructiveActionButtonProps = {
  triggerButtonClassName?: string;
  children: React.ReactNode;
  modalTitle: string;
  modalDescription: string;
  confirmText?: string;
  actionFn: () => void;
} & React.ComponentProps<'button'>;

export default function DestructiveActionButton({
  triggerButtonClassName,
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <button
          id="destructive-button"
          className={triggerButtonClassName}
          type="button"
          data-testid="custom-chat-delete-button"
          {...buttonProps}
        >
          {children}
        </button>
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
