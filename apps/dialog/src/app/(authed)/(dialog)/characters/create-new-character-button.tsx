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

export function CreateNewCharacterFromTemplate({
  templateId,
  children,
  className,
  templatePictureId,
  redirectPath,
  createInstanceCallback,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  templateId: string;
  templatePictureId?: string;
  redirectPath: 'characters' | 'custom';
  createInstanceCallback: ({
    modelId,
    templatePictureId,
    templateId,
  }: {
    modelId?: string;
    templatePictureId?: string;
    templateId?: string;
  }) => Promise<{ id: string }>;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('characters');

  const { models } = useLlmModels();

  const maybeDefaultModelId = getDefaultModel(models)?.id;

  function handleNewGPT() {
    const urlSearchParams = new URLSearchParams({
      create: 'true',
      templateId,
    });

    createInstanceCallback({ modelId: maybeDefaultModelId, templatePictureId, templateId })
      .then((newInstance) => {
        router.push(`/${redirectPath}/editor/${newInstance.id}?${urlSearchParams.toString()}`);
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

  const maybeDefaultModelId = getDefaultModel(models)?.id;

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
      <PlusIcon className="fill-button-primary-text group-hover:fill-secondary-text w-8 h-8" />
      <span>{t('form.create-character')}</span>
    </button>
  );
}
