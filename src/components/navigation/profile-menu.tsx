'use client';

import LogoutButton from '@/app/(authed)/logout-button';
import { UserIcon } from '@/components/icons/user';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import React from 'react';
import { type UserAndContext } from '@/auth/types';
import Link from 'next/link';
import { IMPRESSUM_URL, PRIVACY_POLICY_URL } from './const';

type ProfileMenuProps = UserAndContext;

export default function ProfileMenu({ email, school }: ProfileMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="profileDropdown"
          className="focus:outline-none group hover:bg-light-gray rounded-enterprise-sm hover:bg-vidis-hover-green/20"
          title="Profil"
        >
          <UserIcon className="text-primary" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-20 flex flex-col gap-2 py-2 w-[256px] rounded-enterprise-md mb-4 bg-white shadow-dropdown"
        >
          <Link
            href={PRIVACY_POLICY_URL}
            className="text-vidis-hover-purple py-2 px-4 hover:underline"
          >
            Datenschutz
          </Link>
          <Link href={IMPRESSUM_URL} className="text-vidis-hover-purple py-2 px-4 hover:underline">
            Impressum
          </Link>
          {school === undefined && (
            <p className="py-2 px-4 truncate" title={email}>
              {email}
            </p>
          )}
          {school === undefined && <hr className="border-gray-200 mx-2" />}
          <div className="p-2 pl-4">
            <LogoutButton className="w-full text-primary hover:underline" />
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
