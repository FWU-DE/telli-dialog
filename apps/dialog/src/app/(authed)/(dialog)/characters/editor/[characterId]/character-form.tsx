'use client';

import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import Checkbox from '@/components/common/checkbox';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import { useToast } from '@/components/common/toast';
import UploadImageToBeCroppedButton from '@/components/crop-uploaded-image/crop-upload-button';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import {
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
} from '@/configuration-text-inputs/const';
import { CharacterAccessLevel, CharacterModel, FileModel } from '@shared/db/schema';
import { deepCopy, deepEqual } from '@/utils/object';
import { cn } from '@/utils/tailwind';
import {
  buttonDeleteClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
} from '@/utils/tailwind/button';
import { labelClassName } from '@/utils/tailwind/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { startTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import SelectLlmModelForm from '../../../_components/select-llm-model';
import {
  deleteCharacterAction,
  updateCharacterAccessLevelAction,
  updateCharacterAction,
  updateCharacterPictureAction,
} from './actions';
import ShareContainer from './share-container';
import { CopyContainer } from '../../../_components/copy-container';
import { LocalFileState } from '@/components/chat/send-message-form';
import { deleteFileMappingAndEntity, linkFileToCharacter } from '../../actions';
import { TextInput } from '@/components/common/text-input';
import NavigateBack from '@/components/common/navigate-back';
import { getZodFieldMetadataFn } from '@/components/forms/utils';
import { AttachedLinks } from '@/components/forms/attached-links';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { formLinks } from '@/utils/web-search/form-links';
import FileManagement from '@/components/forms/file-management';

type CharacterFormProps = CharacterModel & {
  maybeSignedPictureUrl: string | undefined;
  isCreating?: boolean;
  readOnly: boolean;
  existingFiles: FileModel[];
  initialLinks: WebsearchSource[];
  templateCharacterId?: string;
};

/**
 * Zod form configuration Info:
 * - If the field is required, set the min length to at least 1.
 * - If the field is nullable, it must not have a min length.
 * - behavior of the textInput component is based on the nullable property (required behavior vs optional behavior)
 * - the max length property controls the behavior of the textInput component and blocks user input if the max length is reached
 */
const characterFormValuesSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  learningContext: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS),
  competence: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS),
  modelId: z.string(),
  schoolType: z.string().nullable(),
  gradeLevel: z.string().nullable(),
  subject: z.string().nullable(),

  specifications: z.string().nullable(),
  restrictions: z.string().nullable(),
  initialMessage: z.string().nullable(),
  attachedLinks: formLinks,
});
type CharacterFormValues = z.infer<typeof characterFormValuesSchema>;

export default function CharacterForm({
  maybeSignedPictureUrl,
  isCreating = false,
  existingFiles,
  readOnly,
  initialLinks,
  templateCharacterId,
  ...character
}: CharacterFormProps) {
  const router = useRouter();
  const toast = useToast();

  const { models } = useLlmModels();
  const maybeDefaultModelId =
    models.find((m) => m.name === DEFAULT_CHAT_MODEL)?.id ?? models[0]?.id;

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    control,
    formState: { isValid },
  } = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormValuesSchema),
    defaultValues: {
      ...character,
      attachedLinks: initialLinks,
      modelId: maybeDefaultModelId,
    },
  });

  const [_files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [initialFiles, setInitialFiles] = React.useState<FileModel[]>(existingFiles);
  const t = useTranslations('characters.form');
  const tToast = useTranslations('characters.toasts');
  const tCommon = useTranslations('common');
  const getZodFieldMetadata = getZodFieldMetadataFn(characterFormValuesSchema);

  const [optimisticAccessLevel, addOptimisticAccessLevel] = React.useOptimistic(
    character.accessLevel,
    (p, n: CharacterAccessLevel) => n,
  );

  function handleAccessLevelChange(value: boolean) {
    const accessLevel = value ? 'school' : 'private';

    startTransition(() => {
      addOptimisticAccessLevel(accessLevel);
    });

    updateCharacterAccessLevelAction({
      characterId: character.id,
      accessLevel,
    })
      .then(() => {
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('edit-toast-error'));
      });
  }

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
    linkFileToCharacter({ fileId: data.id, characterId: character.id })
      .then()
      .catch(() => toast.error(tToast('edit-toast-error')));
  }

  const backUrl = `/characters?visibility=${character.accessLevel}`;
  const { fields } = useFieldArray({
    control,
    name: 'attachedLinks',
  });

  function handlePictureUploadComplete(picturePath: string) {
    updateCharacterPictureAction({ picturePath, characterId: character.id })
      .then(() => {
        toast.success(tToast('image-toast-success'));
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('edit-toast-error'));
      });
  }

  function onSubmit(data: CharacterFormValues) {
    updateCharacterAction({
      characterId: character.id,
      ...data,
      attachedLinks: data.attachedLinks.map((p) => p?.link ?? ''),
      originalCharacterId: templateCharacterId ?? null,
    })
      .then(() => {
        if (!isCreating) {
          toast.success(tToast('edit-toast-success'));
        }
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('edit-toast-error'));
      });
  }

  function handleNavigateBack(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (isCreating) {
      handleDeleteCharacter();
      return;
    }
    router.push(backUrl);
  }

  function handleDeleteCharacter() {
    deleteCharacterAction({
      characterId: character.id,
      pictureId: character.pictureId ?? undefined,
    })
      .then(() => {
        // do not show any toast if the avatar is being created
        if (!isCreating) {
          toast.success(tToast('delete-toast-success'));
        }
        // replace instead of push to avoid showing a 404 when navigating back to the now non existing character
        router.replace(backUrl);
      })
      .catch(() => {
        toast.error(tToast('delete-toast-error'));
      });
  }

  function handleAutoSave() {
    if (isCreating || readOnly) return;
    const data = getValues();
    const defaultData = { ...character, promptSuggestions: [] };
    const newData = {
      ...defaultData,
      ...data,
      attachedLinks: data.attachedLinks.map((p) => p.link),
    };
    const dataEquals = deepEqual(defaultData, newData);
    if (dataEquals) return;
    onSubmit(data);
  }

  function handleCreateCharacter() {
    const data = getValues();
    onSubmit(data);
    toast.success(tToast('create-toast-success'));
    router.replace(backUrl);
  }
  const shareChatElement = !isCreating ? <ShareContainer {...character} /> : undefined;
  const copyContainer = readOnly ? (
    <CopyContainer
      templateId={character.id}
      templatePictureId={character.pictureId ?? undefined}
      startedAt={character.startedAt}
      maxUsageTimeLimit={character.maxUsageTimeLimit}
      translation_path="characters.form"
      redirectPath="characters"
    />
  ) : undefined;

  const generalSettings = (
    <fieldset className="mt-16 flex flex-col gap-8">
      <h2 className="font-medium mb-2">{t('general-settings')}</h2>
      <div className="flex gap-4">
        <Checkbox
          label={t('restriction-school')}
          checked={optimisticAccessLevel === 'school'}
          onCheckedChange={(value: boolean) => handleAccessLevelChange(value)}
        />
      </div>
      <div className="flex flex-col gap-4">
        <label className={labelClassName}>{tCommon('llm-model')}</label>
        <SelectLlmModelForm
          selectedModel={character.modelId}
          onValueChange={(value) => {
            setValue('modelId', value);
            handleAutoSave();
          }}
          models={models}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <TextInput
          id="school-type"
          label={t('school-type')}
          inputType="text"
          getValue={() => getValues('schoolType') ?? ''}
          {...getZodFieldMetadata('schoolType')}
          readOnly={readOnly}
          {...register('schoolType')}
          placeholder={t('school-type-placeholder')}
          onBlur={handleAutoSave}
        />
        <TextInput
          id="grade"
          label={t('grade')}
          inputType="text"
          readOnly={readOnly}
          getValue={() => getValues('gradeLevel') ?? ''}
          {...getZodFieldMetadata('gradeLevel')}
          {...register('gradeLevel')}
          placeholder={t('grade-placeholder')}
          onBlur={handleAutoSave}
        />
        <TextInput
          id="subject"
          label={t('subject')}
          inputType="text"
          readOnly={readOnly}
          getValue={() => getValues('subject') ?? ''}
          {...getZodFieldMetadata('subject')}
          {...register('subject')}
          placeholder={t('subject-placeholder')}
          onBlur={handleAutoSave}
        />
      </div>
    </fieldset>
  );

  return (
    <form className="flex flex-col mb-8" onSubmit={handleSubmit(onSubmit)}>
      <NavigateBack label={t('all-characters')} onClick={handleNavigateBack} />

      <h1 className="text-2xl font-medium mt-4">
        {isCreating ? t('create-character') : character.name}
      </h1>

      {copyContainer}
      {shareChatElement}
      {generalSettings}
      <fieldset className="flex flex-col gap-4 mt-12">
        <h2 className="font-medium mb-8">{t('character-settings')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8 md:gap-16">
          <div className="flex gap-4 flex-col">
            <TextInput
              id="name"
              label={t('character-name-label')}
              readOnly={readOnly}
              getValue={() => getValues('name') ?? ''}
              {...getZodFieldMetadata('name')}
              {...register('name')}
              placeholder={t('character-name-placeholder')}
              onBlur={handleAutoSave}
            />
            <TextInput
              id="description"
              label={t('character-description-label')}
              inputType="textarea"
              readOnly={readOnly}
              getValue={() => getValues('description') ?? ''}
              {...getZodFieldMetadata('description')}
              {...register('description')}
              placeholder={t('character-description-placeholder')}
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
            {!readOnly && (
              <UploadImageToBeCroppedButton
                uploadDirPath={`characters/${character.id}`}
                aspect={1}
                onUploadComplete={handlePictureUploadComplete}
                file_name="avatar"
                compressionOptions={{ maxHeight: 800 }}
              />
            )}
          </section>
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-6 mt-6">
        <TextInput
          id="competence"
          label={t('character-competence-label')}
          required={true}
          inputType="textarea"
          getValue={() => getValues('competence') ?? ''}
          {...getZodFieldMetadata('competence')}
          {...register('competence')}
          readOnly={readOnly}
          placeholder={t('character-competence-placeholder')}
          onBlur={handleAutoSave}
        />
        <TextInput
          id="learningContext"
          label={t('character-learning-context-label')}
          required={true}
          inputType="textarea"
          getValue={() => getValues('learningContext') ?? ''}
          {...getZodFieldMetadata('learningContext')}
          {...register('learningContext')}
          readOnly={readOnly}
          placeholder={t('character-learning-context-placeholder')}
          onBlur={handleAutoSave}
        />
        <TextInput
          id="initialMessage"
          label={t('character-initial-message-label')}
          inputType="textarea"
          getValue={() => getValues('initialMessage') ?? ''}
          {...getZodFieldMetadata('initialMessage')}
          {...register('initialMessage')}
          readOnly={readOnly}
          placeholder={t('character-initial-message-placeholder')}
          onBlur={handleAutoSave}
        />
        <TextInput
          id="specifications"
          label={t('character-specification-label')}
          inputType="textarea"
          getValue={() => getValues('specifications') ?? ''}
          {...getZodFieldMetadata('specifications')}
          {...register('specifications')}
          readOnly={readOnly}
          placeholder={t('character-specification-placeholder')}
          onBlur={handleAutoSave}
        />
        <TextInput
          id="restrictions"
          label={t('character-restriction-label')}
          inputType="textarea"
          getValue={() => getValues('restrictions') ?? ''}
          {...getZodFieldMetadata('restrictions')}
          {...register('restrictions')}
          readOnly={readOnly}
          placeholder={t('character-restriction-placeholder')}
          onBlur={handleAutoSave}
        />
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
              translationNamespace="characters.form"
            />
          </>
        )}
        <AttachedLinks
          fields={fields}
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
          <h3 className="font-medium">{t('delete-character')}</h3>
          <p className="mt-4">{t('character-delete-description')}</p>
          <DestructiveActionButton
            triggerButtonClassName={cn(buttonDeleteClassName, 'mt-10')}
            modalDescription={t('character-delete-modal-description')}
            modalTitle={t('delete-character')}
            confirmText={tCommon('delete')}
            actionFn={handleDeleteCharacter}
          >
            {t('final-delete-character')}
          </DestructiveActionButton>
        </section>
      )}
      {isCreating && (
        <section className="mt-8 flex gap-4 items-center">
          <button
            className={cn(buttonSecondaryClassName)}
            onClick={handleNavigateBack}
            type="button"
          >
            {tCommon('cancel')}
          </button>
          <button
            className={cn(buttonPrimaryClassName)}
            disabled={!isValid}
            onClick={handleCreateCharacter}
            type="button"
          >
            {t('create-character')}
          </button>
        </section>
      )}
    </form>
  );
}
