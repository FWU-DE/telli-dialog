import { InfoIcon } from '@phosphor-icons/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/Tooltip';

export function CustomChatHeading2({ text, tooltip }: { text: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-1 mt-10 mb-3">
      <h2 className="text-lg font-medium">{text}</h2>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="size-5 text-icon" />
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
