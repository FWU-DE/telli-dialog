'use client';

import { useRouter } from 'next/navigation';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { createNewCharacterAction } from './actions';
import { useToast } from '@/components/common/toast';
import { cn } from '@/utils/tailwind';
import PlusIcon from '@/components/icons/plus';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '@/components/providers/llm-model-provider';

export default function CreateNewCharacterButton() {
  const router = useRouter();
  const toast = useToast();

  const t = useTranslations('characters.form');

  const { selectedModel } = useLlmModels();

  function handleNewGPT() {
    createNewCharacterAction({ modelId: selectedModel?.id })
      .then((newCharacter) => {
        router.push(`/characters/editor/${newCharacter.id}?create=true`);
      })
      .catch(() => {
        toast.error(t('toast-error'));
      });
  }

  return (
    <button
      onClick={handleNewGPT}
      className={cn(buttonPrimaryClassName, 'flex gap-2 items-center group py-2')}
    >
      <PlusIcon className="fill-primary-text w-3 h-3 group-hover:fill-secondary-text" />
      <span>{t('create-character')}</span>
    </button>
  );
}
