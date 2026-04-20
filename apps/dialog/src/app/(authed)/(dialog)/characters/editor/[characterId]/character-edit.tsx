'use client';

import z from 'zod';
import { CustomChatLayoutContainer } from '@/components/custom-chat/custom-chat-layout-container';
import { CustomChatTitle } from '@/components/custom-chat/custom-chat-title';
import { CharacterOptionalShareDataModel, FileModel } from '@shared/db/schema';
import { WebsearchSource } from '@shared/db/types';
import { useTranslations } from 'next-intl';
import { useForceReloadOnBrowserBackButton } from '@/hooks/use-force-reload-on-browser-back-button';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  deleteCharacterAction,
  deleteFileMappingAndEntityAction,
  downloadFileFromCharacterAction,
  linkFileToCharacterAction,
  shareCharacterAction,
  unshareCharacterAction,
  updateCharacterAccessLevelAction,
  updateCharacterAction,
  uploadAvatarPictureForCharacterAction,
} from './actions';
import { useFormAutosave } from '@/hooks/use-form-autosave';
import { usePendingChangesGuard } from '@/hooks/use-pending-changes-guard';
import { BackButton } from '@/components/common/back-button';
import { CustomChatActions } from '@/components/custom-chat/custom-chat-actions';
import { CustomChatActionUse } from '@/components/custom-chat/custom-chat-action-use';
import { CustomChatActionDelete } from '@/components/custom-chat/custom-chat-action-delete';
import { CustomChatActionDuplicate } from '@/components/custom-chat/custom-chat-action-duplicate';
import { CustomChatActionSave } from '@/components/custom-chat/custom-chat-action-save';
import { CustomChatFormState } from '@/components/custom-chat/custom-chat-form-state';
import { CustomChatShareInfo } from '@/components/custom-chat/custom-chat-share-info';
import { CustomChatShareWithLearners } from '@/components/custom-chat/custom-chat-share-with-learners';
import {
  telliPointsPercentageValues,
  usageTimeValuesInMinutes,
} from '../../../learning-scenarios/editor/[learningScenarioId]/schema';
import { CustomChatHeading2 } from '@/components/custom-chat/custom-chat-heading2';
import { CustomChatImageUpload } from '@/components/custom-chat/custom-chat-image-upload';
import { FieldGroup } from '@ui/components/Field';
import { Card, CardContent } from '@ui/components/Card';
import {
  SMALL_TEXT_INPUT_FIELDS_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
} from '@/configuration-text-inputs/const';
import { useToast } from '@/components/common/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef } from 'react';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';
import { useForm, useWatch } from 'react-hook-form';
import { CustomChatModelSelect } from '@/components/custom-chat/custom-chat-model-select';
import { CustomChatFilesAndLinks } from '@/components/custom-chat/custom-chat-files-and-links';
import CustomShareSection from '@/components/custom-chat/custom-chat-share-section';
import { FormField } from '@ui/components/form/FormField';
import { createNewCharacterAction } from '../../actions';
import { CustomChatInstructionsExampleDialog } from '@/components/custom-chat/custom-chat-instructions-example-dialog';
import RichText from '@/components/common/rich-text';

type CharacterTranslator = ReturnType<typeof useTranslations<'characters'>>;

function createCharacterFieldValidationConfig(t: CharacterTranslator) {
  return {
    name: {
      required: true,
      maxLength: SMALL_TEXT_INPUT_FIELDS_LIMIT,
      maxLengthErrorMessage: t('name-max-length', {
        maxLength: SMALL_TEXT_INPUT_FIELDS_LIMIT,
      }),
    },
    description: {
      maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT,
      maxLengthErrorMessage: t('description-max-length', {
        maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT,
      }),
    },
    instructions: {
      maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
      maxLengthErrorMessage: t('instructions-max-length', {
        maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
      }),
    },
    initialMessage: {
      maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT,
      maxLengthErrorMessage: t('initial-message-max-length', {
        maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT,
      }),
    },
  };
}

function createCharacterFormValuesSchema(t: CharacterTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('name-required')),
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
  character: CharacterOptionalShareDataModel;
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
    setValue,
    formState: { isDirty },
  } = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormValuesSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const { isSaving, hasSaveError, flushAutoSave, handleAutoSave } =
    useFormAutosave<CharacterFormValues>({
      initialValues,
      isDirty,
      getValues,
      reset: (values) => {
        reset({ ...values, name: values.name.trim() });
      },
      validate: trigger,
      saveValues: async (data) => {
        // accessLevel is handled separately in handleSharingChange
        // attachedLinks are handled separately in handleLinksChange
        const updateResult = await updateCharacterAction({
          id: character.id,
          name: data.name.trim(),
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
  const isSchoolShared = useWatch({ control, name: 'isSchoolShared' });
  const hasLinkAccess = useWatch({ control, name: 'hasLinkAccess' });
  const showShareInfo = isSchoolShared || hasLinkAccess;

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

  const handleDuplicateCharacter = async () => {
    const createResult = await createNewCharacterAction({
      templateId: character.id,
      duplicateCharacterName: t('duplicate-name-format-string', {
        sourceName: name,
      }),
    });
    if (createResult.success) {
      guardNavigation(() => {
        router.push(`/characters/editor/${createResult.value.id}?create=true`);
      });
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
  };

  const handleDeleteCharacter = async () => {
    const deleteResult = await deleteCharacterAction({ characterId: character.id });
    if (deleteResult.success) {
      toast.success(t('toasts.delete-toast-success'));
    }
    if (!deleteResult.success) {
      toast.error(t('toasts.delete-toast-error'));
    }
    guardNavigation(() => {
      router.push('/characters');
    });
  };

  const handleFileUploaded = async (data: { id: string; name: string; file: File }) => {
    const linkResult = await linkFileToCharacterAction({
      fileId: data.id,
      characterId: character.id,
    });

    if (!linkResult.success) {
      toast.error(t('toasts.file-link-error'));
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    return await deleteFileMappingAndEntityAction({
      characterId: character.id,
      fileId,
    });
  };

  const handleDownloadFile = async (fileId: string) => {
    return await downloadFileFromCharacterAction({ characterId: character.id, fileId });
  };

  const handleLinksChange = async (links: string[]) => {
    return await updateCharacterAction({ id: character.id, attachedLinks: links });
  };

  async function handleUploadPicture(croppedImageBlob: Blob) {
    const result = await uploadAvatarPictureForCharacterAction({
      characterId: character.id,
      croppedImageBlob,
    });

    if (result.success) {
      toast.success(t('toasts.edit-toast-success'));
    }

    return result;
  }

  const handleSharingChange = async ({ name, checked }: { name: string; checked: boolean }) => {
    if (name === 'isSchoolShared') {
      const newAccessLevel = checked ? 'school' : 'private';

      if (newAccessLevel !== savedAccessLevelRef.current) {
        const result = await updateCharacterAccessLevelAction({
          characterId: character.id,
          accessLevel: newAccessLevel,
        });

        if (!result.success) {
          toast.error(t('toasts.edit-toast-error'));
          return;
        }

        savedAccessLevelRef.current = newAccessLevel;
      }
    }

    await flushAutoSave();
  };

  const actionButtons = (
    <CustomChatActions>
      <CustomChatActionUse onClick={handleUseChat} />
      <CustomChatActionDuplicate onClick={handleDuplicateCharacter} />
      <CustomChatActionDelete
        onClick={handleDeleteCharacter}
        modalTitle={t('delete-modal-title')}
        modalDescription={t('delete-modal-description')}
      />
      <CustomChatActionSave onClick={handleAutoSave} />
    </CustomChatActions>
  );

  return (
    <CustomChatLayoutContainer>
      <BackButton
        href="/characters"
        text={t('back-button')}
        aria-label={t('back-button-aria-label')}
        onClick={() => {
          guardNavigation(() => {
            router.push('/characters');
          });
        }}
      />
      <CustomChatTitle title={name} />
      <div className="flex flex-row justify-between">
        {actionButtons}
        <CustomChatFormState
          isDirty={isDirty}
          isSubmitting={isSaving}
          hasSaveError={hasSaveError}
        />
      </div>
      {showShareInfo && (
        <CustomChatShareInfo
          href="#share-settings"
          info={t('sharing-info')}
          linkText={t('sharing-settings')}
        />
      )}

      <CustomChatShareWithLearners
        startedAt={character.startedAt ?? null}
        maxUsageTimeLimit={character.maxUsageTimeLimit ?? null}
        pointsPercentageValues={telliPointsPercentageValues}
        usageTimeValues={usageTimeValuesInMinutes}
        onShare={async (data) => {
          const result = await shareCharacterAction({
            id: character.id,
            telliPointsPercentageLimit: data.telliPointsPercentageLimit,
            usageTimeLimit: data.usageTimeLimit,
          });
          return result;
        }}
        onUnshare={async () => {
          const result = await unshareCharacterAction({
            characterId: character.id,
          });
          return result;
        }}
        shareUILink={`/characters/editor/${character.id}/share`}
        sharingDisabled={!name || name.trim().length === 0}
      />

      <div className="flex flex-col gap-3">
        <CustomChatHeading2 text={t('configuration-heading')} />

        <CustomChatImageUpload
          avatarPictureUrl={avatarPictureUrl}
          onUploadPicture={handleUploadPicture}
        />
      </div>

      <form
        id="character-edit-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleAutoSave();
        }}
      >
        <Card>
          <CardContent>
            <FieldGroup>
              <FormField
                name="name"
                control={control}
                {...createCharacterFieldValidationConfig(t).name}
                label={t('name-label')}
                placeholder={t('name-placeholder')}
                autoFocusWhenEmpty
                testId="character-name-input"
                onBlur={handleAutoSave}
              />
              <FormField
                name="description"
                control={control}
                {...createCharacterFieldValidationConfig(t).description}
                label={t('description-label')}
                placeholder={t('description-placeholder')}
                testId="character-description-input"
                onBlur={handleAutoSave}
                type="textArea"
                className="h-27 resize-none"
              />
              <CustomChatModelSelect
                models={models}
                selectedModelId={selectedModelId ?? undefined}
                onValueChange={(value) => {
                  setValue('modelId', value, { shouldDirty: true });
                  handleAutoSave();
                }}
              />
              <FormField
                name="instructions"
                control={control}
                {...createCharacterFieldValidationConfig(t).instructions}
                label={t('instructions-label')}
                labelAction={
                  <CustomChatInstructionsExampleDialog
                    descriptionContent={
                      <div className="whitespace-pre-line">
                        <RichText>{(tags) => t.rich('instructions-placeholder', tags)}</RichText>
                      </div>
                    }
                  />
                }
                placeholder={t
                  .raw('instructions-placeholder')
                  .replaceAll('<b>', '')
                  .replaceAll('</b>', '')}
                testId="character-instructions-input"
                onBlur={handleAutoSave}
                type="textArea"
                className="h-125"
              />
              <FormField
                name="initialMessage"
                control={control}
                {...createCharacterFieldValidationConfig(t).initialMessage}
                label={t('initial-message-label')}
                tooltip={t('initial-message-tooltip')}
                placeholder={t('initial-message-placeholder')}
                testId="character-initial-message-input"
                onBlur={handleAutoSave}
                type="textArea"
                className="h-27 resize-none"
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <CustomChatFilesAndLinks
          initialFiles={relatedFiles}
          onFileUploaded={handleFileUploaded}
          onDeleteFile={handleDeleteFile}
          initialLinks={initialLinks}
          onLinksChange={handleLinksChange}
          onDownloadFile={handleDownloadFile}
        />

        <CustomShareSection
          control={control}
          schoolSharingName="isSchoolShared"
          linkSharingName="hasLinkAccess"
          linkToShare={`/characters/${character.id}`}
          onShareChange={handleSharingChange}
        />
      </form>

      <div className="flex flex-row justify-between">
        {actionButtons}
        <CustomChatFormState
          isDirty={isDirty}
          isSubmitting={isSaving}
          hasSaveError={hasSaveError}
        />
      </div>
    </CustomChatLayoutContainer>
  );
}
