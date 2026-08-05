'use client';

import { TrashSimpleIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Button } from '@ui/components/button';
import { MAX_WEB_SEARCH_INCLUDED_DOMAINS } from '@/configuration-text-inputs/const';
import { cn } from '@/utils/tailwind';
import { Card, CardContent } from '@ui/components/card';
import { UrlPreset } from '@shared/web-search/url-presets/types';
import { RemovableChip } from '@ui/components/removable-chip';

const UNASSIGNED_PRESET_NAME = 'unassigned';

type WebSearchSelectedWebsitesProps = {
  availablePresets: UrlPreset[];
  selectedWebsites: string[];
  onDeleteWebsite: (website: string) => void;
  onClearWebsites: () => void;
};

export function WebSearchSelectedWebsites({
  availablePresets,
  selectedWebsites,
  onDeleteWebsite,
  onClearWebsites,
}: WebSearchSelectedWebsitesProps) {
  const t = useTranslations('custom-chat.web-search');

  if (selectedWebsites.length === 0) {
    return null;
  }

  const isLimitReached = selectedWebsites.length >= MAX_WEB_SEARCH_INCLUDED_DOMAINS;

  const allPresetUrls = new Set(availablePresets.flatMap((preset) => preset.urls));
  const unassignedWebsites = selectedWebsites.filter((website) => !allPresetUrls.has(website));

  const websitesByPreset = new Map<string, string[]>(
    availablePresets
      .map((preset): [string, string[]] => [
        preset.name,
        preset.urls.filter((url) => selectedWebsites.includes(url)),
      ])
      .filter(([, urls]) => urls.length > 0),
  );

  const selectedWebsitesByPresetName =
    unassignedWebsites.length > 0
      ? new Map([[UNASSIGNED_PRESET_NAME, unassignedWebsites], ...websitesByPreset])
      : new Map(websitesByPreset);

  return (
    <div className="flex flex-col gap-1.5">
      <Card className="pt-0 bg-background-2">
        <CardContent>
          {Array.from(selectedWebsitesByPresetName.entries()).map(([presetName, websites]) => {
            return (
              <div key={presetName} className="mt-6">
                <div className="text-xs uppercase text-muted-foreground tracking-wide">
                  {presetName === UNASSIGNED_PRESET_NAME
                    ? t('presets-title-unassigned')
                    : presetName}
                </div>
                <ul className="flex flex-wrap gap-2 mt-3">
                  {websites.map((website, index) => (
                    <li key={presetName + index}>
                      <RemovableChip
                        href={`https://${website}`}
                        label={website}
                        ariaDeleteLabel={t('websites-aria-delete', { website })}
                        onDelete={() => onDeleteWebsite(website)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="flex items-center justify-end gap-2">
        <div
          className={cn('text-sm', isLimitReached ? 'text-destructive' : 'text-muted-foreground')}
        >
          {t('websites-counter', {
            count: selectedWebsites.length,
            max: MAX_WEB_SEARCH_INCLUDED_DOMAINS,
          })}
        </div>
        <Button variant="link" size="sm" onClick={onClearWebsites}>
          <TrashSimpleIcon />
          {t('websites-clear-button')}
        </Button>
      </div>
    </div>
  );
}
