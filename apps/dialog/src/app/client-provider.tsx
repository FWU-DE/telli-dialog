'use client';

import { ToastProvider } from '@/components/common/toast';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { DesignConfiguration } from '@ui/types/design-configuration';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemeProvider } from '@ui/components/theme-provider';
import { TooltipProvider } from '@ui/components/Tooltip';

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
      <TooltipProvider>
        <ToastProvider>
          <NextThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeProvider designConfiguration={designConfiguration}>
              <SessionProvider session={session} refetchInterval={60} refetchOnWindowFocus>
                {children}
              </SessionProvider>
            </ThemeProvider>
          </NextThemeProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
