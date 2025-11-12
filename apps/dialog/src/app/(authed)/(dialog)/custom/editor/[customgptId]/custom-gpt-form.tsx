'use client';

import { CharacterAccessLevel, CustomGptModel, FileModel, UserSchoolRole } from '@shared/db/schema';
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
import React, { startTransition } from 'react';
import Image from 'next/image';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import UploadImageToBeCroppedButton from '@/components/crop-uploaded-image/crop-upload-button';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';
import Checkbox from '@/components/common/checkbox';
import {
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
} from '@/configuration-text-inputs/const';
import TrashIcon from '@/components/icons/trash';
import PlusIcon from '@/components/icons/plus';
import { TextInput } from '@/components/common/text-input';
import {
  deleteCustomGptAction,
  updateCustomGptAccessLevelAction,
  updateCustomGptAction,
  updateCustomGptPictureAction,
} from './actions';
import { deleteFileMappingAndEntity, linkFileToCustomGpt } from '../../actions';
import { deepCopy, deepEqual } from '@/utils/object';
import FileManagement from '@/components/forms/file-management';
import { CopyContainer } from '../../../_components/copy-container';
import NavigateBack from '@/components/common/navigate-back';
import { LocalFileState } from '@/components/chat/send-message-form';
import { getZodStringFieldMetadataFn } from '@/components/forms/utils';
import { iconClassName } from '@/utils/tailwind/icon';
import { AttachedLinks } from '@/components/forms/attached-links';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { formLinks } from '@/utils/web-search/form-links';

type CustomGptFormProps = CustomGptModel & {
  maybeSignedPictureUrl: string | undefined;
  userRole: UserSchoolRole;
  isCreating?: boolean;
  readOnly: boolean;
  existingFiles: FileModel[];
  initialLinks: WebsearchSource[];
  templateCustomGptId?: string;
};
/**
 * Zod form configuration Info:
 * - If the field is required, set the min length to at least 1.
 * - If the field is nullable, it must not have a min length.
 * - behavior of the textInput component is based on the nullable property (required behavior vs optional behavior)
 * - the max length property controls the behavior of the textInput component and blocks user input if the max length is reached
 */
const customGptFormValuesSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  specification: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS),
  promptSuggestions: z.array(z.object({ content: z.string() })),
  attachedLinks: formLinks,
});
type CustomGptFormValues = z.infer<typeof customGptFormValuesSchema>;

export default function CustomGptForm({
  maybeSignedPictureUrl,
  isCreating = false,
  promptSuggestions,
  userRole,
  existingFiles,
  readOnly,
  initialLinks,
  templateCustomGptId,
  ...customGpt
}: CustomGptFormProps) {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { isValid },
  } = useForm<CustomGptFormValues>({
    resolver: zodResolver(customGptFormValuesSchema),
    defaultValues: {
      ...customGpt,
      description: customGpt.description ?? undefined,
      specification: customGpt.specification ?? undefined,
      promptSuggestions:
        promptSuggestions.length < 1
          ? [{ content: '' }]
          : promptSuggestions.map((p) => ({ content: p })),
      attachedLinks: initialLinks,
    },
  });
  const [_files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [initialFiles, setInitialFiles] = React.useState<FileModel[]>(existingFiles);
  const t = useTranslations('custom-gpt.form');
  const tToast = useTranslations('custom-gpt.toasts');
  const tCommon = useTranslations('common');
  const getZodStringFieldMetadata = getZodStringFieldMetadataFn(customGptFormValuesSchema);
  const [optimisticAccessLevel, addOptimisticAccessLevel] = React.useOptimistic(
    customGpt.accessLevel,
    (p, n: CharacterAccessLevel) => n,
  );

  function handleEnableSharing(value: boolean) {
    const accessLevel = value ? 'school' : 'private';

    startTransition(() => {
      addOptimisticAccessLevel(accessLevel);
    });

    updateCustomGptAccessLevelAction({
      gptId: customGpt.id,
      accessLevel,
    })
      .then(() => {
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('edit-toast-error'));
      });
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
        console.warn('Could not delete file');
      }
      return newMap;
    });

    setInitialFiles(initialFiles.filter((f) => f.id !== fileId));
    await deleteFileMappingAndEntity({ fileId });
  }
  function handleNewFile(data: { id: string; name: string; file: File }) {
    linkFileToCustomGpt({ fileId: data.id, customGpt: customGpt.id })
      .then()
      .catch(() => toast.error(tToast('edit-toast-error')));
  }

  function onSubmit(data: CustomGptFormValues) {
    updateCustomGptAction({
      ...data,
      promptSuggestions: data.promptSuggestions?.map((p) => p.content),
      gptId: customGpt.id,
      attachedLinks: data.attachedLinks.map((p) => p?.link ?? ''),
      originalCustomGptId: templateCustomGptId ?? null,
    })
      .then(() => {
        if (!isCreating) toast.success(tToast('edit-toast-success'));
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('edit-toast-error'));
      });
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
    updateCustomGptAction({
      gptId: customGpt.id,
      promptSuggestions: newPromptSuggestions,
      originalCustomGptId: templateCustomGptId ?? null,
    })
      .then(() => {
        if (!isCreating) toast.success(tToast('edit-toast-success'));

        router.refresh();
      })
      .catch((error) => {
        console.error({ error });
      });
  }

  const backUrl = `/custom?visibility=${customGpt.accessLevel}`;

  function handlePictureUploadComplete(picturePath: string) {
    updateCustomGptPictureAction({ picturePath, gptId: customGpt.id })
      .then(() => {
        toast.success(tToast('image-toast-success'));
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('edit-toast-error'));
      });
  }
  function handleNavigateBack(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (isCreating) {
      handleDeleteCustomGpt();
      return;
    }
    router.push(backUrl);
  }

  function handleDeleteCustomGpt() {
    deleteCustomGptAction({ gptId: customGpt.id })
      .then(() => {
        // do not show any toast if the avatar is being created
        if (!isCreating) {
          toast.success(tToast('delete-toast-success'));
        }

        // replace instead of push to avoid showing a 404 when navigating back to the now non existing custom gpt
        router.replace(backUrl);
      })
      .catch(() => {
        toast.error(tToast('delete-toast-error'));
      });
  }

  function handleAutoSave() {
    if (isCreating) return;
    const data = getValues();
    const defaultData = { ...customGpt, promptSuggestions: [] };
    const newData = {
      ...defaultData,
      ...data,
      promptSuggestions: [],
      attachedLinks: data.attachedLinks.map((p) => p.link),
    };
    const dataEquals = deepEqual(defaultData, newData);
    if (dataEquals) return;
    onSubmit(data);
  }
  function handleCreateCustomGpt() {
    const data = getValues();
    onSubmit(data);
    toast.success(tToast('create-toast-success'));
    router.replace(backUrl);
  }

  const copyContainer = readOnly ? (
    <CopyContainer
      templateId={customGpt.id}
      templatePictureId={customGpt.pictureId ?? undefined}
      startedAt={null}
      maxUsageTimeLimit={null}
      translation_path="custom-gpt.form"
      redirectPath="custom"
    />
  ) : undefined;

  return (
    <form className="flex flex-col mb-8" onSubmit={handleSubmit(onSubmit)}>
      <NavigateBack label={t('all-gpts')} onClick={handleNavigateBack} />
      <h1 className="text-2xl mt-4 font-medium">{isCreating ? t('create-gpt') : customGpt.name}</h1>
      {copyContainer}
      {userRole === 'teacher' && (
        <fieldset className="mt-8 gap-8">
          <div className="flex gap-4">
            <Checkbox
              label={t('restriction-school')}
              checked={optimisticAccessLevel === 'school'}
              onCheckedChange={(value: boolean) => handleEnableSharing(value)}
              disabled={readOnly}
            />
          </div>
        </fieldset>
      )}
      <fieldset className="flex flex-col gap-4 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8 md:gap-16">
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
                <Image
                  src={maybeSignedPictureUrl || ''}
                  alt="Profile Picture"
                  width={170}
                  height={170}
                  className="border-[1px] rounded-enterprise-md"
                  unoptimized
                  style={{
                    width: '170px',
                    height: '170px',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <EmptyImageIcon className="w-10 h-10" />
              )}
            </div>
            <UploadImageToBeCroppedButton
              uploadDirPath={`custom-gpts/${customGpt.id}`}
              aspect={1}
              onUploadComplete={handlePictureUploadComplete}
              file_name="avatar"
              compressionOptions={{ maxHeight: 800 }}
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
          getValue={() => getValues('specification') ?? ''}
          {...getZodStringFieldMetadata('specification')}
          {...register('specification')}
          rows={7}
          readOnly={readOnly}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS}
          id="specification"
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

        {!readOnly && (
          <>
            <FileManagement
              files={_files}
              setFiles={setFiles}
              initialFiles={initialFiles}
              onFileUploaded={handleNewFile}
              onDeleteFile={handleDeattachFile}
              readOnly={readOnly}
              translationNamespace="custom-gpt.form"
            />
          </>
        )}
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
      {!isCreating && !readOnly && (
        <section className="mt-8">
          <h3 className="font-medium">{t('delete-gpt')}</h3>
          <p className="mt-4">{t('gpt-delete-description')}</p>
          <DestructiveActionButton
            triggerButtonClassName={cn(buttonDeleteClassName, 'mt-10')}
            modalDescription={t('gpt-delete-modal-description')}
            modalTitle={t('delete-gpt')}
            confirmText={tCommon('delete')}
            actionFn={handleDeleteCustomGpt}
          >
            {t('delete-gpt')}
          </DestructiveActionButton>
        </section>
      )}
      {isCreating && !readOnly && (
        <section className="mt-8 flex gap-4 items-center">
          <button
            className={cn(buttonSecondaryClassName, 'hover:border-primary hover:bg-primary-hover')}
            onClick={handleDeleteCustomGpt}
            type="button"
          >
            {tCommon('cancel')}
          </button>
          <button
            className={cn(buttonPrimaryClassName)}
            disabled={!isValid}
            onClick={handleCreateCustomGpt}
            type="button"
          >
            {t('create-gpt')}
          </button>
        </section>
      )}
    </form>
  );
}
