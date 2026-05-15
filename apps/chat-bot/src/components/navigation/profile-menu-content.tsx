import React from 'react';
import { type UserAndContext } from '@/auth/types';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LogoutButton from '@/app/(authed)/logout-button';
import { IMPRESSUM_URL, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from './const';

export function ProfileMenuContent({ userAndContext }: { userAndContext?: UserAndContext }) {
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
