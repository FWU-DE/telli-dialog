'use client';

import { useRouter } from 'next/navigation';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { createNewCharacterAction } from './actions';
import { useToast } from '@/components/common/toast';
import { cn } from '@/utils/tailwind';
import PlusIcon from '@/components/icons/plus';

export default function CreateNewCharacterButton() {
  const router = useRouter();
  const toast = useToast();

  function handleNewGPT() {
    createNewCharacterAction()
      .then((newCharacter) => {
        router.push(`/characters/editor/${newCharacter.id}?create=true`);
      })
      .catch(() => {
        toast.error('Es konnte kein neuer Charakter erstellt werden.');
      });
  }

  return (
    <button
      onClick={handleNewGPT}
      className={cn(buttonPrimaryClassName, 'flex gap-2 items-center group py-2')}
    >
      <PlusIcon className="fill-primary-text w-3 h-3 group-hover:fill-secondary-text" />
      <span>Dialogpartner erstellen</span>
    </button>
  );
}
