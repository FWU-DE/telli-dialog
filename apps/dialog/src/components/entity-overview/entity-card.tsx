'use client';

import React from 'react';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import AvatarPicture from '@/components/common/avatar-picture';
import { useTranslations } from 'next-intl';
import { ChatTextIcon, ImageSquareIcon } from '@phosphor-icons/react';

type EntityCardProps = {
  name: string;
  description: string | null;
  avatarUrl: string | undefined;
  isOwned: boolean;
  onCardClick: () => void;
  onChatClick?: () => void;
};

export default function EntityCard({
  name,
  description,
  avatarUrl,
  isOwned,
  onCardClick,
  onChatClick,
}: EntityCardProps) {
  const t = useTranslations('entity-overview');
  const tCommon = useTranslations('common');

  function handleChatClick(e: React.MouseEvent) {
    e.stopPropagation();
    onChatClick?.();
  }

  return (
    <div
      onClick={onCardClick}
      className="rounded-enterprise-md border p-4 flex items-center gap-4 w-full hover:border-primary cursor-pointer bg-card"
      role="button"
      tabIndex={0}
      aria-label={name}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick();
        }
      }}
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
            <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary shrink-0 uppercase tracking-wider">
              {t('badge-mine')}
            </span>
          )}
        </div>
        {description && (
          <span className={cn(truncateClassName, 'text-gray-600')}>{description}</span>
        )}
      </div>

      <div className="grow" />

      {onChatClick && (
        <button
          type="button"
          aria-label={tCommon('new-chat')}
          onClick={handleChatClick}
          className="p-1 rounded-enterprise-sm hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChatTextIcon aria-hidden="true" className="w-6 h-6 text-primary" />
          <span className="sr-only">{tCommon('new-chat')}</span>
        </button>
      )}
    </div>
  );
}
