import { ReactNode } from 'react';

type OverviewPageLayoutProps = {
  children: ReactNode;
};

/**
 * This page layout is especially designed for overview pages like the character overview or the assistant overview.
 * It takes the full height of the screen to allow for scrollable content areas.
 */
export function OverviewPageLayout({ children }: OverviewPageLayoutProps) {
  return (
    <div className="data-overview-page-layout max-w-5xl mx-auto px-6 pb-8 h-full">{children}</div>
  );
}
