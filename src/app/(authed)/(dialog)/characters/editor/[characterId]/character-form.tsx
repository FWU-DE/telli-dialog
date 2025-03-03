'use client';

import { CharacterAccessLevel, CharacterModel } from '@/db/schema';
import {
  buttonDeleteClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
} from '@/utils/tailwind/button';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Checkbox from '@radix-ui/react-checkbox';
import CheckIcon from '@/components/icons/check';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  deleteCharacterAction,
  updateCharacterAccessLevelAction,
  updateCharacterAction,
  updateCharacterPictureAction,
} from './actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import React from 'react';
import Image from 'next/image';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import UploadImageToBeCroppedButton from '@/components/crop-uploaded-image/crop-upload-button';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import { cn } from '@/utils/tailwind';
import { deepEqual } from '@/utils/object';
import ChevronLeftIcon from '@/components/icons/chevron-left';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import SelectLlmModelForm from '../../../_components/select-llm-model';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import ShareContainer from './share-container';

type CharacterFormProps = CharacterModel & {
  maybeSignedPictureUrl: string | undefined;
  isCreating?: boolean;
};

const characterFormValuesSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  learningContext: z.string().min(1),
  competence: z.string().min(1),
  modelId: z.string(),
  schoolType: z.string().min(1),
  gradeLevel: z.string().min(1),
  subject: z.string().min(1),

  specifications: z.string().nullable(),
  restrictions: z.string().nullable(),
});
type CharacterFormValues = z.infer<typeof characterFormValuesSchema>;

export default function CharacterForm({
  maybeSignedPictureUrl,
  isCreating = false,
  ...character
}: CharacterFormProps) {
  const router = useRouter();
  const toast = useToast();

  const { models } = useLlmModels();

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { isValid },
  } = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormValuesSchema),
    defaultValues: {
      ...character,
      description: character.description ?? '',
      learningContext: character.learningContext ?? '',
      competence: character.competence ?? '',
      schoolType: character.schoolType ?? '',
      gradeLevel: character.gradeLevel ?? '',
      subject: character.subject ?? '',
    },
  });

  const t = useTranslations('characters.form');
  const tToast = useTranslations('characters.toasts');
  const tCommon = useTranslations('common');

  const [optimisticAccessLevel, addOptimisticAccessLevel] = React.useOptimistic(
    character.accessLevel,
    (p, n: CharacterAccessLevel) => n,
  );

  function handleAccessLevelChange(value: boolean, accessLevel: CharacterAccessLevel) {
    if (!value) return;
    addOptimisticAccessLevel(accessLevel);
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

  const backUrl = `/characters?visibility=${character.accessLevel}`;

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
    updateCharacterAction({ characterId: character.id, ...data })
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

  function handleDeleteCharacter() {
    deleteCharacterAction({ characterId: character.id })
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

  function handleAutoSave() {
    if (isCreating) return;
    const data = getValues();
    const hasChanges = !deepEqual(data, {
      ...character,
      description: character.description ?? '',
      learningContext: character.learningContext ?? '',
    });

    if (!hasChanges) return;
    onSubmit(data);
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
          <span>{t('all-characters')}</span>
        </button>
      )}
      {!isCreating && (
        <Link href={backUrl} className="flex gap-3 text-primary hover:underline items-center">
          <ChevronLeftIcon />
          <span>{t('all-characters')}</span>
        </Link>
      )}
      <h1 className="text-2xl mt-4 font-medium">
        {isCreating ? t('create-character') : character.name}
      </h1>
      {!isCreating && (
        <fieldset className="mt-12">
          <ShareContainer {...character} />
        </fieldset>
      )}
      <fieldset className="mt-16 flex flex-col gap-8">
        <h2 className="font-medium mb-2">{t('general-settings')}</h2>
        <label className={cn(labelClassName, 'text-sm')}>{t('character-visibility-label')}</label>
        <div className="flex max-sm:flex-col gap-4 sm:gap-8">
          <div className="flex gap-4">
            <Checkbox.Root
              className="CheckboxRoot border hover:border-primary hover:bg-vidis-hover-green/20 data-[state=checked]:border-primary data-[state=checked]:bg-vidis-hover-green/20 rounded-enterprise-sm h-6 w-6"
              id="c1"
              aria-label="Privat"
              checked={optimisticAccessLevel === 'private'}
              onCheckedChange={(value: boolean) => handleAccessLevelChange(value, 'private')}
            >
              <Checkbox.Indicator className="CheckboxIndicator">
                <CheckIcon className="text-primary w-6 h-4" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <span>{t('restriction-private')}</span>
          </div>
          <div className="flex gap-4">
            <Checkbox.Root
              className="CheckboxRoot border hover:border-primary hover:bg-vidis-hover-green/20 data-[state=checked]:border-primary data-[state=checked]:bg-vidis-hover-green/20 rounded-enterprise-sm h-6 w-6"
              id="c1"
              aria-label="Schulspezifisch"
              checked={optimisticAccessLevel === 'school'}
              onCheckedChange={(value: boolean) => handleAccessLevelChange(value, 'school')}
            >
              <Checkbox.Indicator className="CheckboxIndicator">
                <CheckIcon className="text-primary w-6 h-4" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <span>{t('restriction-school')}</span>
          </div>
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
      </fieldset>
      <fieldset className="flex flex-col gap-4 mt-16">
        <h2 className="font-medium mb-8">{t('character-settings')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8 md:gap-16">
          <div className="flex gap-8 flex-col">
            <div className="flex flex-col gap-4">
              <label className={cn(labelClassName, 'text-sm')}>
                <span className="text-coral">*</span> {t('character-name-label')}
              </label>
              <input
                {...register('name')}
                className={cn(
                  inputFieldClassName,
                  'focus:border-primary placeholder:text-gray-300',
                )}
                onBlur={handleAutoSave}
                placeholder={t('character-name-placeholder')}
              />
            </div>
            <div className="flex flex-col gap-4">
              <label className={cn(labelClassName, 'text-sm')}>
                <span className="text-coral">*</span> {t('character-description-label')}
              </label>
              <textarea
                rows={5}
                {...register('description')}
                className={cn(
                  inputFieldClassName,
                  'focus:border-primary placeholder:text-gray-300',
                )}
                onBlur={handleAutoSave}
                placeholder={t('character-description-placeholder')}
              />
            </div>
          </div>
          <section className="h-full">
            <label className={cn(labelClassName, 'text-sm')}>{tCommon('image')}</label>
            <div className="relative bg-light-gray rounded-enterprise-md flex items-center justify-center w-[170px] h-[170px] mt-4">
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
              uploadDirPath={`characters/${character.id}`}
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
          <label className={cn(labelClassName, 'text-sm')}>
            <span className="text-coral">*</span> {t('character-competence-label')}
          </label>
          <textarea
            {...register('competence')}
            rows={5}
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            onBlur={handleAutoSave}
            placeholder={t('character-competence-placeholder')}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>
            <span className="text-coral">*</span> {t('character-learning-context-label')}
          </label>
          <textarea
            {...register('learningContext')}
            rows={5}
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            onBlur={handleAutoSave}
            placeholder={t('character-learning-context-placeholder')}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>
            {t('character-specification-label')}
          </label>
          <textarea
            {...register('specifications')}
            rows={5}
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            onBlur={handleAutoSave}
            placeholder={t('character-specification-placeholder')}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label className={cn(labelClassName, 'text-sm')}>
            {t('character-restriction-label')}
          </label>
          <textarea
            {...register('restrictions')}
            rows={5}
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            onBlur={handleAutoSave}
            placeholder={t('character-restriction-placeholder')}
          />
        </div>
      </fieldset>
      {!isCreating && (
        <section className="mt-8">
          <h3 className="font-medium">{t('delete-character')}</h3>
          <p className="mt-4">{t('character-delete-description')}</p>
          <DestructiveActionButton
            className={cn(buttonDeleteClassName, 'mt-10')}
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
            {t('create-character')}
          </button>
        </section>
      )}
    </form>
  );
}
