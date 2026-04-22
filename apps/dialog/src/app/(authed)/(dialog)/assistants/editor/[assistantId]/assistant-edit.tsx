'use client';

import {
  NUMBER_OF_EXAMPLE_PROMPTS_LIMIT,
  SMALL_TEXT_INPUT_FIELDS_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
} from '@/configuration-text-inputs/const';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssistantSelectModel, FileModel } from '@shared/db/schema';
import { BackButton } from '@/components/common/back-button';
import { Card, CardContent } from '@ui/components/Card';
import { FieldGroup } from '@ui/components/Field';
import { FormField } from '@ui/components/form/FormField';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { useCallback, useMemo, useRef } from 'react';
import z from 'zod';
import { CustomChatLayoutContainer } from '@/components/custom-chat/custom-chat-layout-container';
import { CustomChatTitle } from '@/components/custom-chat/custom-chat-title';
import { CustomChatActions } from '@/components/custom-chat/custom-chat-actions';
import { CustomChatActionUse } from '@/components/custom-chat/custom-chat-action-use';
import { CustomChatActionDuplicate } from '@/components/custom-chat/custom-chat-action-duplicate';
import { CustomChatActionDelete } from '@/components/custom-chat/custom-chat-action-delete';
import { CustomChatFormState } from '@/components/custom-chat/custom-chat-form-state';
import {
  createNewAssistantAction,
  deleteAssistantAction,
  deleteFileMappingAndEntityAction,
  downloadFileFromAssistantAction,
  linkFileToAssistantAction,
  updateAssistantAccessLevelAction,
  updateAssistantAction,
  uploadAvatarPictureForAssistantAction,
} from '../../actions';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { CustomChatShareInfo } from '@/components/custom-chat/custom-chat-share-info';
import { CustomChatImageUpload } from '@/components/custom-chat/custom-chat-image-upload';
import { usePendingChangesGuard } from '@/hooks/use-pending-changes-guard';
import { useForceReloadOnBrowserBackButton } from '@/hooks/use-force-reload-on-browser-back-button';
import { useFormAutosave } from '@/hooks/use-form-autosave';
import { CustomChatFilesAndLinks } from '@/components/custom-chat/custom-chat-files-and-links';
import { WebsearchSource } from '@shared/db/types';
import CustomShareSection from '@/components/custom-chat/custom-chat-share-section';
import { CustomChatPromptSuggestions } from '@/components/custom-chat/custom-chat-prompt-suggestions';
import { CustomChatInstructionsExampleDialog } from '@/components/custom-chat/custom-chat-instructions-example-dialog';
import { RichText, stripRichTextTags } from '@/components/common/rich-text';
import { CustomChatHeaderContent } from '@/components/custom-chat/custom-chat-header-content';
import { useElementVisibility } from '@/hooks/use-element-visibility';

type AssistantTranslator = ReturnType<typeof useTranslations<'assistants'>>;

/**
 * Creates field validation configuration with pre-translated error messages.
 * Called inside the component where the translation function is available.
 */
function createAssistantFieldValidationConfig(t: AssistantTranslator) {
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
  } as const;
}

function createAssistantFormValuesSchema(t: AssistantTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('name-required')).max(SMALL_TEXT_INPUT_FIELDS_LIMIT),
    description: z.string(),
    instructions: z.string(),
    isSchoolShared: z.boolean(),
    hasLinkAccess: z.boolean(),
    promptSuggestions: z
      .array(
        z.object({
          value: z.string(),
        }),
      )
      .max(
        NUMBER_OF_EXAMPLE_PROMPTS_LIMIT,
        t('prompt-suggestions-max-count', { maxCount: NUMBER_OF_EXAMPLE_PROMPTS_LIMIT }),
      ),
  });
}

export type AssistantFormValues = z.infer<ReturnType<typeof createAssistantFormValuesSchema>>;

export function AssistantEdit({
  assistant,
  relatedFiles,
  initialLinks,
  avatarPictureUrl,
}: {
  assistant: AssistantSelectModel;
  relatedFiles: FileModel[];
  initialLinks: WebsearchSource[];
  avatarPictureUrl?: string;
}) {
  useForceReloadOnBrowserBackButton();
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('assistants');
  const assistantFormValuesSchema = useMemo(() => createAssistantFormValuesSchema(t), [t]);
  const assistantFieldValidationConfig = useMemo(
    () => createAssistantFieldValidationConfig(t),
    [t],
  );
  const initialValues: AssistantFormValues = {
    name: assistant.name,
    description: assistant.description ?? '',
    instructions: assistant.instructions ?? '',
    isSchoolShared: assistant.accessLevel === 'school',
    hasLinkAccess: assistant.hasLinkAccess,
    promptSuggestions:
      assistant.promptSuggestions && assistant.promptSuggestions.length > 0
        ? assistant.promptSuggestions.map((s) => ({ value: s }))
        : [{ value: '' }],
  };

  const {
    control,
    trigger,
    getValues,
    reset,
    formState: { isDirty },
  } = useForm<AssistantFormValues>({
    resolver: zodResolver(assistantFormValuesSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const { isSaving, hasSaveError, flushAutoSave, handleAutoSave } =
    useFormAutosave<AssistantFormValues>({
      initialValues,
      isDirty,
      getValues,
      reset: (values) => {
        reset({ ...values, name: values.name.trim() });
      },
      validate: trigger,
      saveValues: async (data) => {
        // accessLevel is handled separately in handleSharingChange
        const updateResult = await updateAssistantAction({
          assistantId: assistant.id,
          name: data.name.trim(),
          description: data.description,
          instructions: data.instructions,
          hasLinkAccess: data.hasLinkAccess,
          promptSuggestions: data.promptSuggestions
            .map((suggestion) => suggestion.value.trim())
            .filter((suggestion) => suggestion.length > 0),
        });

        return updateResult.success;
      },
    });

  const name = useWatch({ control, name: 'name' });
  const savedAccessLevelRef = useRef(assistant.accessLevel);
  const isSchoolShared = useWatch({ control, name: 'isSchoolShared' });
  const hasLinkAccess = useWatch({ control, name: 'hasLinkAccess' });
  const showShareInfo = isSchoolShared || hasLinkAccess;
  const { elementRef: formStateRef, isVisible: isFormStateVisible } =
    useElementVisibility<HTMLDivElement>();

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
      router.push(`/assistants/d/${assistant.id}/`);
    });
  };

  const handleDuplicateAssistant = async () => {
    const createResult = await createNewAssistantAction({
      templateId: assistant.id,
      duplicateAssistantName: t('duplicate-name-format-string', {
        sourceName: name,
      }),
    });
    if (createResult.success) {
      guardNavigation(() => {
        router.push(`/assistants/editor/${createResult.value.id}`);
      });
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
  };

  const handleDeleteAssistant = async () => {
    const deleteResult = await deleteAssistantAction({ assistantId: assistant.id });
    if (deleteResult.success) {
      toast.success(t('toasts.delete-toast-success'));
    }
    if (!deleteResult.success) {
      toast.error(t('toasts.delete-toast-error'));
    }
    guardNavigation(() => {
      router.push('/custom');
    });
  };

  const handleFileUploaded = async (data: { id: string; name: string; file: File }) => {
    // after a file is uploaded, we need to link it to the assistant
    const linkResult = await linkFileToAssistantAction({
      fileId: data.id,
      assistantId: assistant.id,
    });

    if (!linkResult.success) {
      toast.error(t('toasts.file-link-error'));
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    return await deleteFileMappingAndEntityAction({ assistantId: assistant.id, fileId });
  };

  async function handleDownloadFile(fileId: string) {
    return downloadFileFromAssistantAction({ assistantId: assistant.id, fileId });
  }

  const handleLinksChange = async (links: string[]) => {
    return await updateAssistantAction({ assistantId: assistant.id, attachedLinks: links });
  };

  async function handleUploadPicture(croppedImageBlob: Blob) {
    const result = await uploadAvatarPictureForAssistantAction({
      assistantId: assistant.id,
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
        const result = await updateAssistantAccessLevelAction({
          assistantId: assistant.id,
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

  const assistantActions = (
    <CustomChatActions>
      <CustomChatActionUse onClick={handleUseChat} />
      <CustomChatActionDuplicate onClick={handleDuplicateAssistant} />
      <CustomChatActionDelete
        onClick={handleDeleteAssistant}
        modalTitle={t('delete-modal-title')}
        modalDescription={t('delete-modal-description')}
      />
    </CustomChatActions>
  );

  return (
    <>
      {!isFormStateVisible && (
        <CustomChatHeaderContent>
          <CustomChatFormState
            isDirty={isDirty}
            isSubmitting={isSaving}
            hasSaveError={hasSaveError}
          />
        </CustomChatHeaderContent>
      )}
      <CustomChatLayoutContainer>
        <BackButton
          href="/custom"
          text={t('back-button')}
          aria-label={t('back-button-aria-label')}
          onClick={() => {
            guardNavigation(() => {
              router.push('/custom');
            });
          }}
        />
        <CustomChatTitle title={name} />
        <div className="flex flex-wrap items-start gap-3">
          {assistantActions}
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
        <CustomChatImageUpload
          avatarPictureUrl={avatarPictureUrl}
          onUploadPicture={handleUploadPicture}
        />

        <form
          id="assistant-edit-form"
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
                  {...assistantFieldValidationConfig.name}
                  label={t('name-label')}
                  placeholder={t('name-placeholder')}
                  autoFocusWhenEmpty
                  testId="assistant-name-input"
                  onBlur={handleAutoSave}
                />
                <FormField
                  name="description"
                  control={control}
                  {...assistantFieldValidationConfig.description}
                  label={t('description-label')}
                  placeholder={t('description-placeholder')}
                  testId="assistant-description-input"
                  onBlur={handleAutoSave}
                  type="textArea"
                  className="h-27 resize-none"
                />
                <FormField
                  name="instructions"
                  control={control}
                  {...assistantFieldValidationConfig.instructions}
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
                  placeholder={stripRichTextTags(t.raw('instructions-placeholder'))}
                  testId="assistant-instructions-input"
                  onBlur={handleAutoSave}
                  type="textArea"
                  className="h-125"
                />
                <CustomChatPromptSuggestions control={control} onBlur={handleAutoSave} />
              </FieldGroup>
            </CardContent>
          </Card>

          <CustomChatFilesAndLinks
            initialFiles={relatedFiles}
            onFileUploaded={handleFileUploaded}
            onDeleteFile={handleDeleteFile}
            onDownloadFile={handleDownloadFile}
            initialLinks={initialLinks}
            onLinksChange={handleLinksChange}
          />

          <CustomShareSection
            control={control}
            schoolSharingName="isSchoolShared"
            linkSharingName="hasLinkAccess"
            linkToShare={`/assistants/${assistant.id}`}
            onShareChange={handleSharingChange}
          />
        </form>
        <div className="flex flex-wrap items-start gap-3">
          {assistantActions}
          <CustomChatFormState
            isDirty={isDirty}
            isSubmitting={isSaving}
            hasSaveError={hasSaveError}
          />
        </div>
      </CustomChatLayoutContainer>
    </>
  );
}
