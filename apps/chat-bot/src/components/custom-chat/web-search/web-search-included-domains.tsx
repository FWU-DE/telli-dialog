'use client';

import { useState } from 'react';
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form';
import { PlusIcon, TrashSimpleIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Input } from '@ui/components/input';
import { Button } from '@ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/tooltip';
import {
  MAX_WEB_SEARCH_INCLUDED_DOMAINS,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { utils } from '@shared/utils';
import { useToast } from '@/components/common/toast';
import { cn } from '@/utils/tailwind';
import type { WebSearchFields } from './web-search.types';

export function WebSearchIncludedDomains<TFieldValues extends FieldValues>({
  control,
  onChange,
}: {
  control: Control<TFieldValues & WebSearchFields>;
  onChange?: () => void;
}) {
  const t = useTranslations('custom-chat.web-search');
  const toast = useToast();
  const [currentWebsite, setCurrentWebsite] = useState('');
  const { field } = useController({
    name: 'webSearchIncludedDomains' as FieldPath<TFieldValues & WebSearchFields>,
    control,
  });
  const websites = (field.value as string[] | undefined) ?? [];
  const isLimitReached = websites.length >= MAX_WEB_SEARCH_INCLUDED_DOMAINS;

  function handleAddWebsite() {
    if (isLimitReached) {
      return;
    }

    const trimmed = currentWebsite.trim();

    if (trimmed === '') {
      toast.error(t('websites-empty-error'));
      return;
    }

    const normalizedDomain = utils.url.normalizeDomain(trimmed);
    if (normalizedDomain === null) {
      toast.error(t('websites-invalid-error'));
      return;
    }

    if (websites.includes(normalizedDomain)) {
      toast.error(t('websites-duplicate-error'));
      setCurrentWebsite('');
      return;
    }

    field.onChange([...websites, normalizedDomain]);
    setCurrentWebsite('');
    onChange?.();
  }

  function handleDeleteWebsite(index: number) {
    field.onChange(websites.filter((_, i) => i !== index));
    onChange?.();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mt-1 flex w-full flex-col gap-2 lg:flex-row">
        <Input
          wrapperClassName="flex-1"
          type="text"
          inputMode="url"
          placeholder={t('websites-placeholder')}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          showCharacterCount={false}
          value={currentWebsite}
          disabled={isLimitReached}
          aria-label={t('websites-aria-input')}
          onChange={(e) => setCurrentWebsite(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddWebsite();
            }
          }}
        />
        <Button
          className="self-center"
          onClick={handleAddWebsite}
          disabled={isLimitReached}
          aria-label={t('websites-add')}
        >
          <PlusIcon className="size-4" />
          {t('websites-add')}
        </Button>
      </div>
      {websites.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
                  onClick={() => handleDeleteWebsite(index)}
                >
                  <TrashSimpleIcon className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
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
    </div>
  );
}
