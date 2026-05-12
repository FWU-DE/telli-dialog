import { InfoTooltip } from '@ui/components/Tooltip';

export function CustomChatHeading2({ text, tooltip }: { text: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-1">
      <h2 className="text-lg font-medium">{text}</h2>
      {tooltip && <InfoTooltip tooltip={tooltip} ariaLabel={text} />}
    </div>
  );
}
