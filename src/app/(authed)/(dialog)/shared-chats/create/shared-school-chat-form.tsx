'use client';

import { buttonPrimaryClassName, buttonSecondaryClassName } from '@/utils/tailwind/button';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { createNewSharedSchoolChatAction } from './actions';
import { useToast } from '@/components/common/toast';
import { useRouter } from 'next/navigation';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { SharedSchoolChatFormValues, sharedSchoolChatFormValuesSchema } from '../schema';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';
import React from 'react';
import {
  SMALL_TEXT_INPUT_FIELDS_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { LocalFileState } from '@/components/chat/send-message-form';
import FilesTable from '@/components/forms/file-upload-table';
import { FileModel } from '@/db/schema';
import FileDrop from '@/components/forms/file-drop-area';
import { linkFileToSharedSchoolChat } from '../actions';
import { deepCopy } from '@/utils/object';
import SelectLlmModelForm from '../../_components/select-llm-model';

export default function SharedSchoolChatCreateForm({
  existingFiles,
}: {
  existingFiles?: FileModel[];
}) {
  const toast = useToast();
  const router = useRouter();

  const { models } = useLlmModels();
  const t = useTranslations('shared-chats.form');
  const tToast = useTranslations('shared-chats.toasts');
  const tCommon = useTranslations('common');
  const tGeneral = useTranslations('shared-chats');

  const maybeDefaultModelId =
    models.find((m) => m.name === DEFAULT_CHAT_MODEL)?.id ?? models[0]?.id;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid, isSubmitting },
  } = useForm<SharedSchoolChatFormValues>({
    resolver: zodResolver(sharedSchoolChatFormValuesSchema),
    defaultValues: {
      name: '',
      modelId: maybeDefaultModelId,
    },
  });

  const [_files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());

  // no async action is called because so far the files are not linked in the db
  async function handleDeattachFile(localFileId: string) {
    setFiles((prev) => {
      const newMap = deepCopy(prev);
      const deleted = newMap.delete(localFileId);
      if (!deleted) {
        console.warn('Could not delete file');
      }
      return newMap;
    });
    return;
  }

  function onSubmit(data: SharedSchoolChatFormValues) {
    if (!data.modelId) {
      toast.error('Sie müssen ein Model auswählen.');
      return;
    }

    createNewSharedSchoolChatAction(data)
      .then((createdChat) => {
        toast.success(tToast('create-toast-success'));
        for (const [, file] of Array.from(_files)) {
          if (file.fileId === undefined) continue;
          linkFileToSharedSchoolChat({ fileId: file.fileId, schoolChatId: createdChat.id })
            .then(() => {})
            .catch(() => {
              toast.error(`Etwas ist beim Hochladen der Datei schief gelaufen.`);
            });
        }
        router.push(`/shared-chats/${createdChat.id}`);
      })
      .catch(() => {
        toast.error(tToast('create-toast-error'));
      });
  }

  return (
    <form className="flex flex-col gap-8 my-12" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="font-medium mt-8">{t('settings')}</h2>
      <div className="flex gap-4 w-full flex-wrap">
        <div className="flex flex-col gap-4 flex-grow">
          <label htmlFor="name" className={cn(labelClassName, 'text-sm')}>
            {t('name')} <span className="text-coral">*</span>
          </label>
          <input
            id="name"
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('name')}
            placeholder={t('name-placeholder')}
            maxLength={SMALL_TEXT_INPUT_FIELDS_LIMIT}
          />
        </div>

        <div className="flex flex-col gap-4 h-full">
          <label className="text-sm">
            <span className="text-coral">*</span> {t('model-label')}
          </label>

          <SelectLlmModelForm
            selectedModel={maybeDefaultModelId}
            onValueChange={(value) => {
              setValue('modelId', value);
            }}
            models={models}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <label htmlFor="purpose" className={cn(labelClassName, 'text-sm')}>
          {t('purpose')} <span className="text-coral">*</span>
        </label>
        <input
          id="purpose"
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('description')}
          placeholder={t('purpose-placeholder')}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          <label htmlFor="school-type" className={cn(labelClassName, 'text-sm')}>
            {t('school-type')} <span className="text-coral">*</span>
          </label>
          <input
            id="school-type"
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('schoolType')}
            placeholder={t('school-type-placeholder')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label htmlFor="grade" className={cn(labelClassName, 'text-sm')}>
            {t('grade')} <span className="text-coral">*</span>
          </label>
          <input
            id="grade"
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('gradeLevel')}
            placeholder={t('grade-placeholder')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label htmlFor="subject" className={cn(labelClassName, 'text-sm')}>
            {t('subject')} <span className="text-coral">*</span>
          </label>
          <input
            id="subject"
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('subject')}
            placeholder={t('subject-placeholder')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <label htmlFor="learning-context" className={cn(labelClassName, 'text-sm')}>
          {t('learning-context')} <span className="text-coral">*</span>
        </label>
        <textarea
          id="learning-context"
          rows={5}
          style={{ resize: 'none' }}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('learningContext')}
          placeholder={t('learning-context-placeholder')}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
        />
      </div>
      <div className="flex flex-col gap-4">
        <label htmlFor="specification" className={cn(labelClassName, 'text-sm')}>
          {t('specification')}
        </label>
        <textarea
          id="specification"
          rows={5}
          style={{ resize: 'none' }}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('specification')}
          placeholder={t('specification-placeholder')}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
        />
      </div>
      <div className="flex flex-col gap-4">
        <label htmlFor="restrictions" className={cn(labelClassName, 'text-sm')}>
          {t('restrictions')}
        </label>
        <textarea
          id="restrictions"
          rows={5}
          style={{ resize: 'none' }}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('restrictions')}
          placeholder={t('restrictions-placeholder')}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
        />
      </div>
      <FileDrop setFiles={setFiles} showUploadConfirmation countOfFiles={existingFiles?.length} />
      <FilesTable
        files={existingFiles ?? []}
        additionalFiles={_files}
        onDeleteFile={handleDeattachFile}
        toast={toast}
      />
      <div className="flex gap-4 mt-12">
        <Link
          href="/shared-chats"
          className={cn(
            buttonSecondaryClassName,
            'hover:border-primary hover:bg-vidis-hover-green/20',
          )}
        >
          {tCommon('cancel')}
        </Link>
        <button
          role="button"
          title={tGeneral('button-create')}
          disabled={!isValid || isSubmitting}
          className={buttonPrimaryClassName}
          type="submit"
        >
          {tGeneral('button-create')}
        </button>
      </div>
    </form>
  );
}
