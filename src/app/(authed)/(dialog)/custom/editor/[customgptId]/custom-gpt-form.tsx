'use client';

import { CharacterAccessLevel, CustomGptModel } from '@/db/schema';
import {
  buttonDeleteClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
} from '@/utils/tailwind/button';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  deleteCharacterAction,
  updateCharacterAccessLevelAction,
  updateCustomGptAction,
  updateCharacterPictureAction,
} from './actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import React, { startTransition } from 'react';
import Image from 'next/image';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import UploadImageToBeCroppedButton from '@/components/crop-uploaded-image/crop-upload-button';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import { cn } from '@/utils/tailwind';
import ChevronLeftIcon from '@/components/icons/chevron-left';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import Checkbox from '@/components/common/checkbox';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import TrashIcon from '@/components/icons/trash';
import PlusIcon from '@/components/icons/plus';

type CustomGptFormProps = CustomGptModel & {
  maybeSignedPictureUrl: string | undefined;
  isCreating?: boolean;
};

const characterFormValuesSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  specification: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  promptSuggestions: z.array(z.object({ content: z.string() })),
});
type CharacterFormValues = z.infer<typeof characterFormValuesSchema>;

export default function CustomGptForm({
  maybeSignedPictureUrl,
  isCreating = false,
  promptSuggestions,
  ...customGpt
}: CustomGptFormProps) {
  const router = useRouter();
  const toast = useToast();

  const { models } = useLlmModels();

  const maybeDefaultModelId =
    models.find((m) => m.name === DEFAULT_CHAT_MODEL)?.id ?? models[0]?.id;

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { isValid },
  } = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormValuesSchema),
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
  const t = useTranslations('custom-gpt.form');
  const tToast = useTranslations('custom-gpt.toasts');
  const tCommon = useTranslations('common');

  const [optimisticAccessLevel, addOptimisticAccessLevel] = React.useOptimistic(
    customGpt.accessLevel,
    (p, n: CharacterAccessLevel) => n,
  );

  function handleAccessLevelChange(value: boolean, accessLevel: CharacterAccessLevel) {
    if (!value) return;

    startTransition(() => {
      addOptimisticAccessLevel(accessLevel);
    });

    updateCharacterAccessLevelAction({
      characterId: customGpt.id,
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

  async function onSubmit(data: CharacterFormValues) {
    updateCustomGptAction({
      ...data,
      promptSuggestions: data.promptSuggestions?.map((p) => p.content),
      gptId:customGpt.id,
    })
      .then(() => {
        router.refresh();
      })
      .catch(() => {
        toast.error('Etwas ist beim Aktualisieren schief gelaufen.');
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
        router.refresh();
      })
      .catch((error) => {
        console.error({ error });
      });
  }

  const backUrl = `/custom?visibility=${customGpt.accessLevel}`;

  function handlePictureUploadComplete(picturePath: string) {
    updateCharacterPictureAction({ picturePath, characterId: customGpt.id })
      .then(() => {
        toast.success(tToast('image-toast-success'));
        router.refresh();
      })
      .catch(() => {
        toast.error(tToast('edit-toast-error'));
      });
  }


  function handleDeleteCharacter() {
    deleteCharacterAction({ characterId: customGpt.id })
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

  async function handleAutoSave() {
    if (isCreating) return;
    const data = getValues();
    await onSubmit(data);
  }

  function handleCreateCharacter() {
    const data = getValues();
    onSubmit(data);
    toast.success(tToast('create-toast-success'));
    router.replace(backUrl);
  }
  return (
    <form className="flex flex-col mb-8" onSubmit={handleSubmit(onSubmit)}>
      {isCreating && (
        <button
          onClick={handleDeleteCharacter}
          className="flex gap-3 items-center text-primary hover:underline"
        >
          <ChevronLeftIcon />
          <span>{t('all-gpts')}</span>
        </button>
      )}
      {!isCreating && (
        <Link href={backUrl} className="flex gap-3 text-primary hover:underline items-center">
          <ChevronLeftIcon />
          <span>{t('all-gpts')}</span>
        </Link>
      )}
      <h1 className="text-2xl mt-4 font-medium">{isCreating ? t('create-gpt') : customGpt.name}</h1>
      {/* {!isCreating && (
        <fieldset className="mt-12">
          <ShareContainer {...character} />
        </fieldset>
      )} */}
      <fieldset className="mt-16 flex flex-col gap-8">
        <label className={cn(labelClassName, 'text-sm')}>{t('gpt-visibility-label')}</label>
        <div className="flex max-sm:flex-col gap-4 sm:gap-8">
          <Checkbox
            label={t('restriction-private')}
            checked={optimisticAccessLevel === 'private'}
            onCheckedChange={(value: boolean) => handleAccessLevelChange(value, 'private')}
          />

          <Checkbox
            label={t('restriction-school')}
            checked={optimisticAccessLevel === 'school'}
            onCheckedChange={(value: boolean) => handleAccessLevelChange(value, 'school')}
          />
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-4 mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8 md:gap-16">
          <div className="flex gap-8 flex-col">
            <div className="flex flex-col gap-4">
              <label htmlFor="name" className={cn(labelClassName, 'text-sm')}>
                <span className="text-coral">*</span> {t('gpt-name-label')}
              </label>
              <input
                id="name"
                {...register('name')}
                maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
                className={cn(
                  inputFieldClassName,
                  'focus:border-primary placeholder:text-gray-300',
                )}
                onBlur={handleAutoSave}
                placeholder={t('gpt-name-placeholder')}
              />
            </div>
            <div className="flex flex-col gap-4">
              <label htmlFor="description" className={cn(labelClassName, 'text-sm')}>
                <span className="text-coral">*</span> {t('gpt-description-label')}
              </label>
              <textarea
                id="description"
                rows={5}
                style={{ resize: 'none' }}
                {...register('description')}
                maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
                className={cn(
                  inputFieldClassName,
                  'focus:border-primary placeholder:text-gray-300',
                )}
                onBlur={handleAutoSave}
                placeholder={t('gpt-description-placeholder')}
              />
            </div>
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
        <div className="flex flex-col gap-4">
          <label htmlFor="specifications" className={cn(labelClassName, 'text-sm')}>
            {t('gpt-specification-label')}
          </label>
          <textarea
            id="specification"
            {...register('specification')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            rows={7}
            style={{ resize: 'none' }}
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            onBlur={handleAutoSave}
            placeholder={t('gpt-specification-placeholder')}
          />
        </div>
        <section className="mt-8 flex flex-col gap-3 w-full">
            <h2 className="font-medium">Promptvorschläge hinzufügen</h2>
            <p className="text-dark-gray">
              Füge bis zu 10 Vorschläge für Prompts hinzu, die zufällig oberhalb des Eingabefelds im
              Dialog angezeigt werden.
            </p>
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-4 w-full pr-4">
              {fields.map((field, index) => {
                return (
                  <React.Fragment key={field.id}>
                    <textarea
                      rows={2}
                      {...register(`promptSuggestions.${index}.content`)}
                      className={cn(inputFieldClassName, 'resize-none')}
                      placeholder={
                        index === 0
                          ? t('prompt-suggestion-placeholder')
                          : undefined
                      }
                      onBlur={updatePromptSuggestions}
                    />
                    {index !== 0 && (
                      <button
                        onClick={() => {
                          remove(index);
                          updatePromptSuggestions();
                        }}
                        className="flex items-center justify-center first:hidden"
                        type="button"
                      >
                        <TrashIcon />
                      </button>
                    )}
                    {index === 0 && (
                      <button
                        onClick={() => {
                          if (fields.length >= 10) {
                            toast.error("Zuviel");
                            return;
                          }
                          append({ content: '' });
                        }}
                        type="button"
                        className=""
                      >
                        <PlusIcon className='text-primary'/>
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </section>
          <section className="mt-8"></section>
      </fieldset>
      {!isCreating && (
        <section className="mt-8">
          <h3 className="font-medium">{t('delete-gpt')}</h3>
          <p className="mt-4">{t('gpt-delete-description')}</p>
          <DestructiveActionButton
            className={cn(buttonDeleteClassName, 'mt-10')}
            modalDescription={t('gpt-delete-modal-description')}
            modalTitle={t('delete-gpt')}
            confirmText={tCommon('delete')}
            actionFn={handleDeleteCharacter}
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
            onClick={handleDeleteCharacter}
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
            {t('create-gpt')}
          </button>
        </section>
      )}
    </form>
  );
}
