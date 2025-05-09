'use client';

import { useToast } from '@/components/common/toast';
import PlusIcon from '@/components/icons/plus';
import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createNewCustomGptAction } from './actions';

export default function CreateNewCustomGptButton() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('custom-gpt');

  function handleNewGPT() {
    createNewCustomGptAction()
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
      <PlusIcon className="fill-white group-hover:fill-secondary-text" />
      <span>{t('form.create-gpt')}</span>
    </button>
  );
}
