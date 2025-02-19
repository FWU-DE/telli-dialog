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

export default function SharedSchoolChatEditForm({
  ...sharedSchoolChat
}: SharedSchoolConversationModel) {
  const toast = useToast();
  const router = useRouter();
  const { models } = useLlmModels();

  const [selectedModel, setSelectedModel] = React.useState(sharedSchoolChat.modelId);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { defaultValues },
  } = useForm<SharedSchoolChatFormValues>({
    resolver: zodResolver(sharedSchoolChatFormValuesSchema),
    defaultValues: {
      ...sharedSchoolChat,
    },
  });

  function onSubmit(data: SharedSchoolChatFormValues) {
    updateSharedSchoolChat({ ...sharedSchoolChat, ...data, modelId: selectedModel })
      .then(() => {
        toast.success('Der Klassendialog wurde erfolgreich aktualisiert.');
        router.refresh();
      })
      .catch(() => {
        toast.error('Der Klassendialog konnte nicht aktualisiert werden.');
      });
  }

  function handleDeleteSharedChat() {
    deleteSharedChatAction({ id: sharedSchoolChat.id })
      .then(() => {
        toast.success('Der Klassendialog wurde erfolgreich gelöscht.');
        router.push('/shared-chats');
      })
      .catch(() => {
        toast.error('Der Klassendialog konnte nicht gelöscht werden.');
      });
  }

  function handleAutoSave() {
    const data = getValues();
    const dataEquals = deepEqual(
      { ...defaultValues, modelId: sharedSchoolChat.modelId },
      { ...data, modelId: selectedModel },
    );

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
      <h2 className="font-medium mt-8">Einstellungen</h2>
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-4 h-full">
          <label className="text-sm">Sprachmodel</label>
          <Select.Root
            onValueChange={(modelId) => {
              setSelectedModel(modelId);
              handleAutoSave();
            }}
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
        <label className={cn(labelClassName, 'text-sm')}>Beschreibung</label>
        <input
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('description')}
        />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>Schultyp</label>
          <input
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('schoolType')}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>Klassenstufe</label>
          <input
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('gradeLevel')}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>Fach</label>
          <input
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            {...register('subject')}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <label className={cn(labelClassName, 'text-sm')}>
          Was ist die konkrete Unterrichtssituation?
        </label>
        <textarea
          rows={5}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('learningContext')}
        />
      </div>
      <div className="flex flex-col gap-4">
        <label className={cn(labelClassName, 'text-sm')}>Was soll der KI-Chatbot tun?</label>
        <textarea
          rows={5}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('specification')}
        />
      </div>
      <div className="flex flex-col gap-4">
        <label className={cn(labelClassName, 'text-sm')}>Was soll der KI-Chatbot nicht tun?</label>
        <textarea
          rows={5}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          {...register('restrictions')}
        />
      </div>
      <section>
        <h3 className="font-medium mt-8">Dialog löschen</h3>
        <p className="text-dark-gray mt-4">
          Beim Löschen des Dialogs werden alle damit verbundenen Konversationen unwiderruflich
          gelöscht.
        </p>
        <DestructiveActionButton
          className={cn(buttonDeleteClassName, 'mt-10')}
          modalDescription="Sind Sie sicher, dass Sie diesen Klassendialog löschen möchten? Dabei werden alle mit diesem Dialog verbundenen Konversationen unwiderruflich gelöscht."
          modalTitle="Klassendialog löschen"
          confirmText="Löschen"
          actionFn={handleDeleteSharedChat}
        >
          Dialog endgültig löschen
        </DestructiveActionButton>
      </section>
    </form>
  );
}
