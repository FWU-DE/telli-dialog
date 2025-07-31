import type { ReactNode } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh' }}>
          <header
            style={{ background: '#222', color: '#fff', padding: '1rem 2rem', fontWeight: 'bold' }}
          >
            Admin Panel
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
