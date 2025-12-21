'use client';

import { useRouter } from 'next/navigation';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { createNewCharacterAction } from './actions';
import { useToast } from '@/components/common/toast';
import { cn } from '@/utils/tailwind';
import PlusIcon from '@/components/icons/plus';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';

export function CreateNewCharacterButton() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('characters');

  const { models } = useLlmModels();

  const maybeDefaultModelId = getDefaultModel(models)?.id;

  async function handleNewCharacter() {
    const createResult = await createNewCharacterAction({ modelId: maybeDefaultModelId });
    if (createResult.success) {
      router.push(`/characters/editor/${createResult.value.id}?create=true`);
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
  }

  return (
    <button
      onClick={handleNewCharacter}
      className={cn(buttonPrimaryClassName, 'flex gap-2 items-center group py-2')}
    >
      <PlusIcon className="fill-button-primary-text group-hover:fill-secondary-text w-8 h-8" />
      <span>{t('form.create-character')}</span>
    </button>
  );
}
