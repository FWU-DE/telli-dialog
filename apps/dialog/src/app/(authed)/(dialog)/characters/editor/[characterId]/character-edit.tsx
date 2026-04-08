'use client';

import z from 'zod';
import { CustomChatLayoutContainer } from '@/components/custom-chat/custom-chat-layout-container';
import { CustomChatTitle } from '@/components/custom-chat/custom-chat-title';
import { CharacterWithShareDataModel, FileModel } from '@shared/db/schema';
import { WebsearchSource } from '@shared/db/types';
import { useTranslations } from 'next-intl';
import { useForceReloadOnBrowserBackButton } from '@/hooks/use-force-reload-on-browser-back-button';
import { useToast } from '@/components/common/toast';
import { useRouter } from 'next/dist/client/components/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod/dist/zod.js';
import { updateCharacterAction } from './actions';
import { useFormAutosave } from '@/hooks/use-form-autosave';
import { usePendingChangesGuard } from '@/hooks/use-pending-changes-guard';

type CharacterTranslator = ReturnType<typeof useTranslations<'characters'>>;

function createCharacterFormValuesSchema(t: CharacterTranslator) {
  return z.object({
    name: z.string().min(1, t('name-required')),
    description: z.string(),
    instructions: z.string(),
    initialMessage: z.string(),
    modelId: z.string(),
    isSchoolShared: z.boolean(),
    hasLinkAccess: z.boolean(),
  });
}

export type CharacterFormValues = z.infer<ReturnType<typeof createCharacterFormValuesSchema>>;

export function CharacterEdit({
  character,
  relatedFiles,
  initialLinks,
  avatarPictureUrl,
}: {
  character: CharacterWithShareDataModel;
  relatedFiles: FileModel[];
  initialLinks: WebsearchSource[];
  avatarPictureUrl?: string;
}) {
  useForceReloadOnBrowserBackButton();
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('characters');
  const characterFormValuesSchema = useMemo(() => createCharacterFormValuesSchema(t), [t]);

  const { models } = useLlmModels();
  const maybeDefaultModelId = getDefaultModel(models)?.id;
  const isModelAvailable = character.modelId && models.some((m) => m.id === character.modelId);
  const selectedModelId = isModelAvailable ? character.modelId : maybeDefaultModelId;

  const initialValues: CharacterFormValues = {
    name: character.name,
    description: character.description ?? '',
    instructions: character.instructions ?? '',
    initialMessage: character.initialMessage ?? '',
    modelId: selectedModelId ?? '',
    isSchoolShared: character.accessLevel === 'school',
    hasLinkAccess: character.hasLinkAccess,
  };

  const {
    control,
    trigger,
    getValues,
    reset,
    formState: { isDirty },
  } = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormValuesSchema),
    defaultValues: initialValues,
  });

  const { isSaving, hasSaveError, flushAutoSave, handleAutoSave } =
    useFormAutosave<CharacterFormValues>({
      initialValues,
      isDirty,
      getValues,
      reset: (values) => {
        reset(values);
      },
      validate: trigger,
      saveValues: async (data) => {
        // accessLevel is handled separately in handleSharingChange
        // attachedLinks are handled separately in handleLinksChange
        const updateResult = await updateCharacterAction({
          id: character.id,
          name: data.name,
          description: data.description,
          instructions: data.instructions,
          initialMessage: data.initialMessage,
          modelId: data.modelId,
          hasLinkAccess: data.hasLinkAccess,
        });

        return updateResult.success;
      },
    });

  const name = useWatch({ control, name: 'name' });
  const savedAccessLevelRef = useRef(character.accessLevel);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isSchoolShared = useWatch({ control, name: 'isSchoolShared' });
  const hasLinkAccess = useWatch({ control, name: 'hasLinkAccess' });
  const showShareInfo = isSchoolShared || hasLinkAccess;

  useEffect(() => {
    if (!name || name.trim().length === 0) {
      nameInputRef.current?.focus();
    }
  }, [name]);

  const saveBeforeLeave = useCallback(async (): Promise<void> => {
    if (!isDirty) {
      return;
    }

    await flushAutoSave();
  }, [flushAutoSave, isDirty]);

  const { guardNavigation } = usePendingChangesGuard({
    hasPendingChanges: isDirty,
    onBeforePageLeave: saveBeforeLeave,
  });

  const handleUseChat = () => {
    guardNavigation(() => {
      router.push(`/characters/d/${character.id}/`);
    });
  };

  // TODO handleDuplicateAssistant
  // TODO handleDeleteAssistant

  return (
    <CustomChatLayoutContainer>
      <CustomChatTitle title={'test'} />
    </CustomChatLayoutContainer>
  );
}
