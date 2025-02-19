'use client';

import { ToastProvider } from '@/components/common/toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

const queryClient = new QueryClient();

export default function ClientProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SessionProvider session={session} refetchInterval={60} refetchOnWindowFocus>
          {children}
        </SessionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
