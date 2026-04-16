'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import AvatarPicture from '@/components/common/avatar-picture';
import { useTranslations } from 'next-intl';
import { ChatTextIcon, ImageSquareIcon } from '@phosphor-icons/react';
import { IconButton } from '@ui/components/IconButton';

type EntityCardProps = {
  name: string;
  description: string | null;
  avatarUrl: string | undefined;
  isOwned: boolean;
  href: string;
  chatHref?: string;
};

export default function EntityCard({
  name,
  description,
  avatarUrl,
  isOwned,
  href,
  chatHref,
}: EntityCardProps) {
  const t = useTranslations('entity-overview');
  const tCommon = useTranslations('common');

  return (
    <div className="rounded-enterprise-md border flex items-center w-full hover:border-primary bg-card has-[[data-card-link]:focus-visible]:ring-2 has-[[data-card-link]:focus-visible]:ring-ring">
      <Link
        href={href}
        aria-label={name}
        data-card-link
        className="flex items-center gap-4 grow min-w-0 p-4 outline-none"
      >
        <figure className="w-15 h-15 bg-light-gray rounded-full flex justify-center items-center shrink-0">
          {avatarUrl ? (
            <AvatarPicture src={avatarUrl} alt={`${name} Avatar`} variant="smallCircle" />
          ) : (
            <ImageSquareIcon className="w-8 h-8 text-primary" aria-hidden="true" weight="thin" />
          )}
        </figure>

        <div className="flex flex-col gap-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <h2 className={cn('font-medium leading-none py-0.5', truncateClassName)}>{name}</h2>
            {isOwned && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary shrink-0 uppercase tracking-wider">
                {t('badge-mine')}
              </span>
            )}
          </div>
          {description && (
            <span className={cn(truncateClassName, 'text-gray-600')}>{description}</span>
          )}
        </div>
      </Link>

      {chatHref && (
        <IconButton asChild className="shrink-0 p-1 mx-4">
          <Link href={chatHref} aria-label={tCommon('new-chat')}>
            <ChatTextIcon aria-hidden="true" className="w-6 h-6 text-primary" />
          </Link>
        </IconButton>
      )}
    </div>
  );
}
