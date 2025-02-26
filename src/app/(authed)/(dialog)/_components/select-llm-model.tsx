import * as Select from '@radix-ui/react-select';
import ChevronDownIcon from '@/components/icons/chevron-down';
import { LlmModel } from '@/db/schema';

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
  if (selectedModel === undefined) {
    return <p>Keine Modelle verfügbar</p>;
  }
  return (
    <Select.Root onValueChange={onValueChange} value={selectedModel} defaultValue={selectedModel}>
      <Select.Trigger className="flex items-center justify-between w-full py-2 pl-4 pr-4 bg-white border border-gray-200 focus:border-primary rounded-enterprise-md focus:outline-none max-w-min min-w-max">
        <Select.Value />
        <ChevronDownIcon className="w-4 h-4 text-primary ms-2" />
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="bg-white border border-gray-200 rounded-enterprise-md shadow-dropdown w-full z-50">
          <Select.ScrollUpButton className="py-2 text-gray-500">▲</Select.ScrollUpButton>
          <Select.Viewport className="p-1">
            {models
              .filter((m) => m.priceMetadata.type === 'text')
              .map((model) => (
                <Select.Item
                  key={model.id}
                  value={model.id}
                  className="px-4 py-2 cursor-pointer outline-none hover:bg-vidis-hover-green/20 rounded-enterprise-md transition"
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
