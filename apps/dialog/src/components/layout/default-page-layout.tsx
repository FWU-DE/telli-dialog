import { ReactNode } from 'react';

type DefaultPageLayoutProps = {
  children: ReactNode;
};

export function DefaultPageLayout({ children }: DefaultPageLayoutProps) {
  return <div className="data-page-layout h-full max-w-5xl mx-auto px-6 pb-8">{children}</div>;
}
