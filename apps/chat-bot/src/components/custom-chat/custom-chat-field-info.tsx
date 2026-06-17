import type { ReactNode } from 'react';
import { InfoTooltip } from '@ui/components/tooltip';

export function CustomChatFieldInfo({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="flex flex-col gap-1 text-base">
      <div className="inline-flex items-center gap-1 font-semibold">
        <span>{label}</span>
        {tooltip ? <InfoTooltip tooltip={tooltip} ariaLabel={label} /> : null}
      </div>
      <div className="font-normal">{value}</div>
    </div>
  );
}
