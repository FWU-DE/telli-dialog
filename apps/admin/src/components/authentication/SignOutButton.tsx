'use client';

import { Button } from '@ui/components/Button';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return <Button onClick={() => signOut()}>Sign out</Button>;
}
