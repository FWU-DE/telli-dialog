'use client';

import React from 'react';
import { cn } from '@/utils/tailwind';
import { truncateClassName } from '@/utils/tailwind/truncate';
import AvatarPicture from '@/components/common/avatar-picture';
import { EmptyImageIcon } from '@/components/icons/empty-image';
import SharedChatIcon from '@/components/icons/shared-chat';
import { useTranslations } from 'next-intl';
import { ChatTextIcon } from '@phosphor-icons/react';

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
      className="rounded-enterprise-md border p-6 flex items-center gap-4 w-full hover:border-primary cursor-pointer bg-white"
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
      <figure
        className="w-11 h-11 bg-light-gray rounded-enterprise-sm flex justify-center items-center shrink-0"
        style={{ minWidth: '44px' }}
      >
        {avatarUrl ? (
          <AvatarPicture src={avatarUrl} alt={`${name} Avatar`} variant="small" />
        ) : (
          <EmptyImageIcon className="w-4 h-4" aria-hidden="true" />
        )}
      </figure>

      <div className="flex flex-col gap-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <h2 className={cn('font-medium leading-none py-0.5', truncateClassName)}>{name}</h2>
          {isOwned && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
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
