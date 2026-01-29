import '@ui/styles/globals.css';
import { Barlow } from 'next/font/google';
import type { ReactNode } from 'react';
import { Header } from '../components/header/Header';
import { Toaster } from '@ui/components/Toaster';
import { buildPublicConfig } from '@shared/sentry/public-config';

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { inlineScript } = buildPublicConfig();

  return (
    <html lang="de" className={barlow.className}>
      <head>
        <script
          type="text/javascript"
          // runs as soon as the browser parses it (before client components hydrate)
          dangerouslySetInnerHTML={{ __html: inlineScript }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        <Toaster />
        <div className="flex flex-col gap-6 p-6 min-h-screen">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
