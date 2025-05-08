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
import PlusIcon from '@/components/icons/plus';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import Citation from '@/components/chat/sources/citation';
import { parseHyperlinks } from '@/utils/web-search/parsing';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
export default function SharedSchoolChatForm({
  existingFiles,
  isCreating,
  initalLinks,
  ...sharedSchoolChat
}: SharedSchoolConversationModel & {
  existingFiles: FileModel[];
  isCreating: boolean;
  initalLinks: WebsearchSource[];
}) {
  const toast = useToast();
  const router = useRouter();

  const [_files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [initialFiles, setInitialFiles] = React.useState<FileModel[]>(existingFiles);
  const [resolvedLinks, setResolvedLinks] = React.useState<Map<string, WebsearchSource>>(
    new Map(initalLinks.map((l) => [l.link, l])),
  );

  const [currentAttachedLinks, setCurrentAttachedLinks] = React.useState<string>('');

  const t = useTranslations('shared-chats.form');
  const tToast = useTranslations('shared-chats.toasts');
  const tCommon = useTranslations('common');

  const { models } = useLlmModels();

  const addResolvedLink = (source: WebsearchSource) => {
    setResolvedLinks(new Map(resolvedLinks.set(source.link, source)));
  };

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
      description: sharedSchoolChat.description ?? '',
      learningContext: sharedSchoolChat.learningContext ?? '',
      specification: sharedSchoolChat.specification ?? '',
      restrictions: sharedSchoolChat.restrictions ?? '',
      attachedLinks: initalLinks,
    },
  });

  const { fields, append, remove } = useFieldArray({
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
    linkFileToSharedSchoolChat({ fileId: data.id, schoolChatId: sharedSchoolChat.id })
      .then()
      .catch(() => toast.error(tToast('edit-toast-error')));
  }

  function onSubmit(data: SharedSchoolChatFormValues) {
    updateSharedSchoolChat({
      ...sharedSchoolChat,
      ...data,
      attachedLinks: data.attachedLinks.map((p) => p.link),
    })
      .then(() => {
        toast.success(tToast('edit-toast-success'));
      })
      .catch(() => {
        toast.error(tToast('edit-toast-error'));
      });
  }

  function appendLink(content: string) {
    const currentValues = getValues('attachedLinks');
    const isValidUrl = parseHyperlinks(content);
    if (!isValidUrl) {
      toast.error(tToast('invalid-url'));
      return;
    }
    setValue('attachedLinks', [
      ...currentValues,
      { link: content, name: '', type: 'websearch', content: '', hostname: '', error: false },
    ]);
    updateSharedSchoolChat({
      ...sharedSchoolChat,
      attachedLinks: [content, ...currentValues.map((p) => p.link)],
    })
      .then(() => {
        toast.success(tToast('edit-toast-success'));
        setCurrentAttachedLinks('');
      })
      .catch(() => {
        toast.error(tToast('edit-toast-error'));
      });
  }

  function handleDeleteLink(index: number) {
    const currentValues = getValues('attachedLinks');
    const newValues = currentValues.filter((_, i) => i !== index);
    setValue('attachedLinks', newValues);
    updateSharedSchoolChat({
      ...sharedSchoolChat,
      attachedLinks: newValues.map((p) => p.link),
    })
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
        if (!isCreating) {
          toast.success(tToast('delete-toast-success'));
        }
        router.push('/shared-chats');
      })
      .catch(() => {
        toast.error(tToast('delete-toast-error'));
      });
  }

  function handleAutoSave() {
    if (isCreating) return;
    const data = getValues();
    const defaultData = { ...sharedSchoolChat, modelId: sharedSchoolChat.modelId };
    const newData = { ...data, attachedLinks: data.attachedLinks.map((p) => p.link) };

    const dataEquals = deepEqual(defaultData, newData);

    if (dataEquals) return;
    onSubmit(data);
    router.refresh();
  }
  function handleCreateSharedChat() {
    const data = getValues();
    onSubmit(data);
    toast.success(tToast('create-toast-success'));
    router.push(`/shared-chats/${sharedSchoolChat.id}`);
  }
  function handleNavigateBack() {
    if (isCreating) {
      handleDeleteSharedChat();
    }
    router.push('/shared-chats');
  }

  return (
    <>
      <NavigateBack label={t('all-dialogs')} onClick={handleNavigateBack} />

      <h1 className="text-2xl font-medium mt-4">
        {isCreating ? t('title') : sharedSchoolChat.name}
      </h1>

      <form
        className="flex flex-col gap-8 my-12"
        onSubmit={handleSubmit(onSubmit)}
        onBlur={handleAutoSave}
      >
        {!isCreating && <ShareContainer {...sharedSchoolChat} />}
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

        {isCreating && (
          <TextInput
            id="name"
            label={t('name')}
            inputType="text"
            required={true}
            {...register('name')}
            maxLength={SMALL_TEXT_INPUT_FIELDS_LIMIT}
          />
        )}

        <TextInput
          id="description"
          label={t('purpose-label')}
          inputType="text"
          required={true}
          {...register('description')}
          maxLength={SMALL_TEXT_INPUT_FIELDS_LIMIT}
        />

        <div className="grid grid-cols-3 gap-6">
          <TextInput
            id="school-type"
            label={t('school-type-label')}
            required={true}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            {...register('schoolType')}
          />

          <TextInput
            id="gradeLevel"
            label={t('grade-label')}
            required={true}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            {...register('gradeLevel')}
          />

          <TextInput
            id="subject"
            label={t('subject-label')}
            required={true}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            {...register('subject')}
          />
        </div>

        <TextInput
          id="learning-context"
          label={t('learning-context-label')}
          required={true}
          inputType="textarea"
          rows={5}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          {...register('learningContext')}
        />

        <TextInput
          id="specification"
          label={t('specification-label')}
          inputType="textarea"
          rows={5}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          {...register('specification')}
        />

        <TextInput
          id="restrictions"
          label={t('restrictions-label')}
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
        <label className={cn(labelClassName, 'text-sm')}>{t('attached-links-label')}</label>
        <div className="flex flex-row gap-2">
          <input
            type="url"
            className={cn(
              inputFieldClassName,
              'focus:border-primary placeholder:text-gray-300 flex-1',
            )}
            placeholder={t('attached-links-placeholder')}
            // prevent form default behavior of showing the toast
            onBlur={(e) => {
              e.stopPropagation();
            }}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            onChange={(e) => {
              setCurrentAttachedLinks(e.target.value);
            }}
            value={currentAttachedLinks}
          />
          <button
            type="button"
            className={cn(buttonPrimaryClassName, 'flex items-center gap-2')}
            onClick={(e) => {
              e.stopPropagation();
              appendLink(currentAttachedLinks);
            }}
          >
            <PlusIcon className="fill-primary-text" />
            {t('add-link')}
          </button>
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            {fields.map((field, index) => (
              <div className="flex flex-row gap-2" key={`${field.id}-${index}`}>
                <Citation
                  source={field}
                  className="bg-secondary/40 rounded-enterprise-md h-10"
                  handleDelete={() => handleDeleteLink(index)}
                  index={index}
                  sourceIndex={0}
                  addResolvedLink={addResolvedLink}
                />
              </div>
            ))}
          </div>
        </div>
        {!isCreating && (
          <section className="mt-8">
            <h3 className="font-medium">{t('delete-title')}</h3>
            <p className="mt-4">{t('delete-description')}</p>
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
        )}
        {isCreating && (
          <section className="mt-8 flex gap-4 items-center">
            <button
              className={cn(
                buttonSecondaryClassName,
                'hover:border-primary hover:bg-vidis-hover-green/20',
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
