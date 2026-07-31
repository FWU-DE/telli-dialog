'use client';

import { useEffect, useState } from 'react';
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { MAX_WEB_SEARCH_INCLUDED_DOMAINS } from '@/configuration-text-inputs/const';
import { utils } from '@shared/utils';
import { useToast } from '@/components/common/toast';
import type { WebSearchFields } from './web-search.types';
import { useUrlPresets } from './use-url-presets';
import { WebSearchUrlPresets } from './web-search-url-presets';
import { UrlPreset } from '@shared/web-search/url-presets/types';
import { WebSearchWebsiteInput } from './web-search-website-input';
import { WebSearchSelectedWebsites } from './web-search-selected-websites';

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
  const { data: availablePresets, isError } = useUrlPresets();
  const { field } = useController({
    name: 'webSearchIncludedDomains' as FieldPath<TFieldValues & WebSearchFields>,
    control,
  });
  const websites = (field.value as string[] | undefined) ?? [];
  const isLimitReached = websites.length >= MAX_WEB_SEARCH_INCLUDED_DOMAINS;

  useEffect(() => {
    if (isError) {
      toast.error(t('websites-presets-load-error'));
    }
  }, [isError, toast, t]);

  function handleAddPreset(preset: UrlPreset) {
    const missingWebsites = preset.urls.filter((url) => !websites.includes(url));
    field.onChange([...websites, ...missingWebsites]);
    onChange?.();
  }

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
    <div className="flex flex-col gap-8">
      <WebSearchSelectedWebsites
        websites={websites}
        isLimitReached={isLimitReached}
        onDeleteWebsite={handleDeleteWebsite}
      />

      <WebSearchWebsiteInput
        currentWebsite={currentWebsite}
        onCurrentWebsiteChange={setCurrentWebsite}
        onAddWebsite={handleAddWebsite}
        isLimitReached={isLimitReached}
      />

      <WebSearchUrlPresets
        availablePresets={availablePresets ?? []}
        selectedWebsites={websites}
        onAddPreset={handleAddPreset}
      />
    </div>
  );
}
