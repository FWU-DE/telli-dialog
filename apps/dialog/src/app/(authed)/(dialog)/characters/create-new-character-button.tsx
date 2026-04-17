'use client';

import { useRouter } from 'next/navigation';
import { createNewCharacterAction } from './actions';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';
import { Button } from '@ui/components/Button';
import { PlusIcon } from '@phosphor-icons/react';

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
    <Button type="button" onClick={handleNewCharacter}>
      <PlusIcon className="size-5" />
      {t('form.create-character')}
    </Button>
  );
}
