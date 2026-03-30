import { TrashSimpleIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import { customChatDeleteButtonClassName } from '@/utils/tailwind/button';

type CustomChatActionDeleteProps = {
  onClick: () => void;
  modalTitle?: string;
  modalDescription?: string;
  confirmText?: string;
  cancelText?: string;
  buttonText?: string;
};

export function CustomChatActionDelete({
  onClick,
  modalTitle,
  modalDescription,
  confirmText,
  cancelText,
  buttonText,
}: CustomChatActionDeleteProps) {
  const t = useTranslations('assistants');

  const resolvedModalTitle = modalTitle ?? t('delete-modal-title');
  const resolvedModalDescription = modalDescription ?? t('delete-modal-description');
  const resolvedConfirmText = confirmText ?? t('delete-modal-confirm-button');
  const resolvedCancelText = cancelText ?? t('delete-modal-cancel-button');
  const resolvedButtonText = buttonText ?? t('delete-button');

  return (
    <DestructiveActionButton
      triggerButtonClassName={customChatDeleteButtonClassName}
      modalTitle={resolvedModalTitle}
      modalDescription={resolvedModalDescription}
      confirmText={resolvedConfirmText}
      cancelText={resolvedCancelText}
      actionFn={onClick}
    >
      <TrashSimpleIcon className="size-5" />
      {resolvedButtonText}
    </DestructiveActionButton>
  );
}
