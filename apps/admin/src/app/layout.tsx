import '@ui/styles/globals.css';
import type { ReactNode } from 'react';
import { Header } from '../components/header/header';

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        <div className="flex flex-col gap-6 p-6 min-h-screen">
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
