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
    <div className="flex items-center gap-3 justify-center">
      <_Checkbox.Root
        // className="border hover:border-primary hover:bg-primary-hover data-[state=checked]:border-primary data-[state=checked]:bg-vidis-hover-green/20 rounded-enterprise-sm h-6 w-6"
        {...props}
        aria-label={props['aria-label'] ?? props.label ?? ''}
        className={cn(
          'rounded-[3px] border-[#CDCDCD] border w-4 h-4 hover:border-[#46217E] hover:bg-[#6CE9D733] disabled:border-[#9B9B9B] disabled:bg-[#EEEEEE]',
          props.checked && 'border-[#46217E] bg-[#6CE9D733]',
          props.className,
        )}
      >
        <_Checkbox.Indicator className="CheckboxIndicator">
          <CheckIcon className="text-primary w-[15px] h-[15px]" />
        </_Checkbox.Indicator>
      </_Checkbox.Root>
      {props.label !== undefined && (
        <label className={cn(props.disabled && 'text-[#9B9B9B]')}>{props.label}</label>
      )}
    </div>
  );
}
