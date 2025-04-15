'use client';

import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import Checkbox from '@/components/common/checkbox';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import { useToast } from '@/components/common/toast';
import UploadImageToBeCroppedButton from '@/components/crop-uploaded-image/crop-upload-button';
import ChevronLeftIcon from '@/components/icons/chevron-left';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { CharacterAccessLevel, CharacterModel } from '@/db/schema';
import { deepEqual } from '@/utils/object';
import { cn } from '@/utils/tailwind';
import {
  buttonDeleteClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
} from '@/utils/tailwind/button';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { startTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import SelectLlmModelForm from '../../../_components/select-llm-model';
import { CreateNewCharacterFromTemplate } from '../../create-new-character-button';
import {
  deleteCharacterAction,
  updateCharacterAccessLevelAction,
  updateCharacterAction,
  updateCharacterPictureAction,
} from './actions';
import ShareContainer from './share-container';

type CharacterFormProps = CharacterModel & {
  maybeSignedPictureUrl: string | undefined;
  isCreating?: boolean;
};

const characterFormValuesSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  learningContext: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  competence: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  modelId: z.string(),
  schoolType: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  gradeLevel: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  subject: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),

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
  const readOnly = character.accessLevel === 'global';
  const maybeDefaultModelId =
    models.find((m) => m.name === DEFAULT_CHAT_MODEL)?.id ?? models[0]?.id;

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
      modelId: maybeDefaultModelId,
    },
  });

  const t = useTranslations('characters.form');
  const tToast = useTranslations('characters.toasts');
  const tCommon = useTranslations('common');

  const [optimisticAccessLevel, addOptimisticAccessLevel] = React.useOptimistic(
    character.accessLevel,
    (p, n: CharacterAccessLevel) => n,
  );

  function handleAccessLevelChange(value: boolean) {
      const accessLevel = value ? "school" : "private"
   
       startTransition(() => {
         addOptimisticAccessLevel(accessLevel);
       });
   

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
    deleteCharacterAction({
      characterId: character.id,
      pictureId: character.pictureId ?? undefined,
    })
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
    if (isCreating || readOnly) return;
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
  let shareChatElement: React.JSX.Element | undefined;
  let navigateBackElement: React.JSX.Element;
  if (isCreating) {
    navigateBackElement = (
      <button
        onClick={handleDeleteCharacter}
        className="flex gap-3 items-center text-primary hover:underline"
      >
        <ChevronLeftIcon />
        <span>{t('all-characters')}</span>
      </button>
    );
  } else {
    navigateBackElement = (
      <Link href={backUrl} className="flex gap-3 text-primary hover:underline items-center">
        <ChevronLeftIcon />
        <span>{t('all-characters')}</span>
      </Link>
    );
  }
  if (!isCreating && !readOnly) {
    shareChatElement = (
      <fieldset className="mt-12">
        <ShareContainer {...character} />
      </fieldset>
    );
  }
  let generalSettings: React.JSX.Element | undefined;

  if (!readOnly) {
    generalSettings = (
      <fieldset className="mt-16 flex flex-col gap-8">
        <h2 className="font-medium mb-2">{t('general-settings')}</h2>
        <div className="flex max-sm:flex-col gap-4 sm:gap-8">
          <Checkbox
            label={t('restriction-school')}
            checked={optimisticAccessLevel === 'school'}
            onCheckedChange={(value: boolean) => handleAccessLevelChange(value)}
          />
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
            <label htmlFor="school-type" className={cn(labelClassName, 'text-sm')}>
              <span className="text-coral">*</span> {t('school-type')}
            </label>
            <input
              id="school-type"
              className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
              {...register('schoolType')}
              maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
              onBlur={handleAutoSave}
              placeholder={t('school-type-placeholder')}
            />
          </div>
          <div className="flex flex-col gap-4">
            <label htmlFor="grade" className={cn(labelClassName, 'text-sm')}>
              <span className="text-coral">*</span> {t('grade')}
            </label>
            <input
              id="grade"
              className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
              {...register('gradeLevel')}
              maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
              placeholder={t('grade-placeholder')}
              onBlur={handleAutoSave}
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
              onBlur={handleAutoSave}
              placeholder={t('subject-placeholder')}
            />
          </div>
        </div>
      </fieldset>
    );
  }
  return (
    <form className="flex flex-col mb-8" onSubmit={handleSubmit(onSubmit)}>
      {navigateBackElement}
      {shareChatElement}
      <div className="flex felx-col justify-between">
        <h1 className="text-2xl mt-4 font-medium">
          {isCreating ? t('create-character') : character.name}
        </h1>

        {readOnly && (
          <CreateNewCharacterFromTemplate
            templateId={character.id}
            templatePictureId={character.pictureId ?? undefined}
          >
            <button
              title={t('copy-template')}
              className={cn(
                buttonPrimaryClassName,
                'min-w-max max-w-min h-11 flex gap-2 items-center',
              )}
              type="button"
            >
              <span>{t('copy-template')}</span>
            </button>
          </CreateNewCharacterFromTemplate>
        )}
      </div>
      {generalSettings}
      <fieldset className="flex flex-col gap-4 mt-16">
        <h2 className="font-medium mb-8">{t('character-settings')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8 md:gap-16">
          <div className="flex gap-8 flex-col">
            <div className="flex flex-col gap-4">
              <label htmlFor="name" className={cn(labelClassName, 'text-sm')}>
                <span className="text-coral">*</span> {t('character-name-label')}
              </label>
              <input
                id="name"
                readOnly={readOnly}
                {...register('name')}
                maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
                className={cn(
                  inputFieldClassName,
                  'focus:border-primary placeholder:text-gray-300',
                )}
                onBlur={handleAutoSave}
                placeholder={t('character-name-placeholder')}
              />
            </div>
            <div className="flex flex-col gap-4">
              <label htmlFor="description" className={cn(labelClassName, 'text-sm')}>
                <span className="text-coral">*</span> {t('character-description-label')}
              </label>
              <textarea
                id="description"
                rows={5}
                readOnly={readOnly}
                style={{ resize: 'none' }}
                {...register('description')}
                maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
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
        <div className="flex flex-col gap-4">
          <label htmlFor="competence" className={cn(labelClassName, 'text-sm')}>
            <span className="text-coral">*</span> {t('character-competence-label')}
          </label>
          <textarea
            id="competence"
            {...register('competence')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            rows={5}
            readOnly={readOnly}
            style={{ resize: 'none' }}
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            onBlur={handleAutoSave}
            placeholder={t('character-competence-placeholder')}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label htmlFor="learningContext" className={cn(labelClassName, 'text-sm')}>
            <span className="text-coral">*</span> {t('character-learning-context-label')}
          </label>
          <textarea
            id="learningContext"
            {...register('learningContext')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            rows={5}
            readOnly={readOnly}
            style={{ resize: 'none' }}
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            onBlur={handleAutoSave}
            placeholder={t('character-learning-context-placeholder')}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label htmlFor="specifications" className={cn(labelClassName, 'text-sm')}>
            {t('character-specification-label')}
          </label>
          <textarea
            id="specifications"
            {...register('specifications')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            rows={5}
            readOnly={readOnly}
            style={{ resize: 'none' }}
            className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
            onBlur={handleAutoSave}
            placeholder={t('character-specification-placeholder')}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label htmlFor="restrictions" className={cn(labelClassName, 'text-sm')}>
            {t('character-restriction-label')}
          </label>
          <textarea
            id="restrictions"
            {...register('restrictions')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            rows={5}
            readOnly={readOnly}
            style={{ resize: 'none' }}
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
