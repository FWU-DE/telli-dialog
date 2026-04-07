'use client';

import { AssistantSelectModel, FileModel, UserSchoolRole } from '@shared/db/schema';
import {
  buttonDeleteClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
} from '@/utils/tailwind/button';
import { labelClassName } from '@/utils/tailwind/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import React from 'react';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import CropImageAndUploadButton from '@/components/crop-uploaded-image/crop-image-and-upload-button';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import { cn } from '@/utils/tailwind';
import { logWarning } from '@shared/logging';
import { useTranslations } from 'next-intl';
import {
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
} from '@/configuration-text-inputs/const';
import TrashIcon from '@/components/icons/trash';
import PlusIcon from '@/components/icons/plus';
import { TextInput } from '@/components/common/text-input';
import {
  deleteAssistantAction,
  updateAssistantAccessLevelAction,
  updateAssistantAction,
  uploadAvatarPictureForAssistantAction,
} from './actions';
import {
  createNewAssistantAction,
  deleteFileMappingAndEntityAction,
  linkFileToAssistantAction,
} from '../../actions';
import { deepCopy, deepEqual } from '@/utils/object';
import FileManagement from '@/components/forms/file-management';
import { CopyContainer } from '../../../_components/copy-container';
import NavigateBack from '@/components/common/navigate-back';
import { LocalFileState } from '@/components/chat/send-message-form';
import { getZodStringFieldMetadataFn } from '@/components/forms/utils';
import { iconClassName } from '@/utils/tailwind/icon';
import { AttachedLinks } from '@/components/forms/attached-links';
import { formLinks } from '@/utils/web-search/form-links';
import AvatarPicture from '@/components/common/avatar-picture';
import { WebsearchSource } from '@shared/db/types';
import SharingSection from '@/components/forms/sharing-section';
import { buildGenericUrl } from '@/app/(authed)/(dialog)/utils.client';
import { AVATAR_MAX_SIZE } from '@/const';

type AssistantFormProps = AssistantSelectModel & {
  maybeSignedPictureUrl: string | undefined;
  userRole: UserSchoolRole;
  isCreating?: boolean;
  readOnly: boolean;
  existingFiles: FileModel[];
  initialLinks: WebsearchSource[];
};
/**
 * Zod form configuration Info:
 * - If the field is required, set the min length to at least 1.
 * - If the field is nullable, it must not have a min length.
 * - behavior of the textInput component is based on the nullable property (required behavior vs optional behavior)
 * - the max length property controls the behavior of the textInput component and blocks user input if the max length is reached
 */
const assistantFormValuesSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  instructions: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS),
  promptSuggestions: z.array(z.object({ content: z.string() })),
  attachedLinks: formLinks,

  // Sharing options
  isSchoolShared: z.boolean(),
  hasLinkAccess: z.boolean(),
});
type AssistantFormValues = z.infer<typeof assistantFormValuesSchema>;

export default function AssistantForm({
  maybeSignedPictureUrl,
  isCreating = false,
  promptSuggestions,
  userRole,
  existingFiles,
  readOnly,
  initialLinks,
  ...assistant
}: AssistantFormProps) {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { isValid },
  } = useForm({
    resolver: zodResolver(assistantFormValuesSchema),
    defaultValues: {
      ...assistant,
      description: assistant.description ?? undefined,
      instructions: assistant.instructions ?? undefined,
      promptSuggestions:
        promptSuggestions.length < 1
          ? [{ content: '' }]
          : promptSuggestions.map((p) => ({ content: p })),
      attachedLinks: initialLinks,
      isSchoolShared: assistant.accessLevel === 'school',
    },
  });
  const [_files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [initialFiles, setInitialFiles] = React.useState<FileModel[]>(existingFiles);
  const t = useTranslations('custom-gpt.form');
  const tToast = useTranslations('custom-gpt.toasts');
  const tCommon = useTranslations('common');
  const getZodStringFieldMetadata = getZodStringFieldMetadataFn(assistantFormValuesSchema);

  function handleSharingChange() {
    if (isCreating || readOnly) return;

    // Check if school sharing (accessLevel) changed
    const isSchoolShared = getValues('isSchoolShared');
    const newAccessLevel = isSchoolShared ? 'school' : 'private';

    if (newAccessLevel !== assistant.accessLevel) {
      updateAssistantAccessLevelAction({
        gptId: assistant.id,
        accessLevel: newAccessLevel,
      }).then((result) => {
        if (result.success) {
          router.refresh();
        } else {
          toast.error(tToast('edit-toast-error'));
        }
      });
    }

    // Save other sharing changes (like hasLinkAccess) via autosave
    handleAutoSave();
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'promptSuggestions',
  });
  const { fields: attachedLinkFields } = useFieldArray({
    control,
    name: 'attachedLinks',
  });

  async function handleDeattachFile(localFileId: string) {
    const fileId: string | undefined =
      _files.get(localFileId)?.fileId ?? initialFiles.find((f) => f.id === localFileId)?.id;
    if (fileId === undefined) return;

    // update the FE state
    setFiles((prev) => {
      const newMap = deepCopy(prev);
      const deleted = newMap.delete(localFileId);
      if (!deleted) {
        logWarning('Could not delete file', { localFileId });
      }
      return newMap;
    });

    setInitialFiles(initialFiles.filter((f) => f.id !== fileId));
    await deleteFileMappingAndEntityAction({ assistantId: assistant.id, fileId });
  }
  async function handleNewFile(data: { id: string; name: string; file: File }) {
    const result = await linkFileToAssistantAction({ fileId: data.id, assistantId: assistant.id });
    if (!result.success) toast.error(tToast('edit-toast-error'));
  }

  async function onSubmit(data: AssistantFormValues) {
    const result = await updateAssistantAction({
      ...data,
      promptSuggestions: data.promptSuggestions?.map((p) => p.content),
      gptId: assistant.id,
      attachedLinks: data.attachedLinks.map((p) => p?.link ?? ''),
    });
    if (result.success) {
      if (!isCreating) {
        toast.success(tToast('edit-toast-success'));
        router.refresh();
      }
    } else {
      toast.error(tToast('edit-toast-error'));
    }
  }

  function cleanupPromptSuggestions(promptSuggestions: string[] | undefined) {
    if (promptSuggestions === undefined) return undefined;
    return promptSuggestions
      .map((p) => p.trim())
      .filter((p) => !!p)
      .slice(0, 10);
  }

  function updatePromptSuggestions() {
    const _promptSuggestions = getValues('promptSuggestions');
    const newPromptSuggestions = cleanupPromptSuggestions(_promptSuggestions.map((p) => p.content));
    const dataEquals = deepEqual(promptSuggestions, newPromptSuggestions);
    if (dataEquals) return;
    updateAssistantAction({
      gptId: assistant.id,
      promptSuggestions: newPromptSuggestions,
    }).then((result) => {
      if (result.success) {
        if (!isCreating) toast.success(tToast('edit-toast-success'));
        router.refresh();
      } else toast.error(tToast('edit-toast-error'));
    });
  }

  const backUrl = `/custom?visibility=${assistant.accessLevel}`;

  function handleNavigateBack(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (isCreating) {
      handleDeleteAssistant();
      return;
    }
    router.push(backUrl);
  }

  function handleDeleteAssistant() {
    deleteAssistantAction({ gptId: assistant.id }).then((result) => {
      if (result.success) {
        // do not show any toast if the avatar is being created
        if (!isCreating) {
          toast.success(tToast('delete-toast-success'));
        }

        // replace instead of push to avoid showing a 404 when navigating back to the now non existing custom gpt
        router.replace(backUrl);
      } else toast.error(tToast('delete-toast-error'));
    });
  }

  function handleAutoSave() {
    if (isCreating) return;
    const data = getValues();
    const defaultData = { ...assistant, promptSuggestions: [] };
    const newData = {
      ...defaultData,
      ...data,
      promptSuggestions: [],
      attachedLinks: data.attachedLinks.map((p) => p.link),
      isSchoolShared: undefined,
    };
    const dataEquals = deepEqual(defaultData, newData);
    if (dataEquals) return;
    onSubmit(data);
  }

  async function handleCreateAssistant() {
    const data = getValues();
    await onSubmit(data);

    // Set access level if school sharing is enabled
    if (data.isSchoolShared) {
      await updateAssistantAccessLevelAction({
        gptId: assistant.id,
        accessLevel: 'school',
      });
    }

    toast.success(tToast('create-toast-success'));
    // Use form's isSchoolShared to determine redirect URL since accessLevel hasn't been updated yet
    const redirectUrl = buildGenericUrl(data.isSchoolShared ? 'school' : 'private', 'custom');
    router.replace(redirectUrl);
  }

  async function handleUploadAvatarPicture(croppedImageBlob: Blob) {
    const result = await uploadAvatarPictureForAssistantAction({
      assistantId: assistant.id,
      croppedImageBlob,
    });

    if (result.success) {
      toast.success(tToast('image-toast-success'));
      router.refresh();
    }

    return result;
  }

  const copyContainer = readOnly ? (
    <CopyContainer
      templateId={assistant.id}
      startedAt={null}
      maxUsageTimeLimit={null}
      translationPath="custom-gpt.form"
      redirectPath="custom"
      createInstanceCallbackAction={createNewAssistantAction}
    />
  ) : undefined;

  return (
    <form className="flex flex-col mb-8" onSubmit={handleSubmit(onSubmit)}>
      <NavigateBack label={t('all-gpts')} onClick={handleNavigateBack} />
      <h1 className="text-2xl mt-4 font-medium">{isCreating ? t('create-gpt') : assistant.name}</h1>
      {copyContainer}
      <fieldset className="flex flex-col gap-4 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8 lg:gap-16">
          <div className="flex gap-8 flex-col">
            <TextInput
              label={t('gpt-name-label')}
              placeholder={t('gpt-name-placeholder')}
              inputType="text"
              getValue={() => getValues('name') ?? ''}
              {...getZodStringFieldMetadata('name')}
              {...register('name')}
              rows={undefined}
              readOnly={readOnly}
              maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
              id="name"
              onBlur={handleAutoSave}
            />
            <TextInput
              label={t('gpt-description-label')}
              placeholder={t('gpt-description-placeholder')}
              inputType="textarea"
              getValue={() => getValues('description') ?? ''}
              {...getZodStringFieldMetadata('description')}
              {...register('description')}
              rows={5}
              readOnly={readOnly}
              maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
              id="description"
              onBlur={handleAutoSave}
            />
          </div>
          <section className="h-full">
            <label htmlFor="image" className={cn(labelClassName, 'text-sm')}>
              {tCommon('image')}
            </label>
            <div
              id="image"
              className="relative bg-light-gray rounded-enterprise-md flex items-center justify-center w-[170px] h-[170px] mt-4"
            >
              {maybeSignedPictureUrl ? (
                <AvatarPicture src={maybeSignedPictureUrl} alt="Profile Picture" variant="large" />
              ) : (
                <EmptyImageIcon className="w-10 h-10" />
              )}
            </div>
            <CropImageAndUploadButton
              aspect={1}
              handleUploadAvatarPicture={handleUploadAvatarPicture}
              compressionOptions={{ maxWidth: AVATAR_MAX_SIZE, maxHeight: AVATAR_MAX_SIZE }}
              disabled={readOnly}
            />
          </section>
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-6 mt-6">
        <TextInput
          label={t('gpt-specification-label')}
          placeholder={t('gpt-specification-placeholder')}
          inputType="textarea"
          getValue={() => getValues('instructions') ?? ''}
          {...getZodStringFieldMetadata('instructions')}
          {...register('instructions')}
          rows={7}
          readOnly={readOnly}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS}
          id="instructions"
          onBlur={handleAutoSave}
        />
        <section className="mt-8 flex flex-col gap-3 w-full">
          <h2 className="font-medium">Promptvorschläge hinzufügen</h2>
          <p className="text-dark-gray">
            <span>{t('prompt-suggestions-description')}</span>
          </p>
          <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-4 w-full pr-4">
            {fields.map((field, index) => {
              return (
                <React.Fragment key={field.id}>
                  <TextInput
                    label={`Promptvorschlag ${index + 1}`}
                    placeholder={index === 0 ? t('prompt-suggestion-placeholder') : undefined}
                    inputType="textarea"
                    getValue={() => getValues(`promptSuggestions.${index}.content`) ?? ''}
                    {...getZodStringFieldMetadata(`promptSuggestions.${index}.content`)}
                    {...register(`promptSuggestions.${index}.content`)}
                    rows={2}
                    onBlur={updatePromptSuggestions}
                    readOnly={readOnly}
                    maxLength={undefined}
                    id={`promptSuggestions.${index}.content`}
                  />
                  <div className="flex items-center justify-center">
                    {index === fields.length - 1 ? (
                      <button
                        onClick={() => {
                          if (fields.length >= 10) {
                            toast.error(tToast('too-many-suggestions'));
                            return;
                          }
                          append({ content: '' });
                        }}
                        type="button"
                        className={cn('flex items-center justify-center', iconClassName)}
                        aria-label={t('prompt-suggestions-add-button')}
                      >
                        {!readOnly && <PlusIcon className="w-8 h-8" />}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          remove(index);
                          updatePromptSuggestions();
                        }}
                        aria-label={t('prompt-suggestions-delete-button', { index: index + 1 })}
                        className={cn('flex items-center justify-center', iconClassName)}
                        type="button"
                      >
                        {!readOnly && <TrashIcon className="w-8 h-8" />}
                      </button>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </section>
        <section className="mt-8"></section>
      </fieldset>

      <fieldset className="flex flex-col gap-4 mt-8">
        <h2 className="text-md font-medium">{t('additional-assets-label')}</h2>
        <span className="text-base">{t('additional-assets-content')}</span>

        <FileManagement
          files={_files}
          setFiles={setFiles}
          initialFiles={initialFiles}
          onFileUploaded={handleNewFile}
          onDeleteFile={handleDeattachFile}
          readOnly={readOnly}
          translationNamespace="custom-gpt.form"
        />
        <AttachedLinks
          fields={attachedLinkFields}
          getValues={() => getValues('attachedLinks')}
          setValue={(value) => setValue('attachedLinks', value)}
          t={t}
          tToast={tToast}
          readOnly={readOnly}
          handleAutosave={handleAutoSave}
        />
      </fieldset>
      <div className="w-full mt-8">
        {userRole === 'teacher' && !readOnly && (
          <SharingSection
            control={control}
            schoolSharingName="isSchoolShared"
            linkSharingName="hasLinkAccess"
            onShareChange={handleSharingChange}
          />
        )}
      </div>
      {!isCreating && !readOnly && (
        <section className="mt-8">
          <h3 className="font-medium">{t('delete-gpt')}</h3>
          <p className="mt-4">{t('gpt-delete-description')}</p>
          <DestructiveActionButton
            triggerButtonClassName={cn(buttonDeleteClassName, 'mt-10')}
            modalDescription={t('gpt-delete-modal-description')}
            modalTitle={t('delete-gpt')}
            confirmText={tCommon('delete')}
            actionFn={handleDeleteAssistant}
          >
            {t('delete-gpt')}
          </DestructiveActionButton>
        </section>
      )}
      {isCreating && !readOnly && (
        <section className="mt-8 flex gap-4 items-center">
          <button
            className={cn(buttonSecondaryClassName, 'hover:border-primary hover:bg-primary')}
            onClick={handleDeleteAssistant}
            type="button"
          >
            {tCommon('cancel')}
          </button>
          <button
            className={cn(buttonPrimaryClassName)}
            disabled={!isValid}
            onClick={handleCreateAssistant}
            type="button"
          >
            {t('create-gpt')}
          </button>
        </section>
      )}
    </form>
  );
}
