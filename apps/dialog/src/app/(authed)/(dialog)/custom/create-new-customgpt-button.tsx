'use client';

import { useToast } from '@/components/common/toast';
import PlusIcon from '@/components/icons/plus';
import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createNewAssistantAction } from './actions';

export default function CreateNewCustomGptButton({
  isNewUiDesignEnabled = false,
}: {
  isNewUiDesignEnabled?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('custom-gpt');

  async function handleNewGPT() {
    const createResult = await createNewAssistantAction({});
    if (createResult.success) {
      if (isNewUiDesignEnabled) {
        router.push(`/assistants/editor/${createResult.value.id}`);
      } else {
        router.push(`/custom/editor/${createResult.value.id}?create=true`);
      }
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
  }

  return (
    <button
      onClick={handleNewGPT}
      className={cn(buttonPrimaryClassName, 'flex gap-2 items-center group py-2')}
    >
      <PlusIcon className="fill-white w-8 h-8" />
      <span>{t('form.create-gpt')}</span>
    </button>
  );
}
