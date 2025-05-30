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
import { DEFAULT_DESIGN_CONFIGURATION } from '@/db/const';
import { dbGetFederalStateByIdWithResult } from '@/db/functions/federal-state';
import { getMaybeLogoFromS3 } from '@/s3';

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const maybeUser = await getMaybeUser();
  const faviconPath = await getMaybeLogoFromS3(maybeUser?.school.federalStateId, 'favicon.svg');
  const [, federalState] = await dbGetFederalStateByIdWithResult(maybeUser?.school.federalStateId);

  return {
    title: federalState?.telliName ?? 'telli',
    description: 'Der datenschutzkonforme KI-Chatbot für die Schule',
    icons: { icon: faviconPath ?? '/telli.svg' },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [maybeUser, maybeSession, locale, messages] = await Promise.all([
    getMaybeUser(),
    getMaybeSession(),
    getLocale(),
    getMessages(),
  ]);

  const fullSession =
    maybeUser !== null && maybeSession !== null ? { ...maybeSession, user: maybeUser } : null;
  const [, federalState] = await dbGetFederalStateByIdWithResult(maybeUser?.school.federalStateId);
  const designConfiguration = federalState?.designConfiguration ?? DEFAULT_DESIGN_CONFIGURATION;

  return (
    <html lang={locale} className={barlow.className}>
      <head>
        <PublicEnvScript />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ClientProvider session={fullSession} designConfiguration={designConfiguration}>
            {children}
          </ClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
