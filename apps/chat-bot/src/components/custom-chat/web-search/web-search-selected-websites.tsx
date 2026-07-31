'use client';

import { TrashSimpleIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Button } from '@ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/tooltip';
import { MAX_WEB_SEARCH_INCLUDED_DOMAINS } from '@/configuration-text-inputs/const';
import { cn } from '@/utils/tailwind';

type WebSearchSelectedWebsitesProps = {
  websites: string[];
  isLimitReached: boolean;
  onDeleteWebsite: (index: number) => void;
};

export function WebSearchSelectedWebsites({
  websites,
  isLimitReached,
  onDeleteWebsite,
}: WebSearchSelectedWebsitesProps) {
  const t = useTranslations('custom-chat.web-search');

  if (websites.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div
        className={cn(
          'text-sm self-end',
          isLimitReached ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {t('websites-counter', {
          count: websites.length,
          max: MAX_WEB_SEARCH_INCLUDED_DOMAINS,
        })}
      </div>

      {websites.map((website, index) => {
        return (
          <div
            key={website}
            className="flex items-center gap-1 h-9 px-3 py-0.5 rounded-md bg-primary/15 text-primary text-sm font-medium"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={`https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-37.5 truncate"
                >
                  {website}
                </a>
              </TooltipTrigger>
              <TooltipContent>{website}</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/15"
              aria-label={t('websites-aria-delete', {
                website,
              })}
              onClick={() => onDeleteWebsite(index)}
            >
              <TrashSimpleIcon className="size-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
