import '@ui/styles/globals.css';
import type { ReactNode } from 'react';
import { Header } from '../components/header/Header';
import { Toaster } from '@ui/components/Toaster';
import TwoColumnLayout from '../components/layout/TwoColumnLayout';

const sidebarNav = {
  sections: [
    {
      title: 'telli-api',
      items: [{ label: 'Organisationen', href: '/organizations' }],
    },
    {
      title: 'telli-dialog',
      items: [{ label: 'Bundesländer', href: '/federal-states' }],
    },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        <Toaster />
        <div className="flex flex-col gap-6 p-6 min-h-screen">
          <Header />
          <TwoColumnLayout sidebar={sidebarNav} page={children} />
        </div>
      </body>
    </html>
  );
}
