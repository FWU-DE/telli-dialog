'use client';

import LogoutButton from '@/app/(authed)/logout-button';
import { UserIcon } from '@/components/icons/user';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import React from 'react';
import { type UserAndContext } from '@/auth/types';
import Link from 'next/link';
import { IMPRESSUM_URL, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from './const';
import { useTranslations } from 'next-intl';
import DotsHorizontalIcon from '@/components/icons/dots-horizontal';
import { usePortalContainer } from '@ui/components/portal-container';
import { Button } from '@ui/components/Button';


function MenuActionRow({ action }: { action: React.ReactElement<{ className?: string }> }) {
  const className = [
    'flex w-full h-auto items-center justify-start gap-2 p-2 pl-4 text-base font-normal bg-transparent border-none hover:bg-transparent hover:underline hover:text-primary',
    action.props.className,
  ]
    .filter(Boolean)
    .join(' ');
  const actionWithClasses = React.cloneElement(action, { className });

  return <DropdownMenu.Item asChild>{actionWithClasses}</DropdownMenu.Item>;
}

function ProfileMenuContent({ userAndContext }: { userAndContext?: UserAndContext }) {
  const t = useTranslations('legal');

  return (
    <>
      <Link
        href={PRIVACY_POLICY_URL}
        prefetch={false}
        target="_blank"
        className="text-vidis-hover-purple py-2 px-4 hover:underline"
      >
        {t('privacy-policy')}
      </Link>
      <Link
        href={IMPRESSUM_URL}
        prefetch={false}
        className="text-vidis-hover-purple py-2 px-4 hover:underline"
        target="_blank"
      >
        {t('imprint')}
      </Link>
      <Link
        href={TERMS_OF_USE_URL}
        prefetch={false}
        className="text-vidis-hover-purple py-2 px-4 hover:underline"
        target="_blank"
      >
        {t('terms-of-use')}
      </Link>
      {userAndContext !== undefined && (
        <>
          <hr className="border-gray-200 mx-2" />
          <div className="p-2 pl-4">
            <LogoutButton className="w-full text-primary hover:underline" />
          </div>
        </>
      )}
    </>
  );
}
export default function ProfileMenu({ userAndContext }: { userAndContext?: UserAndContext }) {
  const container = usePortalContainer();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="icon-round"
          aria-label="profileDropdown"
          className="text-primary"
          title="Profil"
        >
          <UserIcon className="size-8" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={container}>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-20 flex flex-col gap-2 py-2 w-[256px] rounded-enterprise-md mb-4 bg-white shadow-dropdown"
        >
          <ProfileMenuContent userAndContext={userAndContext} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function ThreeDotsProfileMenu({
  downloadButtonJSX,
  deleteButtonJSX,
  userAndContext,
}: {
  downloadButtonJSX?: ActionMenuElement;
  deleteButtonJSX?: ActionMenuElement;
  userAndContext?: UserAndContext;
}) {
  const container = usePortalContainer();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="More actions"
          className="flex items-center justify-center focus:outline-hidden group rounded-enterprise-sm hover:bg-primary min-w-8"
          title="More actions"
        >
          <DotsHorizontalIcon className="text-primary h-6 w-6" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={container}>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-20 flex flex-col gap-2 py-2 w-[256px] rounded-enterprise-md mb-4 bg-white shadow-dropdown"
        >
          {deleteButtonJSX && <MenuActionRow action={deleteButtonJSX} />}
          {downloadButtonJSX && <MenuActionRow action={downloadButtonJSX} />}
          {(deleteButtonJSX || downloadButtonJSX) && <hr className="border-gray-200 mx-2" />}
          <ProfileMenuContent userAndContext={userAndContext} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
