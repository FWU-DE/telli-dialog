'use client';

import { LogoutIcon } from '@/components/icons/logout';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';

async function logout() {
  window.location.assign('/api/auth/logout');
}

export default function LogoutButton({ className, ...props }: React.ComponentProps<'button'>) {
  const t = useTranslations('common');

  return (
    <button
      onClick={logout}
      className={cn('flex flex-row gap-2 items-center', className)}
      {...props}
    >
      <LogoutIcon className="w-5 h-5" />
      <p>{t('logout')}</p>
    </button>
  );
}
