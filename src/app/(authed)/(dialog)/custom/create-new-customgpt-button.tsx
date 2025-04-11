'use client';

import { useRouter } from 'next/navigation';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { createNewCustomGptAction } from './actions';
import { useToast } from '@/components/common/toast';
import { cn } from '@/utils/tailwind';
import PlusIcon from '@/components/icons/plus';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';

export default function CreateNewCustomGptButton() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('custom-gpt');

  const { models } = useLlmModels();

  const maybeDefaultModelId =
    models.find((m) => m.name === DEFAULT_CHAT_MODEL)?.id ?? models[0]?.id;

  function handleNewGPT() {
    createNewCustomGptAction({ modelId: maybeDefaultModelId })
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
