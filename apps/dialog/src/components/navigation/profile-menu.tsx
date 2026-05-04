'use client';

import LogoutButton from '@/app/(authed)/logout-button';
import { UserIcon } from '@/components/icons/user';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import React from 'react';
import { type UserAndContext } from '@/auth/types';
import Link from 'next/link';
import { IMPRESSUM_URL, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from './const';
import { useTranslations } from 'next-intl';
import { usePortalContainer } from '@ui/components/portal-container';
import { Button } from '@ui/components/Button';
import { DotsThreeIcon } from '@phosphor-icons/react';

function MenuActionRow({ action }: { action: React.ReactNode }) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  function handleSelect(event: Event) {
    const childElement = contentRef.current?.querySelector<HTMLElement>(
      'button, a, [role="button"]',
    );

    if (childElement) {
      event.preventDefault();
      childElement.click();
    }
  }

  return (
    <DropdownMenu.Item onSelect={handleSelect}>
      <div
        ref={contentRef}
        className="flex p-2 pl-4 [&_button]:h-auto [&_button]:justify-start [&_button]:border-none [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-0 [&_button]:flex-row [&_button]:gap-2 [&_button]:text-base [&_button]:font-normal [&_button:hover]:bg-transparent [&_button:hover]:underline [&_button:hover]:text-primary"
      >
        {action}
      </div>
    </DropdownMenu.Item>
  );
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
          className="z-300 flex flex-col gap-2 py-2 w-[256px] rounded-enterprise-md mb-4 bg-white shadow-dropdown"
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
  downloadButtonJSX?: React.ReactNode;
  deleteButtonJSX?: React.ReactNode;
  userAndContext?: UserAndContext;
}) {
  const container = usePortalContainer();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="More actions"
          title="More actions"
          className="size-10 rounded-full inline-flex items-center justify-center text-primary hover:bg-muted dark:hover:bg-muted/50 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <DotsThreeIcon weight="bold" className="size-6" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={container}>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-300 flex flex-col gap-2 py-2 w-[256px] rounded-enterprise-md mb-4 bg-white shadow-dropdown"
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
