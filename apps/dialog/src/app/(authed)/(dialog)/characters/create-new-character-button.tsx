'use client';

import { useRouter } from 'next/navigation';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { createNewCharacterAction } from './actions';
import { useToast } from '@/components/common/toast';
import { cn } from '@/utils/tailwind';
import PlusIcon from '@/components/icons/plus';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { ServerActionResult } from '@shared/actions/server-action-result';
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
  }) => Promise<ServerActionResult<{ id: string }>>;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('characters');

  const { models } = useLlmModels();

  const maybeDefaultModelId = getDefaultModel(models)?.id;

  async function handleNewGPT() {
    const urlSearchParams = new URLSearchParams({
      create: 'true',
      templateId,
    });

    const createResult = await createInstanceCallback({
      modelId: maybeDefaultModelId,
      templatePictureId,
      templateId,
    });
    if (createResult.success) {
      router.push(`/${redirectPath}/editor/${createResult.value.id}?${urlSearchParams.toString()}`);
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
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
