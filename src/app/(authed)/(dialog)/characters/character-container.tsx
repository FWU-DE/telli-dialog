'use client';

import DestructiveActionButton from '@/components/common/destructive-action-button';
import { CharacterModel } from '@/db/schema';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import Image from 'next/image';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import { deleteCharacterAction } from './editor/[characterId]/actions';
import { useTranslations } from 'next-intl';

type CharacterContainerProps = CharacterModel & {
  currentUserId: string;
  maybeSignedPictureUrl: string | undefined;
};

export default function CharacterContainer({
  id,
  name,
  description,
  userId,
  currentUserId,
  maybeSignedPictureUrl,
}: CharacterContainerProps) {
  const router = useRouter();
  const toast = useToast();

  function handleDeleteCharacter() {
    deleteCharacterAction({ characterId: id })
      .then(() => {
        toast.success('Dialogpartner wurde erfolgreich gelöscht.');
        router.refresh();
      })
      .catch(() => {
        toast.error('Etwas ist beim Löschen des Dialogpartners schief gelaufen.');
      });
  }

  function handleNavigateToCharacterEditor(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/characters/editor/${id}`);
  }

  const t = useTranslations('characters.form');
  const tCommon = useTranslations('common');

  return (
    <Link
      href={`/characters/d/${id}`}
      className="rounded-enterprise-md border p-3 flex-col items-center gap-4 w-full hover:border-primary"
    >
      <figure className="flex border-[1px] border-light-gray rounded-[8px] items-center justify-center w-full relative overflow-hidden min-h-32 bg-light-gray">
        {maybeSignedPictureUrl !== undefined && (
          <Image src={maybeSignedPictureUrl} alt={`${name} Avatar`} fill className="object-cover" />
        )}
        {maybeSignedPictureUrl === undefined && <EmptyImageIcon />}
      </figure>
      <div className="flex items-center gap-2 w-full mt-2">
        <h3 className="text-truncate text-base font-medium truncate-custom">{name}</h3>
        {currentUserId === userId && (
          <>
            <div className="flex-grow" />
            <button
              type="button"
              onClick={handleNavigateToCharacterEditor}
              className="flex flex-col items-center justify-center p-2 rounded-enterprise-sm text-primary hover:bg-vidis-hover-green/20"
            >
              <PenIcon className="w-3 h-3" />
            </button>
            <DestructiveActionButton
              modalTitle={t('delete-character')}
              modalDescription={t('character-delete-modal-description')}
              confirmText={tCommon('delete')}
              actionFn={handleDeleteCharacter}
              triggerButtonClassName="border-transparent justify-center flex flex-col p-2 rounded-enterprise-sm hover:bg-vidis-hover-green/20"
            >
              <TrashIcon className="w-3 h-3 text-primary" />
            </DestructiveActionButton>
          </>
        )}
      </div>
      <span className={cn('text-sm font-normal text-gray-100 max-w-[256px]', truncateClassName)}>
        {description}
      </span>
    </Link>
  );
}

function PenIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.805 2.69463C12.065 2.43466 12.065 2.00139 11.805 1.75476L10.2452 0.194973C9.99861 -0.064991 9.56534 -0.064991 9.30537 0.194973L8.07888 1.4148L10.5785 3.91446M0 9.50035V12H2.49965L9.87196 4.62103L7.37231 2.12137L0 9.50035Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TrashIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="12"
      viewBox="0 0 10 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.33333 0.666667H7L6.33333 0H3L2.33333 0.666667H0V2H9.33333M0.666667 10.6667C0.666667 11.0203 0.807142 11.3594 1.05719 11.6095C1.30724 11.8595 1.64638 12 2 12H7.33333C7.68695 12 8.02609 11.8595 8.27614 11.6095C8.52619 11.3594 8.66667 11.0203 8.66667 10.6667V2.66667H0.666667V10.6667Z"
        fill="currentColor"
      />
    </svg>
  );
}
