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
import * as Select from '@radix-ui/react-select';
import ChevronDownIcon from '@/components/icons/chevron-down';
import { useTranslations } from 'next-intl';
import React from 'react';

export default function SharedSchoolChatCreateForm() {
  const toast = useToast();
  const router = useRouter();

  const { models, selectedModel: _selectedModel } = useLlmModels();
  const t = useTranslations('Chat.shared-chats.form');

  const [selectedModel, setSelectedModel] = React.useState(_selectedModel?.id);

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<SharedSchoolChatFormValues>({
    resolver: zodResolver(sharedSchoolChatFormValuesSchema),
    defaultValues: {
      name: '',
    },
  });

  function onSubmit(data: SharedSchoolChatFormValues) {
    if (selectedModel === undefined) {
      toast.error('Sie müssen ein Model auswählen.');
      return;
    }
    createNewSharedSchoolChatAction({ ...data, modelId: selectedModel })
      .then((createdChat) => {
        toast.success('Der Klassendialog wurde erfolgreich erstellt.');
        router.push(`/shared-chats/${createdChat.id}`);
      })
      .catch(() => {
        toast.error('Der Klassendialog konnte nicht erstellt werden.');
      });
  }

  return (
    <form className="flex flex-col gap-8 my-12" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="font-medium mt-8">{t('settings')}</h2>
      <div className="flex gap-4 w-full flex-wrap">
        <div className="flex flex-col gap-4 flex-grow">
          <label className={cn(labelClassName, 'text-sm')}>{t('name')}</label>
          <input
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('name')}
            placeholder={t('name-placeholder')}
          />
        </div>

        <div className="flex flex-col gap-4 h-full">
          <label className="text-sm">
            <span className="text-coral">*</span> {t('model-label')}
          </label>
          <Select.Root
            onValueChange={(value) => setSelectedModel(value)}
            value={selectedModel}
            defaultValue={selectedModel}
          >
            <Select.Trigger className="flex items-center justify-between w-full py-2 pl-4 pr-4 bg-white border border-gray-200 focus:border-primary rounded-enterprise-md focus:outline-none">
              <Select.Value />
              <ChevronDownIcon className="w-4 h-4 text-primary ms-2" />
            </Select.Trigger>

            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-enterprise-md shadow-dropdown w-full">
                <Select.ScrollUpButton className="py-2 text-gray-500">▲</Select.ScrollUpButton>
                <Select.Viewport className="p-1">
                  {models
                    .filter((m) => m.priceMetadata.type === 'text')
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
        <label className={cn(labelClassName, 'text-sm')}>
          <span className="text-coral">*</span> {t('purpose')}
        </label>
        <input
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('description')}
          placeholder={t('purpose-placeholder')}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>
            <span className="text-coral">*</span> {t('school-type')}
          </label>
          <input
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('schoolType')}
            placeholder={t('school-type-placeholder')}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>
            <span className="text-coral">*</span> {t('grade')}
          </label>
          <input
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('gradeLevel')}
            placeholder={t('grade-placeholder')}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>
            <span className="text-coral">*</span> {t('subject')}
          </label>
          <input
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('subject')}
            placeholder={t('subject-placeholder')}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <label className={cn(labelClassName, 'text-sm')}>
          <span className="text-coral">*</span> {t('learning-context')}
        </label>
        <textarea
          rows={5}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('learningContext')}
          placeholder={t('learning-context-placeholder')}
        />
      </div>
      <div className="flex flex-col gap-4">
        <label className={cn(labelClassName, 'text-sm')}>{t('specification')}</label>
        <textarea
          rows={5}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('specification')}
          placeholder={t('specification-placeholder')}
        />
      </div>
      <div className="flex flex-col gap-4">
        <label className={cn(labelClassName, 'text-sm')}>{t('restrictions')}</label>
        <textarea
          rows={5}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('restrictions')}
          placeholder={t('restrictions-placeholder')}
        />
      </div>
      <div className="flex gap-4 mt-12">
        <Link
          href="/shared-chats"
          className={cn(
            buttonSecondaryClassName,
            'hover:border-primary hover:bg-vidis-hover-green/20',
          )}
        >
          Abbrechen
        </Link>
        <button disabled={!isValid} className={buttonPrimaryClassName} type="submit">
          {t('title')}
        </button>
      </div>
    </form>
  );
}
