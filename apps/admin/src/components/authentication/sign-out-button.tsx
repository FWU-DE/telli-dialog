'use client';

import { Button } from 'components/common/button';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return <Button onClick={() => signOut()}>Sign out</Button>;
}
