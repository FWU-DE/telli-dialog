'use client';

import { CharacterAccessLevel, CustomGptModel, FileModel, UserSchoolRole } from '@/db/schema';
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
import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
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
import { deepCopy } from '@/utils/object';
import FileDrop from '@/components/forms/file-drop-area';
import FilesTable from '@/components/forms/file-upload-table';
import NavigateBack from '@/components/common/navigate-back';
import { LocalFileState } from '@/components/chat/send-message-form';

type CustomGptFormProps = CustomGptModel & {
  maybeSignedPictureUrl: string | undefined;
  userRole: UserSchoolRole;
  isCreating?: boolean;
  readOnly?: boolean;
};

const customGptFormValuesSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  specification: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  promptSuggestions: z.array(z.object({ content: z.string() })),
});
type CustomGptFormValues = z.infer<typeof customGptFormValuesSchema>;

export default function CustomGptForm({
  maybeSignedPictureUrl,
  isCreating = false,
  promptSuggestions,
  userRole,
  existingFiles,
  readOnly,
  ...customGpt
}: CustomGptFormProps & { existingFiles: FileModel[] }) {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { isValid },
  } = useForm<CustomGptFormValues>({
    resolver: zodResolver(customGptFormValuesSchema),
    defaultValues: {
      ...customGpt,
      description: customGpt.description ?? '',
      specification: customGpt.specification ?? '',
      promptSuggestions:
        promptSuggestions.length < 1
          ? [{ content: '' }]
          : promptSuggestions.map((p) => ({ content: p })),
    },
  });
  const [_files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [initialFiles, setInitialFiles] = React.useState<FileModel[]>(existingFiles);
  const t = useTranslations('custom-gpt.form');
  const tToast = useTranslations('custom-gpt.toasts');
  const tCommon = useTranslations('common');

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

  async function onSubmit(data: CustomGptFormValues) {
    updateCustomGptAction({
      ...data,
      promptSuggestions: data.promptSuggestions?.map((p) => p.content),
      gptId: customGpt.id,
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

    const promptSuggestions = cleanupPromptSuggestions(_promptSuggestions.map((p) => p.content));

    updateCustomGptAction({
      gptId: customGpt.id,
      promptSuggestions,
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

        router.push(backUrl);
      })
      .catch(() => {
        toast.error(tToast('delete-toast-error'));
      });
  }

  function handleCreateCustomGpt() {
    const data = getValues();
    onSubmit(data);
    toast.success(tToast('create-toast-success'));
    router.replace(backUrl);
  }
  return (
    <form className="flex flex-col mb-8" onSubmit={handleSubmit(onSubmit)}>
      <NavigateBack label={t('all-gpts')} onClick={handleNavigateBack} />

      <h1 className="text-2xl mt-4 font-medium">{isCreating ? t('create-gpt') : customGpt.name}</h1>
      {userRole === 'teacher' && (
        <fieldset className="mt-8 gap-8">
          <div className="flex gap-4">
            <Checkbox
              label={t('restriction-school')}
              checked={optimisticAccessLevel === 'school'}
              onCheckedChange={(value: boolean) => handleEnableSharing(value)}
            />
          </div>
        </fieldset>
      )}
      <fieldset className="flex flex-col gap-4 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8 md:gap-16">
          <div className="flex gap-8 flex-col">
            <TextInput
              label={t('gpt-name-label')}
              required={true}
              placeholder={t('gpt-name-placeholder')}
              inputType="text"
              {...register('name')}
              rows={undefined}
              readOnly={readOnly}
              maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
              id="name"
            />
            <TextInput
              label={t('gpt-description-label')}
              required={true}
              placeholder={t('gpt-description-placeholder')}
              inputType="textarea"
              {...register('description')}
              rows={5}
              readOnly={readOnly}
              maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
              id="description"
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
            />
          </section>
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-6 mt-6">
        <TextInput
          label={t('gpt-specification-label')}
          required={true}
          placeholder={t('gpt-specification-placeholder')}
          inputType="textarea"
          {...register('specification')}
          rows={7}
          readOnly={readOnly}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          id="specification"
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
                    label=""
                    required={false}
                    placeholder={index === 0 ? t('prompt-suggestion-placeholder') : undefined}
                    inputType="textarea"
                    {...register(`promptSuggestions.${index}.content`)}
                    rows={2}
                    onBlur={updatePromptSuggestions}
                    readOnly={readOnly}
                    maxLength={undefined}
                    id={`promptSuggestions.${index}.content`}
                  />
                  {index === 0 ? (
                    <button
                      onClick={() => {
                        if (fields.length >= 10) {
                          toast.error(tToast('too-many-suggestions'));
                          return;
                        }
                        append({ content: '' });
                      }}
                      type="button"
                      aria-label="add prompt suggestion"
                    >
                      <PlusIcon className="text-primary" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        remove(index);
                        updatePromptSuggestions();
                      }}
                      aria-label={`delete ${index} prompt suggestion`}
                      className="flex items-center justify-center first:hidden"
                      type="button"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </section>
        <section className="mt-8"></section>
      </fieldset>

      {!readOnly && (
        <>
          <FileDrop
            setFiles={setFiles}
            onFileUploaded={handleNewFile}
            showUploadConfirmation={true}
            countOfFiles={initialFiles.length + _files.size}
            className="mt-8"
          />
          <FilesTable
            files={initialFiles ?? []}
            additionalFiles={_files}
            onDeleteFile={handleDeattachFile}
            toast={toast}
            showUploadConfirmation={true}
            className="mt-4"
          />
        </>
      )}
      {!isCreating && !readOnly && (
        <section className="mt-8">
          <h3 className="font-medium">{t('delete-gpt')}</h3>
          <p className="mt-4">{t('gpt-delete-description')}</p>
          <DestructiveActionButton
            className={cn(buttonDeleteClassName, 'mt-10')}
            modalDescription={t('gpt-delete-modal-description')}
            modalTitle={t('delete-gpt')}
            confirmText={tCommon('delete')}
            actionFn={handleDeleteCustomGpt}
          >
            {t('final-delete-gpt')}
          </DestructiveActionButton>
        </section>
      )}
      {isCreating && (
        <section className="mt-8 flex gap-4 items-center">
          <button
            className={cn(
              buttonSecondaryClassName,
              'hover:border-primary hover:bg-vidis-hover-green/20',
            )}
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
