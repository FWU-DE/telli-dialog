import * as _Checkbox from '@radix-ui/react-checkbox';
import CheckIcon from '@/components/icons/check';
import { cn } from '@/utils/tailwind';

type CheckboxProps = {
  label?: string;
  checked?: boolean;
  onCheckedChange(checked: boolean): void;
} & React.ComponentProps<'button'>;

export default function Checkbox(props: CheckboxProps) {
  return (
    <label className="flex items-center gap-3 justify-center cursor-pointer">
      <_Checkbox.Root
        {...props}
        aria-label={props['aria-label'] ?? props.label ?? ''}
        className={cn(
          'rounded-[3px] border-[#CDCDCD] border w-4 h-4 hover:border-primary hover:bg-secondary-light disabled:border-[#9B9B9B] disabled:bg-[#EEEEEE]',
          props.checked && 'border-primary bg-secondary-light',
          props.className,
        )}
      >
        <_Checkbox.Indicator className="CheckboxIndicator">
          <CheckIcon className="text-primary w-[15px] h-[15px]" />
        </_Checkbox.Indicator>
      </_Checkbox.Root>
      {props.label !== undefined && (
        <span className={cn(props.disabled && 'text-[#9B9B9B]')}>{props.label}</span>
      )}
    </label>
  );
}
