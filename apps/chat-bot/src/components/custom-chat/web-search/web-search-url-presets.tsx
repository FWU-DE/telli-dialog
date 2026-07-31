import { UrlPreset } from '@shared/web-search/url-presets/types';
import { useTranslations } from 'next-intl';
import { WebSearchUrlPresetItem } from './web-search-url-preset-item';
import { Separator } from '@ui/components/separator';

type WebSearchUrlPresetsProps = {
  presets: UrlPreset[];
  onAddPreset: (preset: UrlPreset) => void;
};

export function WebSearchUrlPresets({ presets, onAddPreset }: WebSearchUrlPresetsProps) {
  const t = useTranslations('custom-chat.web-search');

  return (
    <div>
      <div className="text-base font-medium">{t('presets-title')}</div>
      <ul className="mt-2 [&>li:last-child_[data-slot=separator]]:hidden">
        {presets.map((preset) => (
          <li key={preset.id}>
            <WebSearchUrlPresetItem preset={preset} onAddPreset={onAddPreset} />
            <Separator className="my-4.5" />
          </li>
        ))}
      </ul>
    </div>
  );
}
