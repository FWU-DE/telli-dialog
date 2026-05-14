'use client';

import React, { startTransition } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { type LlmModelSelectModel } from '@shared/db/schema';
import { cn } from '@/utils/tailwind';
import { useSearchParams } from 'next/navigation';
import { useCustomPathname } from '@/hooks/use-custom-pathname';
import { navigateWithoutRefresh } from '@/utils/navigation/router';
import { Badge } from './badge';

const TIER_LABELS: Record<string, string> = {
  fast: 'Schnell',
  balanced: 'Ausgewogen',
  powerful: 'Leistungsstark',
};

const TIER_ORDER = ['fast', 'balanced', 'powerful'] as const;

const PROVIDER_LABELS: Record<string, string> = {
  azure: 'Azure',
  ionos: 'IONOS',
  openai: 'OpenAI',
  google: 'Google',
};

type ModelMatrixProps = {
  models: LlmModelSelectModel[];
  selectedModel: LlmModelSelectModel | undefined;
  onModelChange: (model: LlmModelSelectModel) => void;
  label: string;
  noModelsLabel: string;
  isStudent?: boolean;
  enableUrlParams?: boolean;
};

type ProviderRow = {
  provider: string;
  providerLabel: string;
  dataLocation: string | null;
  openSource: boolean | null;
  cells: Record<string, LlmModelSelectModel | undefined>;
};

function buildMatrix(models: LlmModelSelectModel[], isStudent: boolean): ProviderRow[] {
  const textModels = models
    .filter((m) => m.priceMetadata.type === 'text')
    .filter((m) => !isStudent || !m.name.includes('mistral'))
    .filter((m) => m.tier !== null);

  const providerMap = new Map<string, ProviderRow>();

  for (const model of textModels) {
    const key = model.provider;
    if (!providerMap.has(key)) {
      providerMap.set(key, {
        provider: key,
        providerLabel: PROVIDER_LABELS[key] ?? key,
        dataLocation: model.dataLocation ?? null,
        openSource: model.openSource ?? null,
        cells: {},
      });
    }
    const row = providerMap.get(key)!;
    if (model.tier) {
      row.cells[model.tier] = model;
    }
  }

  return Array.from(providerMap.values()).sort((a, b) =>
    a.providerLabel.localeCompare(b.providerLabel),
  );
}

function DataLocationBadge({
  location,
  openSource,
}: {
  location: string | null;
  openSource: boolean | null;
}) {
  const parts: string[] = [];
  if (location === 'eu') parts.push('EU');
  else if (location === 'us') parts.push('USA');
  else if (location) parts.push(location.toUpperCase());
  if (openSource === true) parts.push('Open Source');
  else if (openSource === false) parts.push('Closed');

  if (parts.length === 0) return null;
  return <span className="text-xs text-muted-foreground font-normal">{parts.join(' · ')}</span>;
}

export default function ModelMatrix({
  models,
  selectedModel,
  onModelChange,
  label,
  noModelsLabel,
  isStudent = false,
  enableUrlParams = false,
}: ModelMatrixProps) {
  const pathname = useCustomPathname();
  const searchParams = useSearchParams();
  const [optimisticModelId, setOptimisticModelId] = React.useOptimistic(selectedModel?.name);

  const currentSelectedModel = models.find((m) => m.name === optimisticModelId) ?? selectedModel;

  const rows = buildMatrix(models, isStudent);

  const activeTiers = TIER_ORDER.filter((tier) => rows.some((row) => row.cells[tier] !== null));

  async function handleSelectModel(model: LlmModelSelectModel) {
    startTransition(() => {
      setOptimisticModelId(model.name);
    });
    await onModelChange(model);

    if (enableUrlParams) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('model', model.name);
      navigateWithoutRefresh(`${pathname}?${newSearchParams.toString()}`);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-enterprise-md p-2">
        <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>
        <span className="text-primary text-base font-medium">
          {currentSelectedModel?.displayName ?? noModelsLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-enterprise-md p-2">
      <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          asChild
          className="cursor-pointer focus:outline-hidden bg-transparent opacity-100"
        >
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Select Model Dropdown"
          >
            <span className="text-primary text-base font-medium">
              {currentSelectedModel?.displayName ?? noModelsLabel}
            </span>
            <ChevronDown className="text-primary" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content
          className="bg-background-2 shadow-dropdown rounded-xl z-100 p-3 min-w-[440px]"
          align="start"
          sideOffset={10}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4 w-36" />
                {activeTiers.map((tier) => (
                  <th
                    key={tier}
                    className="text-left text-xs text-muted-foreground font-medium pb-2 px-2"
                  >
                    {TIER_LABELS[tier]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.provider} className={cn(i > 0 && 'border-t border-border')}>
                  <td className="py-2 pr-4 align-top">
                    <div className="flex flex-col gap-0.5 pt-1">
                      <span className="text-sm font-semibold text-foreground">
                        {row.providerLabel}
                      </span>
                      <DataLocationBadge location={row.dataLocation} openSource={row.openSource} />
                    </div>
                  </td>
                  {activeTiers.map((tier) => {
                    const model = row.cells[tier];
                    const isSelected = model?.id === currentSelectedModel?.id;
                    return (
                      <td key={tier} className="py-2 px-2 align-top">
                        {model ? (
                          <DropdownMenu.Item asChild>
                            <button
                              onClick={() => handleSelectModel(model)}
                              className={cn(
                                'text-left px-3 py-2 rounded-lg w-full outline-none transition-colors',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-secondary/30 hover:text-primary text-foreground',
                              )}
                              aria-label={`Select ${model.name}`}
                              data-testid={model.displayName}
                            >
                              <div className="flex items-center gap-1.5 text-sm font-medium">
                                {model.displayName}
                                {model.isNew && <Badge text="NEU" />}
                              </div>
                              {model.description && (
                                <div
                                  className={cn(
                                    'text-xs mt-0.5 leading-tight',
                                    isSelected
                                      ? 'text-primary-foreground/80'
                                      : 'text-muted-foreground',
                                  )}
                                >
                                  {model.description}
                                </div>
                              )}
                            </button>
                          </DropdownMenu.Item>
                        ) : (
                          <div className="px-3 py-2" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}

function ChevronDown(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="11"
      height="7"
      viewBox="0 0 11 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10.3331 0.199951L11 0.911514L5.5 6.79995L-3.11034e-08 0.911513L0.663437 0.199951L5.5 5.37339L10.3331 0.199951Z"
        fill="currentColor"
      />
    </svg>
  );
}
