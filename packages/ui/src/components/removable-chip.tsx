import { XIcon } from '@phosphor-icons/react';
import { Chip } from './chip';

type RemovableChipProps = {
  href?: string;
  label: string;
  ariaDeleteLabel: string;
  onDelete: () => void;
};

export function RemovableChip({ href, label, ariaDeleteLabel, onDelete }: RemovableChipProps) {
  return (
    <Chip>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      ) : (
        label
      )}
      <button
        type="button"
        data-icon="inline-end"
        aria-label={ariaDeleteLabel}
        className="rounded-full hover:cursor-pointer hover:bg-primary/15 p-1 -m-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={onDelete}
      >
        <XIcon />
      </button>
    </Chip>
  );
}
