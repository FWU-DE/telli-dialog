import { UrlPreset } from '@shared/web-search/url-presets/types';
import { Chip } from '@ui/components/chip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@ui/components/collapsible';
import { CaretDownIcon, CaretUpIcon, PlusIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/button';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

type WebSearchUrlPresetsProps = {
  presets: UrlPreset[];
  onAddPreset: (preset: UrlPreset) => void;
};

export function WebSearchUrlPresets({ presets, onAddPreset }: WebSearchUrlPresetsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('custom-chat.web-search');

  return (
    <div>
      <div className="text-base font-medium">{t('presets-title')}</div>
      <ul className="mt-2">
        {presets.map((preset) => (
          <li key={preset.id}>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <div className="flex gap-2 items-center">
                <span className="text-sm grow">{preset.name}</span>
                <span className="text-sm">
                  ({t('presets-domain-count', { count: preset.urls.length })})
                </span>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    {isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
                  </Button>
                </CollapsibleTrigger>

                <Button className="ml-2" onClick={() => onAddPreset(preset)}>
                  <PlusIcon />
                  {t('presets-add-preset-button')}
                </Button>
              </div>
              <ul className="flex flex-wrap gap-2 mt-2 mb-4">
                {preset.urls.toSorted().map((url) => (
                  <li className="" key={`${preset.id}-${url}`}>
                    <Chip>{url}</Chip>
                  </li>
                ))}
              </ul>
            </Collapsible>
          </li>
        ))}
      </ul>
    </div>
  );
}
