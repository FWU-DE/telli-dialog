import { type Metadata } from 'next';
import { PublicEnvScript } from 'next-runtime-env';
import React from 'react';
import { Barlow } from 'next/font/google';
import ClientProvider from './client-provider';
import { getMaybeUser, getMaybeSession } from '@/auth/utils';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

import './globals.css';
import './scrollbar.css';
import { getHostByHeaders } from '@/utils/host';
import { redirect } from 'next/navigation';

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'telli',
    description: 'Der datenschutzkonforme KI-Chatbot für die Schule',
    icons: { icon: '/telli.svg' },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [maybeUser, maybeSession, locale, messages] = await Promise.all([
    getMaybeUser(),
    getMaybeSession(),
    getLocale(),
    getMessages(),
  ]);

  const host = await getHostByHeaders();

  if (host === 'telli.schule') {
    redirect('https://www.telli.schule');
  }

  const fullSession =
    maybeUser !== null && maybeSession !== null ? { ...maybeSession, user: maybeUser } : null;

  return (
    <html lang={locale} className={barlow.className}>
      <head>
        <PublicEnvScript />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ClientProvider session={fullSession}>{children}</ClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
