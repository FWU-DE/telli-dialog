'use client';

import { useToast } from '@/components/common/toast';
import PlusIcon from '@/components/icons/plus';
import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createNewCustomGptAction } from './actions';

export function CreateNewCustomGptFromTemplate({
  templateId,
  children,
  className,
  templatePictureId,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  templateId: string;
  templatePictureId?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('custom-gpt');

  function handleNewGPT() {
    const urlSearchParams = new URLSearchParams({
      create: 'true',
      templateId,
    });
    createNewCustomGptAction({ templatePictureId })
      .then((newGpt) => {
        router.push(`/custom/editor/${newGpt.id}?${urlSearchParams.toString()}`);
      })
      .catch(() => {
        toast.error(t('toasts.create-toast-error'));
      });
  }

  return (
    <div {...props} onClick={handleNewGPT} className={className}>
      {children}
    </div>
  );
}

export default function CreateNewCustomGptButton() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('custom-gpt');

  function handleNewGPT() {
    createNewCustomGptAction({ templatePictureId: undefined })
      .then((newGpt) => {
        router.push(`/custom/editor/${newGpt.id}?create=true`);
      })
      .catch(() => {
        toast.error(t('toasts.create-toast-error'));
      });
  }

  return (
    <button
      onClick={handleNewGPT}
      className={cn(buttonPrimaryClassName, 'flex gap-2 items-center group py-2')}
    >
      <PlusIcon className="fill-primary-text w-3 h-3 group-hover:fill-secondary-text" />
      <span>{t('form.create-gpt')}</span>
    </button>
  );
}
