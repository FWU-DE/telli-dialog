import '@ui/styles/globals.css';
import { Barlow } from 'next/font/google';
import type { ReactNode } from 'react';
import { Header } from '../components/header/Header';
import { Toaster } from '@ui/components/Toaster';

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={barlow.className}>
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
