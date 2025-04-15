import { getUser } from '@/auth/utils';
import { notFound } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return <>{children}</>;
}
