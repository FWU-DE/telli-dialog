import React from 'react';
import Checkbox from '@/components/common/checkbox';
import { InfoIcon } from '@phosphor-icons/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type CheckboxWithInfoProps = {
  label: string;
  tooltip: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

export default function CheckboxWithInfo({
  label,
  tooltip,
  checked,
  onCheckedChange,
  disabled,
}: CheckboxWithInfoProps) {
  return (
    <div className="flex items-center gap-1">
      <Checkbox
        label={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <TooltipProvider skipDelayDuration={0} delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              aria-label={tooltip}
            >
              <InfoIcon size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-white">
            <p className="whitespace-pre-line">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
