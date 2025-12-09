import { requireAuth } from '@/auth/requireAuth';
import { notFound } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuth();

  if (user.userRole !== 'teacher') {
    notFound();
  }

  return <>{children}</>;
}
