import type { ReactNode } from 'react';
import './globals.css';
import { Header } from 'components/header/header';

export default async function RootLayout({ children }: { children: ReactNode }) {
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
