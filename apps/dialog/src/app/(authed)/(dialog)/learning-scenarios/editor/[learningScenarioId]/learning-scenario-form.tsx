'use client';

import {
  buttonDeleteClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
} from '@/utils/tailwind/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { useToast } from '@/components/common/toast';
import { useRouter } from 'next/navigation';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { FileModel, LearningScenarioOptionalShareDataModel } from '@shared/db/schema';
import { SharedSchoolChatFormValues, sharedSchoolChatFormValuesSchema } from '../../schema';
import {
  removeFileFromLearningScenarioAction,
  updateLearningScenarioAccessLevelAction,
  updateLearningScenarioAction,
  updateLearningScenarioPictureAction,
  uploadAvatarPictureForLearningScenarioAction,
} from './actions';
import { logWarning } from '@shared/logging';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import { cn } from '@/utils/tailwind';
import { deleteLearningScenarioAction, linkFileToLearningScenarioAction } from '../../actions';
import { deepCopy, deepEqual } from '@/utils/object';
import ShareContainer from './share-container';
import React from 'react';
import { useTranslations } from 'next-intl';
import { LocalFileState } from '@/components/chat/send-message-form';
import FileManagement from '@/components/forms/file-management';
import SelectLlmModelForm from '../../../_components/select-llm-model';
import { TextInput } from '@/components/common/text-input';
import NavigateBack from '@/components/common/navigate-back';
import { labelClassName } from '@/utils/tailwind/input';
import CropImageAndUploadButton from '@/components/crop-uploaded-image/crop-image-and-upload-button';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import { AttachedLinks } from '@/components/forms/attached-links';
import { getZodStringFieldMetadataFn } from '@/components/forms/utils';
import AvatarPicture from '@/components/common/avatar-picture';
import { WebsearchSource } from '@shared/db/types';
import SharingSection from '@/components/forms/sharing-section';
import { useFederalState } from '@/components/providers/federal-state-provider';
import { buildGenericUrl } from '@/app/(authed)/(dialog)/utils.client';

export default function LearningScenarioForm({
  existingFiles,
  isCreating,
  initialLinks,
  maybeSignedPictureUrl,
  readOnly,
  ...sharedSchoolChat
}: LearningScenarioOptionalShareDataModel & {
  existingFiles: FileModel[];
  isCreating: boolean;
  initialLinks: WebsearchSource[];
  maybeSignedPictureUrl?: string;
  readOnly: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const federalState = useFederalState();

  const [_files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [initialFiles, setInitialFiles] = React.useState<FileModel[]>(existingFiles);

  const t = useTranslations('learning-scenarios.form');
  const tToast = useTranslations('learning-scenarios.toasts');
  const tCommon = useTranslations('common');

  const { models } = useLlmModels();

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    control,
    formState: { isValid },
  } = useForm<SharedSchoolChatFormValues>({
    resolver: zodResolver(sharedSchoolChatFormValuesSchema),
    defaultValues: {
      ...sharedSchoolChat,
      additionalInstructions: sharedSchoolChat.additionalInstructions ?? undefined,
      attachedLinks: initialLinks,
      pictureId: sharedSchoolChat.pictureId ?? '',
      isSchoolShared: sharedSchoolChat.accessLevel === 'school',
      isLinkShared: sharedSchoolChat.isLinkShared,
    },
  });
  const backUrl = buildGenericUrl(sharedSchoolChat.accessLevel, 'learning-scenarios');
  const { fields } = useFieldArray({
    control,
    name: 'attachedLinks',
  });

  async function handleSharingChange() {
    if (isCreating || readOnly) return;

    // Check if school sharing (accessLevel) changed
    const isSchoolShared = getValues('isSchoolShared');
    const newAccessLevel = isSchoolShared ? 'school' : 'private';

    if (newAccessLevel !== sharedSchoolChat.accessLevel) {
      const result = await updateLearningScenarioAccessLevelAction({
        learningScenarioId: sharedSchoolChat.id,
        accessLevel: newAccessLevel,
      });
      if (result.success) {
        router.refresh();
      } else {
        toast.error(tToast('edit-toast-error'));
      }
    }

    // Save other sharing changes (like isLinkShared) via autosave
    handleAutoSave();
  }

  async function handleDeattachFile(localFileId: string) {
    const fileId: string | undefined =
      _files.get(localFileId)?.fileId ?? initialFiles.find((f) => f.id === localFileId)?.id;
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
    if (fileId) {
      const result = await removeFileFromLearningScenarioAction({
        learningScenarioId: sharedSchoolChat.id,
        fileId,
      });
      if (!result.success) {
        toast.error(tToast('edit-toast-error'));
      }
    }
  }
  async function handleNewFile(data: { id: string; name: string; file: File }) {
    const result = await linkFileToLearningScenarioAction({
      fileId: data.id,
      learningScenarioId: sharedSchoolChat.id,
    });
    if (!result.success) {
      toast.error(tToast('edit-toast-error'));
    }
  }

  async function onSubmit(data: SharedSchoolChatFormValues) {
    const result = await updateLearningScenarioAction({
      learningScenarioId: sharedSchoolChat.id,
      data: {
        ...sharedSchoolChat,
        ...data,
        attachedLinks: data.attachedLinks.map((p) => p?.link ?? ''),
        description: data.description ?? '',
        studentExercise: data.studentExercise ?? '',
      },
    });
    if (result.success) {
      toast.success(tToast('edit-toast-success'));
    } else {
      toast.error(tToast('edit-toast-error'));
    }
  }

  async function handleUploadAvatarPicture(croppedImageBlob: Blob) {
    return await uploadAvatarPictureForLearningScenarioAction({
      learningScenarioId: sharedSchoolChat.id,
      croppedImageBlob,
    });
  }

  async function handlePictureUploadComplete(picturePath: string) {
    setValue('pictureId', picturePath);

    const result = await updateLearningScenarioPictureAction({
      picturePath,
      learningScenarioId: sharedSchoolChat.id,
    });

    if (result.success) {
      toast.success(tToast('image-toast-success'));
      router.refresh();
    } else {
      toast.error(tToast('edit-toast-error'));
    }
  }

  async function handleDeleteSharedChat() {
    const result = await deleteLearningScenarioAction({ id: sharedSchoolChat.id });
    if (result.success) {
      if (!isCreating) {
        toast.success(tToast('delete-toast-success'));
      }
      // replace instead of push to avoid showing a 404 when navigating back to the now non existing shared chat
      router.replace(backUrl);
    } else {
      toast.error(tToast('delete-toast-error'));
    }
  }

  function handleAutoSave() {
    if (isCreating) return;
    const data = getValues();
    const defaultData = { ...sharedSchoolChat, modelId: sharedSchoolChat.modelId };
    const newData = {
      ...defaultData,
      ...data,
      attachedLinks: data.attachedLinks.map((p) => p.link),
      description: data.description ?? '',
      studentExercise: data.studentExercise ?? '',
      isSchoolShared: undefined,
    };

    const dataEquals = deepEqual(defaultData, newData);
    if (dataEquals) return;
    onSubmit(data);
    router.refresh();
  }
  function handleCreateSharedChat() {
    const data = getValues();
    onSubmit(data);
    toast.success(tToast('create-toast-success'));
    router.replace(backUrl);
  }
  function handleNavigateBack() {
    if (isCreating) {
      handleDeleteSharedChat();
    }
    router.push(backUrl);
  }

  const getZodStringFieldMetadata = getZodStringFieldMetadataFn(sharedSchoolChatFormValuesSchema);

  const shareElement = !isCreating ? <ShareContainer {...sharedSchoolChat} /> : undefined;
  const generalSettings = (
    <fieldset className="flex flex-col gap-4 mt-8">
      <h2 className="font-medium mb-8">{t('settings')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8 md:gap-16">
        <div className="flex gap-4 flex-col">
          <div className="flex gap-4 flex-col">
            <label className="text-sm font-medium">{tCommon('llm-model')}</label>
            <SelectLlmModelForm
              selectedModel={sharedSchoolChat.modelId}
              onValueChange={(value) => {
                setValue('modelId', value);
                handleAutoSave();
              }}
              models={models}
              disabled={readOnly}
            />
          </div>
          <TextInput
            id="name"
            label={t('name')}
            readOnly={readOnly}
            getValue={() => getValues('name')}
            {...register('name')}
            {...getZodStringFieldMetadata('name')}
            placeholder={t('name-placeholder')}
            onBlur={handleAutoSave}
          />

          <TextInput
            id="description"
            label={t('purpose-label')}
            inputType="text"
            readOnly={readOnly}
            getValue={() => getValues('description') ?? ''}
            {...register('description')}
            {...getZodStringFieldMetadata('description')}
            placeholder={t('purpose-placeholder')}
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
          {!readOnly && (
            <CropImageAndUploadButton
              aspect={1}
              handleUploadAvatarPicture={handleUploadAvatarPicture}
              onUploadComplete={handlePictureUploadComplete}
              compressionOptions={{ maxHeight: 800 }}
            />
          )}
        </section>
      </div>
    </fieldset>
  );

  return (
    <>
      <NavigateBack label={t('all-dialogs')} onClick={handleNavigateBack} />

      <h1 className="text-3xl font-medium mt-4">
        {isCreating ? t('title') : sharedSchoolChat.name}
      </h1>

      <form className="flex flex-col gap-8 my-12" onSubmit={handleSubmit(onSubmit)}>
        {shareElement}
        {generalSettings}

        <TextInput
          id="student-excercise"
          label={t('student-excercise-label')}
          placeholder={t('student-excercise-placeholder')}
          getValue={() => getValues('studentExercise') ?? ''}
          inputType="textarea"
          rows={5}
          {...register('studentExercise')}
          {...getZodStringFieldMetadata('studentExercise')}
          onBlur={handleAutoSave}
          readOnly={readOnly}
        />

        <TextInput
          id="additional-instructions"
          label={t('additional-instructions-label')}
          placeholder={t('additional-instructions-placeholder')}
          inputType="textarea"
          rows={5}
          getValue={() => getValues('additionalInstructions') ?? ''}
          {...register('additionalInstructions')}
          {...getZodStringFieldMetadata('additionalInstructions')}
          onBlur={handleAutoSave}
          readOnly={readOnly}
        />
        <div className="grid grid-cols-3 gap-6">
          <TextInput
            id="school-type"
            label={t('school-type-label')}
            placeholder={t('school-type-placeholder')}
            getValue={() => getValues('schoolType') ?? ''}
            {...register('schoolType')}
            {...getZodStringFieldMetadata('schoolType')}
            onBlur={handleAutoSave}
            readOnly={readOnly}
          />

          <TextInput
            id="gradeLevel"
            label={t('grade-label')}
            placeholder={t('grade-placeholder')}
            getValue={() => getValues('gradeLevel') ?? ''}
            {...register('gradeLevel')}
            {...getZodStringFieldMetadata('gradeLevel')}
            onBlur={handleAutoSave}
            readOnly={readOnly}
          />

          <TextInput
            id="subject"
            label={t('subject-label')}
            placeholder={t('subject-placeholder')}
            getValue={() => getValues('subject') ?? ''}
            {...getZodStringFieldMetadata('subject')}
            {...register('subject')}
            onBlur={handleAutoSave}
            readOnly={readOnly}
          />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-md font-medium">{t('additional-assets-label')}</h2>
          <span className="text-base">{t('additional-assets-content')}</span>

          {!readOnly && (
            <FileManagement
              files={_files}
              setFiles={setFiles}
              initialFiles={initialFiles}
              onFileUploaded={handleNewFile}
              onDeleteFile={handleDeattachFile}
              readOnly={readOnly}
              translationNamespace="learning-scenarios.form"
            />
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
        </div>
        {federalState?.featureToggles?.isShareTemplateWithSchoolEnabled && (
          <SharingSection
            control={control}
            schoolSharingName="isSchoolShared"
            linkSharingName="isLinkShared"
            onShareChange={handleSharingChange}
            disabled={readOnly}
          />
        )}
        {!isCreating && !readOnly && (
          <section className="mt-8">
            <h3 className="font-medium">{t('delete-title')}</h3>
            <p className="mt-4">{t('delete-description')}</p>
            <DestructiveActionButton
              triggerButtonClassName={cn(buttonDeleteClassName, 'mt-10')}
              modalDescription={t('delete-confirm')}
              modalTitle={t('delete-title')}
              confirmText={tCommon('delete')}
              actionFn={handleDeleteSharedChat}
            >
              {t('delete-button')}
            </DestructiveActionButton>
          </section>
        )}
        {isCreating && (
          <section className="mt-8 flex gap-4 items-center">
            <button
              className={cn(
                buttonSecondaryClassName,
                'hover:border-primary hover:bg-primary-hover',
              )}
              onClick={handleNavigateBack}
              type="button"
            >
              {tCommon('cancel')}
            </button>
            <button
              className={cn(buttonPrimaryClassName)}
              disabled={!isValid}
              onClick={handleCreateSharedChat}
              type="button"
            >
              {t('button-create')}
            </button>
          </section>
        )}
      </form>
    </>
  );
}
