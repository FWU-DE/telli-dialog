import { ReactNode } from 'react';

type DefaultPageLayoutProps = {
  children: ReactNode;
};

export function DefaultPageLayout({ children }: DefaultPageLayoutProps) {
  return <div className="max-w-5xl mx-auto px-6 h-full">{children}</div>;
}
