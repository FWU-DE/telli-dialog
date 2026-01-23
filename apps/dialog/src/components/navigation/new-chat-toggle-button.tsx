'use client';

import { useSidebarVisibility } from './sidebar/sidebar-provider';
import Link from 'next/link';
import PlusIcon from '@/components/icons/plus';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { cn } from '@/utils/tailwind';

export default function ChatToggleButton() {
  const { isOpen } = useSidebarVisibility();

  if (isOpen) {
    return null;
  }

  return (
    <Link href="/" prefetch={false} className={cn(buttonPrimaryClassName, 'group p-3.5')}>
      <PlusIcon className="fill-primary-text group-hover:fill-secondary-text w-8 h-8" />
    </Link>
  );
}
