'use client';

import { buttonDeleteClassName } from '@/utils/tailwind/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/common/toast';
import { useRouter } from 'next/navigation';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { FileModel, SharedSchoolConversationModel } from '@/db/schema';
import { SharedSchoolChatFormValues, sharedSchoolChatFormValuesSchema } from '../schema';
import { deleteFileMappingAndEntity, updateSharedSchoolChat } from './actions';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import { cn } from '@/utils/tailwind';
import { dbDeleteSharedChatAction, linkFileToSharedSchoolChat } from '../actions';
import { deepCopy, deepEqual } from '@/utils/object';
import ShareContainer from './share-container';
import React from 'react';
import { useTranslations } from 'next-intl';
import { LocalFileState } from '@/components/chat/send-message-form';
import FileDrop from '@/components/forms/file-drop-area';
import FilesTable from '@/components/forms/file-upload-table';
import {
  SMALL_TEXT_INPUT_FIELDS_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import SelectLlmModelForm from '../../_components/select-llm-model';
import { TextInput } from '@/components/common/text-input';
import NavigateBack from '@/components/common/navigate-back';

export default function SharedSchoolChatEditForm({
  existingFiles,
  isCreating,
  ...sharedSchoolChat
}: SharedSchoolConversationModel & { existingFiles: FileModel[]; isCreating: boolean }) {
  const toast = useToast();
  const router = useRouter();

  const [_files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [initialFiles, setInitialFiles] = React.useState<FileModel[]>(existingFiles);
  const t = useTranslations('shared-chats.form');
  const tToast = useTranslations('shared-chats.toasts');
  const tCommon = useTranslations('common');

  const { models } = useLlmModels();

  const { register, handleSubmit, getValues, setValue } = useForm<SharedSchoolChatFormValues>({
    resolver: zodResolver(sharedSchoolChatFormValuesSchema),
    defaultValues: {
      ...sharedSchoolChat,
      description: sharedSchoolChat.description ?? '',
      learningContext: sharedSchoolChat.learningContext ?? '',
      specification: sharedSchoolChat.specification ?? '',
      restrictions: sharedSchoolChat.restrictions ?? '',
    },
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
    linkFileToSharedSchoolChat({ fileId: data.id, schoolChatId: sharedSchoolChat.id })
      .then()
      .catch(() => toast.error(tToast('edit-toast-error')));
  }

  function onSubmit(data: SharedSchoolChatFormValues) {
    updateSharedSchoolChat({ ...sharedSchoolChat, ...data })
      .then(() => {
        toast.success(tToast('edit-toast-success'));
      })
      .catch(() => {
        toast.error(tToast('edit-toast-error'));
      });
  }

  function handleDeleteSharedChat() {
    dbDeleteSharedChatAction({ id: sharedSchoolChat.id })
      .then(() => {
        toast.success(tToast('delete-toast-success'));
        router.push('/shared-chats');
      })
      .catch(() => {
        toast.error(tToast('delete-toast-error'));
      });
  }

  function handleAutoSave() {
    const data = getValues();
    const defaultData = { ...sharedSchoolChat, modelId: sharedSchoolChat.modelId };
    const newData = { ...data };

    const dataEquals = deepEqual(defaultData, newData);

    if (dataEquals) return;
    onSubmit(data);
  }

  function handleNavigateBack(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (isCreating) {
      handleDeleteSharedChat();
    }
    router.push('/shared-chats');
  }

  const navigateBackElement = (
    <NavigateBack label={t('all-dialogs')} onClick={handleNavigateBack} />
  );
  return (
    <>
      {navigateBackElement}
      <h1 className="text-2xl mt-4 font-medium mb-4">{sharedSchoolChat.name}</h1>
      <form
        className="flex flex-col gap-8 my-12"
        onSubmit={handleSubmit(onSubmit)}
        onBlur={handleAutoSave}
      >
        <ShareContainer {...sharedSchoolChat} />
        <h2 className="font-medium mt-8">{t('settings')}</h2>
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium">{tCommon('llm-model')}</label>
          <SelectLlmModelForm
            selectedModel={sharedSchoolChat.modelId}
            onValueChange={(value) => {
              setValue('modelId', value);
              handleAutoSave();
            }}
            models={models}
          />
        </div>

        <TextInput
          id="description"
          label={t('purpose')}
          inputType="text"
          required={true}
          {...register('description')}
          maxLength={SMALL_TEXT_INPUT_FIELDS_LIMIT}
        />

        <div className="grid grid-cols-3 gap-6">
          <TextInput
            id="school-type"
            label={t('school-type')}
            required={true}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            {...register('schoolType')}
          />

          <TextInput
            id="gradeLevel"
            label={t('grade')}
            required={true}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            {...register('gradeLevel')}
          />

          <TextInput
            id="subject"
            label={t('subject')}
            required={true}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            {...register('subject')}
          />
        </div>

        <TextInput
          id="learning-context"
          label={t('learning-context')}
          required={true}
          inputType="textarea"
          rows={5}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          {...register('learningContext')}
        />

        <TextInput
          id="specification"
          label={t('specification')}
          inputType="textarea"
          rows={5}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          {...register('specification')}
        />

        <TextInput
          id="restrictions"
          label={t('restrictions')}
          inputType="textarea"
          rows={5}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          {...register('restrictions')}
        />

        <FileDrop
          setFiles={setFiles}
          onFileUploaded={handleNewFile}
          showUploadConfirmation={true}
          countOfFiles={initialFiles.length + _files.size}
        />
        <FilesTable
          files={initialFiles ?? []}
          additionalFiles={_files}
          onDeleteFile={handleDeattachFile}
          toast={toast}
          showUploadConfirmation={true}
          className="p-4"
        />
        <section>
          <h3 className="font-medium mt-8">{t('delete-title')}</h3>
          <p className="text-dark-gray mt-4">{t('delete-description')}</p>
          <DestructiveActionButton
            className={cn(buttonDeleteClassName, 'mt-10')}
            modalDescription={t('delete-confirm')}
            modalTitle={t('delete-title')}
            confirmText={tCommon('delete')}
            actionFn={handleDeleteSharedChat}
          >
            {t('delete-button')}
          </DestructiveActionButton>
        </section>
      </form>
    </>
  );
}
