'use client';

import { LogoutIcon } from '@/components/icons/logout';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/utils/tailwind';

export default function LogoutButton({ className, ...props }: React.ComponentProps<'button'>) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className={cn('flex flex-row gap-2 items-center', className)}
      {...props}
    >
      <LogoutIcon className="w-5 h-5" />
      <p>Abmelden</p>
    </button>
  );
}
