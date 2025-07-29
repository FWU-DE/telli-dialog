import { getUser } from '@/auth/utils';
import React from 'react';

export default async function Layout({ children }: { children: React.ReactNode }) {
  await getUser();

  return <>{children}</>;
}
