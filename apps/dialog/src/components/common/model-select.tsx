'use client';

import React, { startTransition } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { type LlmModelSelectModel } from '@shared/db/schema';
import { useSidebarVisibility } from '../navigation/sidebar/sidebar-provider';
import { cn } from '@/utils/tailwind';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { iconClassName } from '@/utils/tailwind/icon';
import { Badge } from '../common/badge';

type ModelSelectProps = {
  models: LlmModelSelectModel[];
  selectedModel: LlmModelSelectModel | undefined;
  onModelChange: (model: LlmModelSelectModel) => void;
  modelType: 'text' | 'image';
  label: string;
  noModelsLabel: string;
  isStudent?: boolean;
  enableUrlParams?: boolean;
};

export default function ModelSelect({
  models,
  selectedModel,
  onModelChange,
  modelType,
  label,
  noModelsLabel,
  isStudent = false,
  enableUrlParams = false,
}: ModelSelectProps) {
  const { isOpen } = useSidebarVisibility();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  async function handleSelectModel(model: LlmModelSelectModel) {
    startTransition(async () => {
      setOptimisticModelId(model.name);
    });
    await onModelChange(model);

    // Only update URL params for chat models, not image generation
    if (enableUrlParams) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('model', model.name);
      router.push(`${pathname}?${newSearchParams.toString()}`);
    }
  }

  const [optimisticModelId, setOptimisticModelId] = React.useOptimistic(selectedModel?.name);

  const currentSelectedModel =
    models.find((model) => model.name === optimisticModelId) || selectedModel;

  return (
    <div className="flex flex-col gap-2 hover:bg-secondary/20 rounded-enterprise-md p-2">
      <span className="text-xs text-gray-400 hidden sm:block">{label}</span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          disabled={models.length < 2}
          asChild
          className="cursor-pointer disabled:cursor-default focus:outline-none"
        >
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer disabled:cursor-default"
            aria-label={`Select ${modelType} Model Dropdown`}
          >
            <span className="text-primary text-base font-medium">
              {currentSelectedModel?.displayName ?? noModelsLabel}
            </span>
            {currentSelectedModel &&
              modelType === 'text' &&
              isGreenModel({ model: currentSelectedModel }) && <GreenLeafIcon />}
            {currentSelectedModel?.isNew && <Badge text="NEU" />}
            {models.length > 1 && <ChevronDown className="text-primary" />}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className={cn(
            'flex flex-col bg-white shadow-dropdown rounded-xl ml-0',
            isOpen ? 'sm:ml-64' : 'sm:ml-44',
          )}
          sideOffset={10}
        >
          {models
            .filter((m) => m.priceMetadata.type === modelType)
            .filter((m) => !isStudent || !m.name.includes('mistral')) // students should not be able to select mistral models
            .filter((m) => m.id !== currentSelectedModel?.id)
            .map((model) => {
              return (
                <React.Fragment key={model.id}>
                  <DropdownMenu.Item asChild>
                    <button
                      className={cn(
                        'hover:bg-primary-hover text-left py-2 px-4 outline-none flex flex-col',
                        iconClassName,
                      )}
                      onClick={() => handleSelectModel(model)}
                      aria-label={`Select ${model.name} Model`}
                    >
                      <ModelSpan model={model} modelType={modelType} />
                    </button>
                  </DropdownMenu.Item>
                  <hr className="text-gray-200 mx-2 last:mb-2 last:hidden" />
                </React.Fragment>
              );
            })}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}

function isGreenModel({ model }: { model: LlmModelSelectModel }) {
  return model.priceMetadata.type === 'text' && model.priceMetadata.promptTokenPrice < 150; // in tenth of a cent
}

function ModelSpan({
  model,
  modelType,
}: {
  model: LlmModelSelectModel;
  modelType: 'text' | 'image';
}) {
  return (
    <>
      <div className="flex gap-2 items-center">
        <span>{model.displayName}</span>
        {modelType === 'text' && isGreenModel({ model }) && <GreenLeafIcon />}
        {model.isNew && <Badge text="NEU" />}
      </div>
      {model.description && (
        <span className="text-sm hover:text-text-secondary">{model.description}</span>
      )}
    </>
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

function GreenLeafIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="11"
      height="10"
      viewBox="0 0 11 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.98186 0.420367C9.97591 0.318434 9.93273 0.222235 9.86053 0.150034C9.78833 0.0778339 9.69213 0.0346586 9.5902 0.0287059C5.62515 -0.204104 2.44915 0.989631 1.095 3.22918C0.625612 3.99527 0.39431 4.88351 0.430425 5.78123C0.453999 6.35531 0.5708 6.92173 0.776254 7.45829C0.788326 7.49132 0.808559 7.52075 0.835069 7.54384C0.861579 7.56694 0.893503 7.58295 0.927867 7.59038C0.962232 7.59782 0.997919 7.59643 1.0316 7.58636C1.06529 7.57629 1.09588 7.55785 1.12052 7.53277L5.54754 3.03804C5.58626 2.99933 5.63221 2.96862 5.68279 2.94767C5.73337 2.92672 5.78758 2.91594 5.84233 2.91594C5.89708 2.91594 5.95129 2.92672 6.00187 2.94767C6.05245 2.96862 6.09841 2.99933 6.13712 3.03804C6.17583 3.07675 6.20654 3.12271 6.22749 3.17329C6.24844 3.22387 6.25922 3.27808 6.25922 3.33283C6.25922 3.38758 6.24844 3.44179 6.22749 3.49237C6.20654 3.54295 6.17583 3.5889 6.13712 3.62762L1.29916 8.53849L0.560111 9.27754C0.48325 9.35237 0.437364 9.45338 0.431574 9.5605C0.425784 9.66761 0.460514 9.77298 0.528861 9.85566C0.566291 9.899 0.612255 9.93417 0.663883 9.95895C0.715511 9.98374 0.771695 9.99762 0.828926 9.99972C0.886157 10.0018 0.943207 9.9921 0.996514 9.97117C1.04982 9.95024 1.09824 9.91854 1.13875 9.87805L2.01322 9.00359C2.74966 9.35983 3.49288 9.5541 4.22985 9.58014C4.28784 9.58222 4.34565 9.58327 4.40329 9.58327C5.24255 9.58541 6.06589 9.35424 6.78138 8.91557C9.02093 7.56142 10.2152 4.38594 9.98186 0.420367Z"
        fill="#02A59B"
        fillOpacity="0.5"
      />
    </svg>
  );
}
