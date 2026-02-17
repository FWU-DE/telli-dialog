import { type Metadata } from 'next';
import React from 'react';
import { Barlow } from 'next/font/google';
import Script from 'next/script';
import ClientProvider from './client-provider';
import { getMaybeSession, getMaybeUser } from '@/auth/utils';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import './globals.css';
import './scrollbar.css';
import { DEFAULT_DESIGN_CONFIGURATION } from '@/db/const';
import { dbGetFederalStateByIdWithResult } from '@shared/db/functions/federal-state';
import { getMaybeLogoFromS3 } from '@shared/s3';
import { buildPublicConfig } from '@shared/sentry/public-config';

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const maybeUser = await getMaybeUser();
  const [faviconPath, [, federalState]] = await Promise.all([
    getMaybeLogoFromS3(maybeUser?.school.federalStateId, 'favicon.svg'),
    dbGetFederalStateByIdWithResult(maybeUser?.school.federalStateId),
  ]);

  return {
    title: !!federalState?.telliName ? federalState?.telliName : 'telli',
    description: 'Der datenschutzkonforme KI-Chatbot für die Schule',
    icons: {
      icon: faviconPath ?? '/telli.svg',
      apple: '/apple-touch-icon.png',
    },
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

  const { inlineScript } = buildPublicConfig();

  return (
    <html lang={locale} className={barlow.className}>
      <body className="overflow-hidden">
        <Script
          id="public-config"
          // runs as soon as the browser parses it (before client components hydrate)
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: inlineScript }}
        />
        <NextIntlClientProvider messages={messages}>
          <ClientProvider session={fullSession} designConfiguration={designConfiguration}>
            {children}
          </ClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
