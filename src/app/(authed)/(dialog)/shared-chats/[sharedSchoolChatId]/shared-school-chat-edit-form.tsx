'use client';

import { buttonDeleteClassName } from '@/utils/tailwind/button';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/common/toast';
import { useRouter } from 'next/navigation';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { SharedSchoolConversationModel } from '@/db/schema';
import { SharedSchoolChatFormValues, sharedSchoolChatFormValuesSchema } from '../schema';
import { updateSharedSchoolChat } from './actions';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import { cn } from '@/utils/tailwind';
import { deleteSharedChatAction } from '../actions';
import { deepEqual } from '@/utils/object';
import ShareContainer from './share-container';
import * as Select from '@radix-ui/react-select';
import ChevronDownIcon from '@/components/icons/chevron-down';
import React from 'react';
import { useTranslations } from 'next-intl';
import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';

export default function SharedSchoolChatEditForm({
  ...sharedSchoolChat
}: SharedSchoolConversationModel) {
  const toast = useToast();
  const router = useRouter();

  const t = useTranslations('shared-chats.form');
  const tToasts = useTranslations('shared-chats.toasts');
  const tCommon = useTranslations('common');

  const { models } = useLlmModels();

  const { register, handleSubmit, getValues, setValue } = useForm<SharedSchoolChatFormValues>({
    resolver: zodResolver(sharedSchoolChatFormValuesSchema),
    defaultValues: {
      ...sharedSchoolChat,
    },
  });

  function onSubmit(data: SharedSchoolChatFormValues) {
    updateSharedSchoolChat({ ...sharedSchoolChat, ...data })
      .then(() => {
        toast.success(tToasts('edit-toast-success'));
        router.refresh();
      })
      .catch(() => {
        toast.error(tToasts('edit-toast-error'));
      });
  }

  function handleDeleteSharedChat() {
    deleteSharedChatAction({ id: sharedSchoolChat.id })
      .then(() => {
        toast.success(tToasts('delete-toast-success'));
        router.push('/shared-chats');
      })
      .catch(() => {
        toast.error(tToasts('delete-toast-error'));
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

  return (
    <form
      className="flex flex-col gap-8 my-12"
      onSubmit={handleSubmit(onSubmit)}
      onBlur={handleAutoSave}
    >
      <ShareContainer {...sharedSchoolChat} />
      <h2 className="font-medium mt-8">{t('settings')}</h2>
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-4 h-full">
          <label className="text-sm">
            <span className="text-coral">*</span> {t('model-label')}
          </label>
          <Select.Root
            onValueChange={(value) => {
              setValue('modelId', value);
              handleAutoSave();
            }}
            defaultValue={sharedSchoolChat.modelId}
          >
            <Select.Trigger
              aria-label={tCommon('llm-model')}
              className="flex items-center justify-between w-full py-2 pl-4 pr-4 bg-white border border-gray-200 focus:border-primary rounded-enterprise-md focus:outline-none"
            >
              <Select.Value />
              <ChevronDownIcon aria-hidden="true" className="w-4 h-4 text-primary ms-2" />
              <span className="sr-only">{tCommon('llm-model')}</span>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-enterprise-md shadow-dropdown w-full">
                <Select.ScrollUpButton className="py-2 text-gray-500">▲</Select.ScrollUpButton>
                <Select.Viewport className="p-1">
                  {models
                    .filter((m) => m.priceMetadata.type === 'text')
                    .filter((m) => !m.name.includes('mistral'))
                    .map((model) => (
                      <Select.Item
                        key={model.id}
                        value={model.id}
                        className="px-4 py-2 cursor-pointer outline-none hover:bg-vidis-hover-green/20 rounded-enterprise-md transition"
                      >
                        <Select.ItemText>{model.displayName}</Select.ItemText>
                      </Select.Item>
                    ))}
                </Select.Viewport>
                <Select.ScrollDownButton className="py-2 text-gray-500">▼</Select.ScrollDownButton>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <label htmlFor="description" className={cn(labelClassName, 'text-sm')}>
          <span className="text-coral">*</span> {t('purpose')}
        </label>
        <input
          id="description"
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('description')}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
        />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="flex flex-col gap-4">
          <label htmlFor="school-type" className={cn(labelClassName, 'text-sm')}>
            <span className="text-coral">*</span> {t('school-type')}
          </label>
          <input
            id="school-type"
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('schoolType')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label htmlFor="gradeLevel" className={cn(labelClassName, 'text-sm')}>
            <span className="text-coral">*</span> {t('grade')}
          </label>
          <input
            id="gradeLevel"
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('gradeLevel')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label htmlFor="subject" className={cn(labelClassName, 'text-sm')}>
            <span className="text-coral">*</span> {t('subject')}
          </label>
          <input
            id="subject"
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('subject')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <label htmlFor="learning-context" className={cn(labelClassName, 'text-sm')}>
          <span className="text-coral">*</span> {t('learning-context')}
        </label>
        <textarea
          id="learning-context"
          rows={5}
          style={{ resize: 'none' }}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('learningContext')}
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
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
        />
      </div>
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
  );
}
