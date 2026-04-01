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
import { Field, FieldLabel, FieldError, FieldGroup } from '@ui/components/Field';
import { Input } from '@ui/components/Input';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import z from 'zod';
import { CustomChatLayoutContainer } from '@/components/custom-chat/custom-chat-layout-container';
import { CustomChatTitle } from '@/components/custom-chat/custom-chat-title';
import { CustomChatActions } from '@/components/custom-chat/custom-chat-actions';
import { CustomChatActionUse } from '@/components/custom-chat/custom-chat-action-use';
import { CustomChatActionDuplicate } from '@/components/custom-chat/custom-chat-action-duplicate';
import { CustomChatActionDelete } from '@/components/custom-chat/custom-chat-action-delete';
import { CustomChatActionSave } from '@/components/custom-chat/custom-chat-action-save';
import { CustomChatFormState } from '@/components/custom-chat/custom-chat-form-state';
import { useRouter } from 'next/navigation';
import {
  createNewAssistantAction,
  deleteFileMappingAndEntityAction,
  linkFileToAssistantAction,
} from '../../../custom/actions';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import {
  deleteAssistantAction,
  updateAssistantAction,
  uploadAvatarPictureForAssistantAction,
  updateAssistantAccessLevelAction,
} from '../../../custom/editor/[customGptId]/actions';
import { CustomChatShareInfo } from '@/components/custom-chat/custom-chat-share-info';
import { CustomChatImageUpload } from '@/components/custom-chat/custom-chat-image-upload';
import { Textarea } from '@ui/components/Textarea';
import { useCallback, useMemo, useRef } from 'react';
import { usePendingChangesGuard } from '@/hooks/use-pending-changes-guard';
import { useForceReloadOnBrowserBackButton } from '@/hooks/use-force-reload-on-browser-back-button';
import { useFormAutosave } from '@/hooks/use-form-autosave';
import { CustomChatFilesAndLinks } from '@/components/custom-chat/custom-chat-files-and-links';
import { WebsearchSource } from '@shared/db/types';
import CustomShareSection from '@/components/custom-chat/custom-chat-share-section';
import { CustomChatPromptSuggestions } from '@/components/custom-chat/custom-chat-prompt-suggestions';

type AssistantTranslator = ReturnType<typeof useTranslations<'assistants'>>;

function createAssistantFormValuesSchema(t: AssistantTranslator) {
  return z.object({
    name: z.string().min(1, t('name-required')),
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
  });

  const { isSaving, hasSaveError, flushAutoSave, handleAutoSave } =
    useFormAutosave<AssistantFormValues>({
      initialValues,
      isDirty,
      getValues,
      reset: (values) => {
        reset(values);
      },
      validate: trigger,
      saveValues: async (data) => {
        // accessLevel is handled separately in handleSharingChange
        const updateResult = await updateAssistantAction({
          gptId: assistant.id,
          name: data.name,
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
      router.push(`/assistants/d/${assistant.id}/`);
    });
  };

  const handleDuplicateAssistant = async () => {
    const createResult = await createNewAssistantAction({ templateId: assistant.id });
    if (createResult.success) {
      guardNavigation(() => {
        router.push(`/assistants/editor/${createResult.value.id}`);
      });
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
  };

  const handleDeleteAssistant = async () => {
    const deleteResult = await deleteAssistantAction({ gptId: assistant.id });
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

  const handleLinksChange = async (links: string[]) => {
    return await updateAssistantAction({ gptId: assistant.id, attachedLinks: links });
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
          gptId: assistant.id,
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

  return (
    <CustomChatLayoutContainer>
      {/* // Todo: Maybe we have to remember where we come from and which filters were set */}
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
      <div className="flex flex-row justify-between">
        <CustomChatActions>
          <CustomChatActionUse onClick={handleUseChat} />
          <CustomChatActionDuplicate onClick={handleDuplicateAssistant} />
          <CustomChatActionDelete onClick={handleDeleteAssistant} />
          <CustomChatActionSave onClick={handleAutoSave} />
        </CustomChatActions>
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
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} aria-required="true">
                    <FieldLabel htmlFor={field.name}>{t('name-label')}</FieldLabel>
                    <Input
                      {...field}
                      ref={nameInputRef}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      aria-label={t('name-label')}
                      placeholder={t('name-placeholder')}
                      autoComplete="off"
                      maxLength={SMALL_TEXT_INPUT_FIELDS_LIMIT}
                      maxLengthErrorMessage={t('name-max-length', {
                        maxLength: SMALL_TEXT_INPUT_FIELDS_LIMIT,
                      })}
                      required
                      data-testid="assistant-name-input"
                      onBlur={() => {
                        field.onBlur();
                        handleAutoSave();
                      }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t('description-label')}</FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      className="h-27 resize-none"
                      aria-invalid={fieldState.invalid}
                      aria-label={t('description-label')}
                      placeholder={t('description-placeholder')}
                      autoComplete="off"
                      maxLengthErrorMessage={t('description-max-length', {
                        maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT,
                      })}
                      maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
                      data-testid="assistant-description-input"
                      onBlur={() => {
                        field.onBlur();
                        handleAutoSave();
                      }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="instructions"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t('instructions-label')}</FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      className="h-125"
                      aria-invalid={fieldState.invalid}
                      placeholder={t('instructions-placeholder')}
                      aria-label={t('instructions-label')}
                      maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS}
                      maxLengthErrorMessage={t('instructions-max-length', {
                        maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
                      })}
                      autoComplete="off"
                      data-testid="assistant-instructions-input"
                      onBlur={() => {
                        field.onBlur();
                        handleAutoSave();
                      }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <CustomChatPromptSuggestions
                control={control}
                onBlur={() => {
                  handleAutoSave();
                }}
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
          entityType="assistant"
          entityId={assistant.id}
        />

        <CustomShareSection
          control={control}
          schoolSharingName="isSchoolShared"
          linkSharingName="hasLinkAccess"
          onShareChange={handleSharingChange}
        />
      </form>
      <div className="flex flex-row justify-between">
        <CustomChatActions>
          <CustomChatActionUse
            onClick={() => {
              guardNavigation(() => {
                router.push(`/custom/d/${assistant.id}/`);
              });
            }}
          />
          <CustomChatActionDuplicate onClick={handleDuplicateAssistant} />
          <CustomChatActionDelete onClick={handleDeleteAssistant} />
          <CustomChatActionSave onClick={handleAutoSave} />
        </CustomChatActions>
        <CustomChatFormState
          isDirty={isDirty}
          isSubmitting={isSaving}
          hasSaveError={hasSaveError}
        />
      </div>
    </CustomChatLayoutContainer>
  );
}
