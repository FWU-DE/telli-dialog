import { UrlPreset } from '@shared/web-search/url-presets/types';
import { Chip } from '@ui/components/chip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@ui/components/collapsible';
import { CaretDownIcon, CaretUpIcon, PlusIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/button';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

type WebSearchUrlPresetItemProps = {
  preset: UrlPreset;
  onAddPreset: (preset: UrlPreset) => void;
};

export function WebSearchUrlPresetItem({ preset, onAddPreset }: WebSearchUrlPresetItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('custom-chat.web-search');

  return (
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

        <Button size="sm" className="ml-2 py-0" onClick={() => onAddPreset(preset)}>
          <PlusIcon />
          {t('presets-add-preset-button')}
        </Button>
      </div>
      <CollapsibleContent>
        <ul className="flex flex-wrap gap-2 mt-2 mb-4">
          {preset.urls.toSorted().map((url) => (
            <li className="" key={`${preset.id}-${url}`}>
              <Chip>{url}</Chip>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
