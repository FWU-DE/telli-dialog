'use client';

import { useRouter } from 'next/navigation';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { createNewCharacterAction } from './actions';
import { useToast } from '@/components/common/toast';
import { cn } from '@/utils/tailwind';
import PlusIcon from '@/components/icons/plus';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';

export function CreateNewCharacterFromTemplate({
  templateId,
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  templateId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('characters');

  const { models } = useLlmModels();

  const maybeDefaultModelId =
    models.find((m) => m.name === DEFAULT_CHAT_MODEL)?.id ?? models[0]?.id;

  function handleNewGPT() {
    createNewCharacterAction({ modelId: maybeDefaultModelId })
      .then((newCharacter) => {
        router.push(`/characters/editor/${newCharacter.id}?create=true&templateId=${templateId}`);
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

export function CreateNewCharacterButton() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('characters');

  const { models } = useLlmModels();

  const maybeDefaultModelId =
    models.find((m) => m.name === DEFAULT_CHAT_MODEL)?.id ?? models[0]?.id;

  function handleNewGPT() {
    createNewCharacterAction({ modelId: maybeDefaultModelId })
      .then((newCharacter) => {
        router.push(`/characters/editor/${newCharacter.id}?create=true`);
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
      <span>{t('form.create-character')}</span>
    </button>
  );
}
