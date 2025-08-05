import type { ReactNode } from 'react';
import './globals.css';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]/auth';
import { Header } from 'components/header/header';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh' }}>
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
