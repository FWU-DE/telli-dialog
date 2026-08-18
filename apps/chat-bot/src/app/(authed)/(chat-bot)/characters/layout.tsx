import { getUser } from '@/auth/utils';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Spinner } from '@ui/components/spinner';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Spinner className="size-8" />
        </div>
      }
    >
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}

async function LayoutContent({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (user.userRole !== 'teacher') {
    notFound();
  }

  return <>{children}</>;
}
