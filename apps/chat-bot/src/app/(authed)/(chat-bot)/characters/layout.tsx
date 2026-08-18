import { getUser } from '@/auth/utils';
import { notFound } from 'next/navigation';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (user.userRole !== 'teacher') {
    notFound();
  }

  return <>{children}</>;
}
