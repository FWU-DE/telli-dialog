'use client';

import LogoutButton from '@/app/(authed)/logout-button';
import { UserIcon } from '@/components/icons/user';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import React from 'react';
import { type UserAndContext } from '@/auth/types';
import Link from 'next/link';
import { IMPRESSUM_URL, PRIVACY_POLICY_URL } from './const';
import { useTranslations } from 'next-intl';
import DotsHorizontalIcon from '@/components/icons/dots-horizontal';

import { cn } from '@/utils/tailwind';
import { iconClassName } from '@/utils/tailwind/icon';
import { useTheme } from '../providers/theme-provider';
import { constructRootLayoutStyle } from '@/utils/tailwind/layout';
type ProfileMenuProps = UserAndContext;

export default function ProfileMenu({ email, school }: ProfileMenuProps) {
  const t = useTranslations('legal');
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

export function ThreeDotsProfileMenu({
  onDelete,
  onDownload,
  chatActive,
  hasMessages,
  downloadButtonJSX,
  deleteButtonJSX,
}: {
  onDelete?: () => void;
  onDownload?: () => void;
  chatActive: boolean;
  hasMessages: boolean;
  downloadButtonJSX: React.ReactNode;
  deleteButtonJSX: React.ReactNode;
}) {
  const { designConfiguration } = useTheme();
  const tLegal = useTranslations('legal');
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="More actions"
          className="flex self-end focus:outline-none group rounded-enterprise-sm hover:bg-secondary-hover min-w-8"
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
          {chatActive && hasMessages && onDelete && (
            <DropdownMenu.Item asChild>{deleteButtonJSX}</DropdownMenu.Item>
          )}
          {chatActive && hasMessages && onDownload && (
            <DropdownMenu.Item asChild>{downloadButtonJSX}</DropdownMenu.Item>
          )}
          {chatActive && hasMessages && <hr className="border-gray-200 mx-2" />}
          <Link
            href={PRIVACY_POLICY_URL}
            target="_blank"
            className="text-primary py-2 px-4 hover:underline"
          >
            {tLegal('privacy-policy')}
          </Link>
          <Link
            href={IMPRESSUM_URL}
            className="text-primary py-2 px-4 hover:underline"
            target="_blank"
          >
            {tLegal('imprint')}
          </Link>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function UnauthenticatedProfileMenu() {
  const t = useTranslations('legal');
  const { designConfiguration } = useTheme();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="profileDropdown"
          className={cn(iconClassName, 'focus:outline-none group rounded-enterprise-sm')}
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
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
