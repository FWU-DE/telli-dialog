'use client';

import React from 'react';
import { type UserAndContext } from '@/auth/types';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { IMPRESSUM_URL, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from './const';
import { DropdownMenuItem } from '@ui/components/dropdown-menu';
import { SignOutIcon } from '@phosphor-icons/react';

async function logout() {
  window.location.assign('/api/auth/logout');
}

export function ProfileMenuContent({ userAndContext }: { userAndContext?: UserAndContext }) {
  const tCommon = useTranslations('common');
  const tLegal = useTranslations('legal');

  return (
    <>
      <DropdownMenuItem asChild>
        <Link href={PRIVACY_POLICY_URL} prefetch={false} target="_blank" rel="noopener noreferrer">
          {tLegal('privacy-policy')}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href={IMPRESSUM_URL} prefetch={false} target="_blank" rel="noopener noreferrer">
          {tLegal('imprint')}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href={TERMS_OF_USE_URL} prefetch={false} target="_blank" rel="noopener noreferrer">
          {tLegal('terms-of-use')}
        </Link>
      </DropdownMenuItem>
      {userAndContext !== undefined && (
        <>
          <hr className="border-gray-200 mx-2" />
          <DropdownMenuItem key="profile-menu-logout" onSelect={logout} className="text-primary">
            <SignOutIcon />
            {tCommon('logout')}
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}
