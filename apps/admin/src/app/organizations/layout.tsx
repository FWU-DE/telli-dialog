import '@ui/styles/globals.css';
import type { ReactNode } from 'react';
import TwoColumnLayout from '../../components/layout/TwoColumnLayout';

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
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      <TwoColumnLayout sidebar={sidebarNav} page={children} />
    </div>
  );
}
