'use client';

import {
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
import z from 'zod';
import { CustomChatLayoutContainer } from '@/components/custom-chat/custom-chat-layout-container';
import { CustomChatTitle } from '@/components/custom-chat/custom-chat-title';
import { CustomChatActions } from '@/components/custom-chat/custom-chat-actions';
import { CustomChatActionUse } from '@/components/custom-chat/custom-chat-action-use';
import { CustomChatActionDuplicate } from '@/components/custom-chat/custom-chat-action-duplicate';
import { CustomChatActionDelete } from '@/components/custom-chat/custom-chat-action-delete';
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
  getAvatarSignedUrl,
  updateAssistantAccessLevelAction,
} from '../../../custom/editor/[customGptId]/actions';
import { CustomChatShareInfo } from '@/components/custom-chat/custom-chat-share-info';
import { CustomChatFormState } from '@/components/custom-chat/custom-chat-form-state';
import { CustomChatImageUpload } from '@/components/custom-chat/custom-chat-image-upload';
import { CustomChatActionSave } from '@/components/custom-chat/custom-chat-action-save';
import { Textarea } from '@ui/components/Textarea';
import { useCallback, useRef } from 'react';
import { usePendingChangesGuard } from '@/hooks/use-pending-changes-guard';
import { useForceReloadOnBrowserBackButton } from '@/hooks/use-force-reload-on-browser-back-button';
import { useFormAutosave } from '@/hooks/use-form-autosave';
import { CustomChatFilesAndLinks } from '@/components/custom-chat/custom-chat-files-and-links';
import { WebsearchSource } from '@shared/db/types';
import CustomShareSection from '@/components/custom-chat/custom-chat-share-section';

const assistantFormValuesSchema = z.object({
  name: z.string().min(1, 'Der Name darf nicht leer sein.'),
  description: z
    .string()
    .max(
      TEXT_INPUT_FIELDS_LENGTH_LIMIT,
      `Die Beschreibung darf maximal ${TEXT_INPUT_FIELDS_LENGTH_LIMIT} Zeichen lang sein.`,
    ),
  instructions: z
    .string()
    .max(
      TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
      `Die Anweisungen dürfen maximal ${TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS} Zeichen lang sein.`,
    ),
  pictureId: z.string().optional(),
  isSchoolShared: z.boolean(),
  hasLinkAccess: z.boolean(),
});
type AssistantFormValues = z.infer<typeof assistantFormValuesSchema>;

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
  const t = useTranslations('assistant');
  const initialValues: AssistantFormValues = {
    name: assistant.name,
    description: assistant.description ?? '',
    instructions: assistant.instructions ?? '',
    pictureId: assistant.pictureId ?? undefined,
    isSchoolShared: assistant.accessLevel === 'school',
    hasLinkAccess: assistant.hasLinkAccess,
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
          pictureId: data.pictureId,
          hasLinkAccess: data.hasLinkAccess,
        });

        return updateResult.success;
      },
    });

  const name = useWatch({ control, name: 'name' });
  const onPictureIdChangeRef = useRef<(value: string) => void>(() => {});
  const savedAccessLevelRef = useRef(assistant.accessLevel);
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

  const handleDuplicateAssistant = async () => {
    const createResult = await createNewAssistantAction({});
    if (createResult.success) {
      guardNavigation(() => {
        router.push(`/assistants/${createResult.value.id}/edit`);
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
      toast.error('Beim Hinzufügen der Datei zum Assistenten ist ein Fehler aufgetreten.');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    return await deleteFileMappingAndEntityAction({ assistantId: assistant.id, fileId });
  };

  const handleLinksChange = async (links: string[]) => {
    return await updateAssistantAction({ gptId: assistant.id, attachedLinks: links });
  };

  async function handlePictureUploadComplete(pictureId: string) {
    onPictureIdChangeRef.current(pictureId);
  }

  async function handleUploadPicture(croppedImageBlob: Blob) {
    return await uploadAvatarPictureForAssistantAction({
      assistantId: assistant.id,
      croppedImageBlob,
    });
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
        text="Assistenten"
        aria-label="Zurück zu den Assistenten"
        onClick={() => {
          guardNavigation(() => {
            router.push('/custom');
          });
        }}
      />
      <CustomChatTitle title={name} />
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
      {showShareInfo && <CustomChatShareInfo href="#share-settings" />}
      <CustomChatImageUpload
        avatarPictureUrl={avatarPictureUrl}
        onPictureUploadComplete={handlePictureUploadComplete}
        onUploadPicture={handleUploadPicture}
        onGetSignedUrl={getAvatarSignedUrl}
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
                name="pictureId"
                control={control}
                render={({ field }) => {
                  onPictureIdChangeRef.current = (value: string) => {
                    field.onChange(value);
                    handleAutoSave();
                  };

                  return <Input {...field} type="hidden" value={field.value ?? ''} />;
                }}
              />
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} aria-required="true">
                    <FieldLabel htmlFor={field.name}>Name des Assistenten</FieldLabel>
                    <Input
                      {...field}
                      id="field.name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Name des Assistenten"
                      autoComplete="off"
                      required
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
                    <FieldLabel htmlFor={field.name}>Kurzbeschreibung</FieldLabel>
                    <Textarea
                      {...field}
                      id="field.description"
                      className="h-27 resize-none"
                      aria-invalid={fieldState.invalid}
                      placeholder="Beschreibung des Assistenten"
                      autoComplete="off"
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
                    <FieldLabel htmlFor={field.name}>Anweisungen</FieldLabel>
                    <Textarea
                      {...field}
                      id="field.instructions"
                      className="h-125 resize-none"
                      aria-invalid={fieldState.invalid}
                      placeholder="Anweisungen für den Assistenten"
                      autoComplete="off"
                      onBlur={() => {
                        field.onBlur();
                        handleAutoSave();
                      }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
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
        />

        <CustomShareSection
          control={control}
          schoolSharingName="isSchoolShared"
          linkSharingName="hasLinkAccess"
          isLinkSharingEnabled={hasLinkAccess}
          onShareChange={handleSharingChange}
        />
      </form>
    </CustomChatLayoutContainer>
  );
}
