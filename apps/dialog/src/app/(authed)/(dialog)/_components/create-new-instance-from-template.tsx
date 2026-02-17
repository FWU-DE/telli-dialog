'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { ServerActionResult } from '@shared/actions/server-action-result';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';

export function CreateNewInstanceFromTemplate({
  templateId,
  children,
  className,
  templatePictureId,
  redirectPath,
  disabled,
  createInstanceCallbackAction,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  templateId: string;
  templatePictureId?: string;
  redirectPath: 'characters' | 'custom' | 'learning-scenarios';
  disabled?: boolean;
  createInstanceCallbackAction: ({
    modelId,
    templatePictureId,
    templateId,
  }: {
    modelId?: string;
    templatePictureId?: string;
    templateId: string;
  }) => Promise<ServerActionResult<{ id: string }>>;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('characters');

  const { models } = useLlmModels();

  const maybeDefaultModelId = getDefaultModel(models)?.id;

  async function handleNewInstance() {
    const urlSearchParams = new URLSearchParams({
      create: 'true',
      templateId,
    });

    const createResult = await createInstanceCallbackAction({
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
    <div {...props} onClick={!disabled ? handleNewInstance : undefined} className={className}>
      {children}
    </div>
  );
}
