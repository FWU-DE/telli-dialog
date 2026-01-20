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

import { cn } from '@/utils/tailwind';
import { iconClassName } from '@/utils/tailwind/icon';
import { useTheme } from '../providers/theme-provider';
import { constructRootLayoutStyle } from '@/utils/tailwind/layout';

function ProfileMenuContent({ userAndContext }: { userAndContext?: UserAndContext }) {
  const t = useTranslations('legal');

  return (
    <>
      <Link
        href={PRIVACY_POLICY_URL}
        target="_blank"
        className="text-vidis-hover-purple py-2 px-4 hover:underline"
      >
        {t('privacy-policy')}
      </Link>
      <Link
        href={IMPRESSUM_URL}
        className="text-vidis-hover-purple py-2 px-4 hover:underline"
        target="_blank"
      >
        {t('imprint')}
      </Link>
      <Link
        href={TERMS_OF_USE_URL}
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
  const { designConfiguration } = useTheme();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="profileDropdown"
          className={cn('focus:outline-none group rounded-enterprise-sm', iconClassName)}
          title="Profil"
        >
          <UserIcon className="w-8 h-8" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-20 flex flex-col gap-2 py-2 w-[256px] rounded-enterprise-md mb-4 bg-white shadow-dropdown"
          style={constructRootLayoutStyle({ designConfiguration })}
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
  const { designConfiguration } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="More actions"
          className="flex items-center justify-center focus:outline-none group rounded-enterprise-sm hover:bg-secondary-hover min-w-8"
          title="More actions"
        >
          <DotsHorizontalIcon className="text-primary h-6 w-6" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-20 flex flex-col gap-2 py-2 w-[256px] rounded-enterprise-md mb-4 bg-white shadow-dropdown"
          style={constructRootLayoutStyle({ designConfiguration })}
        >
          {deleteButtonJSX && <DropdownMenu.Item asChild>{deleteButtonJSX}</DropdownMenu.Item>}
          {downloadButtonJSX && <DropdownMenu.Item asChild>{downloadButtonJSX}</DropdownMenu.Item>}
          {(deleteButtonJSX || downloadButtonJSX) && <hr className="border-gray-200 mx-2" />}
          <ProfileMenuContent userAndContext={userAndContext} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
