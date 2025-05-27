import { cn } from '@/utils/tailwind';
import { buttonDeleteClassName, buttonSecondaryClassName } from '@/utils/tailwind/button';
import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/use-theme';
import { constructRootLayoutStyle } from '@/utils/tailwind/layout';

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
  const [isOpen, setIsOpen] = React.useState(false);

  const queryClient = useQueryClient();

  function refetchConversations() {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }
  const { designConfiguration } = useTheme();
  return (
    <AlertDialog.Root open={isOpen}>
      <AlertDialog.Trigger asChild>
        <button
          id="destructive-button"
          className={triggerButtonClassName}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            setIsOpen(true);
          }}
          type="button"
          {...buttonProps}
        >
          {children}
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-[#333333] z-30 opacity-30 shadow-[0px_0px_80px_0px_rgba(0,41,102,0.1)]" />
        <AlertDialog.Content
          className="z-50 fixed left-1/2 top-1/2 max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-enterprise-md bg-white p-10 w-[350px] lg:w-[564px] max-w-xl"
          style={constructRootLayoutStyle({ designConfiguration })}
        >
          <AlertDialog.Title asChild>
            <h1 className="text-3xl font-medium">{modalTitle}</h1>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <p className="mt-8 w-full">{modalDescription}</p>
          </AlertDialog.Description>
          <div className="flex flex-wrap justify-end items-center gap-6 mt-10">
            <button
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                setIsOpen(false);
              }}
              className={cn(buttonSecondaryClassName, 'max-lg:w-full')}
              type="button"
            >
              Abbrechen
            </button>
            <AlertDialog.Action asChild>
              <button
                className={cn(buttonDeleteClassName, 'max-lg:w-full')}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  actionFn();
                  setIsOpen(false);
                  refetchConversations();
                }}
              >
                {confirmText ?? 'Löschen'}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
