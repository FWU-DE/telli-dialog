'use client';

import { Button } from '@ui/components/button';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();
  return <Button onClick={() => router.push('/api/auth/logout')}>Sign out</Button>;
}
