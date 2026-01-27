'use client';

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
import { AccessLevel, CharacterWithShareDataModel, FileModel } from '@shared/db/schema';
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
import { deleteFileMappingAndEntityAction, linkFileToCharacterAction } from '../../actions';
import { TextInput } from '@/components/common/text-input';
import NavigateBack from '@/components/common/navigate-back';
import { getZodStringFieldMetadataFn } from '@/components/forms/utils';
import { AttachedLinks } from '@/components/forms/attached-links';
import { WebsearchSource } from '@/app/api/webpage-content/types';
import { formLinks } from '@/utils/web-search/form-links';
import FileManagement from '@/components/forms/file-management';
import { useFederalState } from '@/components/providers/federal-state-provider';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';

type CharacterFormProps = CharacterWithShareDataModel & {
  maybeSignedPictureUrl: string | undefined;
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
  ...character
}: CharacterFormProps) {
  const router = useRouter();
  const toast = useToast();
  const federalState = useFederalState();

  const { models } = useLlmModels();
  const maybeDefaultModelId = getDefaultModel(models)?.id;

  const isCharacterModelAvailable =
    character.modelId && models.some((m) => m.id === character.modelId);
  const selectedModelId = isCharacterModelAvailable ? character.modelId : maybeDefaultModelId;

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
      modelId: selectedModelId,
    },
  });

  const [_files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [initialFiles, setInitialFiles] = React.useState<FileModel[]>(existingFiles);
  const t = useTranslations('characters.form');
  const tToast = useTranslations('characters.toasts');
  const tCommon = useTranslations('common');
  const getZodStringFieldMetadata = getZodStringFieldMetadataFn(characterFormValuesSchema);

  const [optimisticAccessLevel, addOptimisticAccessLevel] = React.useOptimistic(
    character.accessLevel,
    (p, n: AccessLevel) => n,
  );

  async function handleAccessLevelChange(value: boolean) {
    const accessLevel = value ? 'school' : 'private';

    startTransition(() => {
      addOptimisticAccessLevel(accessLevel);
    });

    const result = await updateCharacterAccessLevelAction({
      characterId: character.id,
      accessLevel,
    });
    if (result.success) {
      router.refresh();
    } else {
      toast.error(tToast('edit-toast-error'));
    }
  }

  async function handleDeattachFile(localFileId: string) {
    const fileId: string | undefined =
      _files.get(localFileId)?.fileId ?? initialFiles.find((f) => f.id === localFileId)?.id;
    if (fileId === undefined) return;

    // update the FE state
    setFiles((prev) => {
      const newMap = deepCopy(prev);
      newMap.delete(localFileId);
      return newMap;
    });

    setInitialFiles(initialFiles.filter((f) => f.id !== fileId));
    const deleteResult = await deleteFileMappingAndEntityAction({
      characterId: character.id,
      fileId,
    });
    if (!deleteResult.success) {
      toast.error(tToast('edit-toast-error'));
    }
  }

  async function handleNewFile(data: { id: string; name: string; file: File }) {
    const linkResult = await linkFileToCharacterAction({
      fileId: data.id,
      characterId: character.id,
    });
    if (!linkResult.success) {
      toast.error(tToast('edit-toast-error'));
    }
  }

  const backUrl = `/characters?visibility=${character.accessLevel}`;
  const { fields } = useFieldArray({
    control,
    name: 'attachedLinks',
  });

  async function handlePictureUploadComplete(picturePath: string) {
    const result = await updateCharacterPictureAction({ picturePath, characterId: character.id });
    if (result.success) {
      toast.success(tToast('image-toast-success'));
      router.refresh();
    } else {
      toast.error(tToast('edit-toast-error'));
    }
  }

  async function onSubmit(data: CharacterFormValues) {
    const result = await updateCharacterAction({
      id: character.id,
      ...data,
      attachedLinks: data.attachedLinks.map((p) => p?.link ?? ''),
    });
    if (result.success) {
      if (!isCreating) {
        toast.success(tToast('edit-toast-success'));
      }
      router.refresh();
    } else {
      toast.error(tToast('edit-toast-error'));
    }
  }

  function handleNavigateBack(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (isCreating) {
      handleDeleteCharacter();
      return;
    }
    router.push(backUrl);
  }

  async function handleDeleteCharacter() {
    const result = await deleteCharacterAction({ characterId: character.id });
    if (result.success) {
      // do not show any toast if the character is being created
      if (!isCreating) {
        toast.success(tToast('delete-toast-success'));
      }
      // replace instead of push to avoid showing a 404 when navigating back to the now non existing character
      router.replace(backUrl);
    } else {
      toast.error(tToast('delete-toast-error'));
    }
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
      {federalState?.featureToggles?.isShareTemplateWithSchoolEnabled && (
        <div className="flex gap-4">
          <Checkbox
            label={t('restriction-school')}
            checked={optimisticAccessLevel === 'school'}
            onCheckedChange={(value: boolean) => handleAccessLevelChange(value)}
            disabled={readOnly}
          />
        </div>
      )}
      <div className="flex flex-col gap-4">
        <label className={labelClassName}>{tCommon('llm-model')}</label>
        <SelectLlmModelForm
          selectedModel={selectedModelId}
          onValueChange={(value) => {
            setValue('modelId', value);
            handleAutoSave();
          }}
          models={models}
          disabled={readOnly}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <TextInput
          id="school-type"
          label={t('school-type')}
          inputType="text"
          getValue={() => getValues('schoolType') ?? ''}
          {...getZodStringFieldMetadata('schoolType')}
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
          {...getZodStringFieldMetadata('gradeLevel')}
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
          {...getZodStringFieldMetadata('subject')}
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
              {...getZodStringFieldMetadata('name')}
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
              {...getZodStringFieldMetadata('description')}
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
          {...getZodStringFieldMetadata('competence')}
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
          {...getZodStringFieldMetadata('learningContext')}
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
          {...getZodStringFieldMetadata('initialMessage')}
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
          {...getZodStringFieldMetadata('specifications')}
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
          {...getZodStringFieldMetadata('restrictions')}
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
