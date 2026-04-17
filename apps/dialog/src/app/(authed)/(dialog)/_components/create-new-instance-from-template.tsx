/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { ServerActionResult } from '@shared/actions/server-action-result';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';
import React, { useState } from 'react';

export function CreateNewInstanceFromTemplate({
  templateId,
  children,
  className,
  redirectPath,
  disabled,
  createInstanceCallbackAction,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  templateId: string;
  redirectPath: 'characters' | 'custom' | 'learning-scenarios';
  disabled?: boolean;
  createInstanceCallbackAction: ({
    modelId,
    templateId,
  }: {
    modelId?: string;
    templateId: string;
  }) => Promise<ServerActionResult<{ id: string }>>;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('characters');

  const { models } = useLlmModels();
  const [isLoading, setIsLoading] = useState(false);

  const maybeDefaultModelId = getDefaultModel(models)?.id;

  async function handleNewInstance(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const urlSearchParams = new URLSearchParams({
        create: 'true',
        templateId,
      });

      const createResult = await createInstanceCallbackAction({
        modelId: maybeDefaultModelId,
        templateId,
      });
      if (createResult.success) {
        router.push(
          `/${redirectPath}/editor/${createResult.value.id}?${urlSearchParams.toString()}`,
        );
      } else {
        toast.error(t('toasts.create-toast-error'));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      {...props}
      onClick={!disabled && !isLoading ? handleNewInstance : undefined}
      className={className}
    >
      {children}
    </div>
  );
}
