import Link from 'next/link';
import ChevronLeftIcon from '@/components/icons/chevron-left';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/tailwind';

type NavigateBackProps = {
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

export default function NavigateBack({ label, onClick, className }: NavigateBackProps) {
  const t = useTranslations('common');

  return (
    <button
      onClick={onClick}
      className={cn('flex gap-3 items-center text-primary hover:underline', className)}
    >
      <ChevronLeftIcon />
      <span>{label}</span>
    </button>
  );
}
