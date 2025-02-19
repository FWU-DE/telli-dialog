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

type CharacterFormProps = CharacterModel & {
  maybeSignedPictureUrl: string | undefined;
  isCreating?: boolean;
};

const characterFormValuesSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  learningContext: z.string().min(1),
  specifications: z.string().nullable(),
  competence: z.string().nullable(),
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

  const {
    register,
    handleSubmit,
    getValues,
    formState: { defaultValues, isValid },
  } = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormValuesSchema),
    defaultValues: {
      ...character,
      description: character.description ?? '',
      learningContext: character.learningContext ?? '',
    },
  });

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
        toast.error('Etwas ist beim Aktualisieren schief gelaufen.');
      });
  }

  const backUrl = `/characters?visibility=${character.accessLevel}`;

  function handlePictureUploadComplete(picturePath: string) {
    updateCharacterPictureAction({ picturePath, characterId: character.id })
      .then(() => {
        toast.success('Das Bild wurde erfolgreich hochgeladen.');
        router.refresh();
      })
      .catch(() => {
        toast.error('Etwas ist beim Aktualisieren des Dialogpartners schief gelaufen.');
      });
  }

  function onSubmit(data: CharacterFormValues) {
    updateCharacterAction({ characterId: character.id, ...data })
      .then(() => {
        if (!isCreating) {
          toast.success('Der Dialogpartner wurde erfolgreich aktualisiert.');
        }
        router.refresh();
        // router.push(backUrl);
      })
      .catch(() => {
        toast.error('Etwas ist beim Aktualisieren des Dialogpartners schief gelaufen.');
      });
  }

  function handleDeleteCharacter() {
    deleteCharacterAction({ characterId: character.id })
      .then(() => {
        // do not show any toast if the avatar is being created
        if (!isCreating) {
        }
        toast.success('Der Dialogpartner wurde erfolgreich gelöscht.');

        router.push(backUrl);
      })
      .catch(() => {
        toast.error('Etwas ist beim Löschen des Dialogpartners schief gelaufen.');
      });
  }

  function handleAutoSave() {
    if (isCreating) return;
    const data = getValues();
    const hasChanges = !deepEqual(data, defaultValues);
    if (!hasChanges) return;
    onSubmit(data);
  }

  function handleCreateCharacter() {
    const data = getValues();
    onSubmit(data);
    toast.success('Der Dialogpartner wurde erfolgreich erstellt.');
    router.replace(backUrl);
  }

  return (
    <form className="flex flex-col gap-8 mb-8" onSubmit={handleSubmit(onSubmit)}>
      {isCreating && (
        <button
          onClick={handleDeleteCharacter}
          className="flex gap-3 items-center text-primary hover:underline"
        >
          <ChevronLeftIcon />
          <span>Alle Dialogpartner</span>
        </button>
      )}
      {!isCreating && (
        <Link href={backUrl} className="flex gap-3 text-primary hover:underline items-center">
          <ChevronLeftIcon />
          <span>Alle Dialogpartner</span>
        </Link>
      )}
      <h1 className="text-2xl mt-4 font-medium">
        {isCreating ? 'Dialogpartner erstellen' : character.name}
      </h1>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8 md:gap-16">
          <div className="flex gap-8 flex-col">
            <label className={cn(labelClassName, 'text-sm')}>
              Für wen soll der Dialogpartner freigegeben werden?
            </label>
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
                <span>Keine Freigabe</span>
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
                <span>Für meine Schule</span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <label className={cn(labelClassName, 'text-sm')}>Wie heißt die Person?</label>
              <input
                {...register('name')}
                className={cn(
                  inputFieldClassName,
                  'focus:border-primary placeholder:text-gray-300',
                )}
                onBlur={handleAutoSave}
                placeholder="König Ludwig XIV"
              />
            </div>
            <div className="flex flex-col gap-4">
              <label className={cn(labelClassName, 'text-sm')}>
                Wie kann die Person in einem kurzen Satz beschrieben werden?
              </label>
              <input
                {...register('description')}
                className={cn(
                  inputFieldClassName,
                  'focus:border-primary placeholder:text-gray-300',
                )}
                onBlur={handleAutoSave}
                placeholder="Absolutistischer König, bekannt für seine prunkvolle Herrschaft."
              />
            </div>
          </div>
          <section className="h-full">
            <label className={cn(labelClassName, 'text-sm')}>Bild</label>
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
      </div>
      <div className="flex flex-col gap-4">
        <label className={cn(labelClassName, 'text-sm')}>
          Was ist die konkrete Unterrichtssituation?
        </label>
        <textarea
          {...register('learningContext')}
          rows={5}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          onBlur={handleAutoSave}
          placeholder='Die Lernenden sollen Ludwig XIV befragen, wie er zu seiner Aussage "Der Staat bin ich" kommt und was er damit konkret meint.'
        />
      </div>
      <div className="flex flex-col gap-4">
        <label className={cn(labelClassName, 'text-sm')}>
          Welche Kompetenzen sollen die Lernenden erwerben?
        </label>
        <textarea
          {...register('competence')}
          rows={5}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          onBlur={handleAutoSave}
          placeholder="Die Lernenden sollen das Selbstverständnis und Staatsverständnis eines absolutistischen Herrschers verstehen."
        />
      </div>
      <div className="flex flex-col gap-4">
        <label className={cn(labelClassName, 'text-sm')}>Was soll der Dialogpartner tun?</label>
        <textarea
          {...register('specifications')}
          rows={5}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          onBlur={handleAutoSave}
          placeholder="Antworte aus der Perspektive von König Ludwig XIV. Gib dich erhaben und stolz bzgl. deines Staatssystems."
        />
      </div>
      <div className="flex flex-col gap-4">
        <label className={cn(labelClassName, 'text-sm')}>
          Was soll der Dialogpartner nicht tun?
        </label>
        <textarea
          {...register('restrictions')}
          rows={5}
          className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
          onBlur={handleAutoSave}
          placeholder="Der Dialogpartner soll sich nicht außerhalb seiner Lebenswelt als Ludwig XIV bewegen und nicht außerhalb seines geschichtlichen Kontexts (Absolutismus im 17. Jahrhundert in Frankreich) antworten."
        />
      </div>
      {!isCreating && (
        <section className="mt-8">
          <h3 className="font-medium">Dialogpartner löschen</h3>
          <p className="mt-4">
            Beim Löschen des Dialogpartners werden alle damit verbundenen Konversationen
            unwiderruflich gelöscht.
          </p>
          <DestructiveActionButton
            className={cn(buttonDeleteClassName, 'mt-10')}
            modalDescription="Bist du sicher, dass du diesen Dialogpartner löschen möchten? Dabei werden alle mit diesem Dialogpartner verbundenen Konversationen unwiderruflich gelöscht."
            modalTitle="Dialogpartner löschen"
            confirmText="Löschen"
            actionFn={handleDeleteCharacter}
          >
            Dialogpartner endgültig löschen
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
            Abbrechen
          </button>
          <button
            className={cn(buttonPrimaryClassName)}
            disabled={!isValid}
            onClick={handleCreateCharacter}
            type="button"
          >
            Dialogpartner erstellen
          </button>
        </section>
      )}
    </form>
  );
}
