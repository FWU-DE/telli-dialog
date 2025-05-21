import * as Select from '@radix-ui/react-select';
import ChevronDownIcon from '@/components/icons/chevron-down';
import { LlmModel } from '@/db/schema';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/tailwind';

type SelectLlmFormProps = {
  selectedModel: string | undefined;
  onValueChange(value: string): void;
  models: LlmModel[];
};

export default function SelectLlmModelForm({
  selectedModel,
  onValueChange,
  models,
}: SelectLlmFormProps) {
  const tCommon = useTranslations('common');

  if (selectedModel === undefined) {
    return <p>Keine Modelle verfügbar</p>;
  }

  return (
    <Select.Root onValueChange={onValueChange} defaultValue={selectedModel}>
      <Select.Trigger
        aria-label={tCommon('llm-model')}
        className="flex items-center justify-between w-full py-2 pl-4 pr-4 bg-white border border-gray-200 focus:border-primary rounded-enterprise-md focus:outline-none max-w-min min-w-max"
      >
        <Select.Value />
        <ChevronDownIcon aria-hidden="true" className="text-primary ms-2" />
        <span className="sr-only">{tCommon('llm-model')}</span>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="bg-white border border-gray-200 rounded-enterprise-md shadow-dropdown w-full z-50">
          <Select.ScrollUpButton className="py-2 text-gray-500">▲</Select.ScrollUpButton>
          <Select.Viewport className="p-1">
            {models
              .filter((m) => m.priceMetadata.type === 'text')
              .filter((m) => !m.name.includes('mistral'))
              .map((model) => (
                <Select.Item
                  key={model.id}
                  value={model.id}
                  className={cn(
                    'px-4 py-2 cursor-pointer outline-none transition',
                    'hover:bg-primary-hover hover:text-primary-hover-text',
                  )}
                >
                  <Select.ItemText>{model.displayName}</Select.ItemText>
                </Select.Item>
              ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="py-2 text-gray-500">▼</Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
