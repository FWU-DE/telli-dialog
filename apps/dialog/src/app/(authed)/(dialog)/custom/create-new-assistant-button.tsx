'use client';

import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createNewAssistantAction } from './actions';
import { Button } from '@ui/components/Button';
import { PlusIcon } from '@phosphor-icons/react';

export default function CreateNewAssistantButton({
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
    <Button type="button" onClick={handleNewGPT}>
      <PlusIcon className="size-5" />
      {t('form.create-gpt')}
    </Button>
  );
}
