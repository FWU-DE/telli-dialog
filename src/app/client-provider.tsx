'use client';

import { ToastProvider } from '@/components/common/toast';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { DesignConfiguration } from '@/db/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

const queryClient = new QueryClient();

export default function ClientProvider({
  children,
  session,
  designConfiguration,
}: {
  children: React.ReactNode;
  session: Session | null;
  designConfiguration: DesignConfiguration;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ThemeProvider designConfiguration={designConfiguration}>
          <SessionProvider session={session} refetchInterval={60} refetchOnWindowFocus>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
