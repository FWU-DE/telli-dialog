import { UrlPreset } from '@shared/web-search/url-presets/types';
import { Chip } from '@ui/components/chip';

type WebSearchUrlPresetsProps = {
  presets: UrlPreset[];
  onAddPreset: (preset: UrlPreset) => void;
};

export function WebSearchUrlPresets({ presets, onAddPreset }: WebSearchUrlPresetsProps) {
  return (
    <div>
      <div>Webseitenpakete</div>
      <ul>
        {presets.map((preset) => (
          <li key={preset.id}>
            <div className="flex justify-between">
              <span>{preset.name}</span>
              <span>({preset.urls.length})</span>
              <button onClick={() => onAddPreset(preset)}>Paket hinzufügen</button>
            </div>
            <ul>
              {preset.urls.map((url) => (
                <li className="inline" key={`${preset.id}-${url}`}>
                  <Chip>{url}</Chip>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
