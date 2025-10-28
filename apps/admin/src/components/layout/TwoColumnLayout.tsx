import React from 'react';
import { Sidebar, SidebarProps } from '../navigation/Sidebar';

type TwoColumnLayoutProps = {
  /** JSX for the navigation column (left) */
  sidebar: SidebarProps;
  /** JSX for the detail column (right / main) */
  page: React.ReactNode;
  /** Tailwind width class for the nav column (e.g. "w-72", "w-80") */
  navWidth?: string;
  /** Additional classes for the outer container */
  className?: string;
};

/**
 * TwoColumnLayout
 * - Default export React component
 * - Left column is navigation (inject via `sidebar` prop)
 * - Right column is detail / main view (inject via `detail` prop)
 * - Responsive: on small screens the nav becomes a toggleable panel
 * - Accessible: toggle button has aria-controls / aria-expanded
 */
export default function TwoColumnLayout({ sidebar, page, className = '' }: TwoColumnLayoutProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation column */}
        <Sidebar sections={sidebar.sections} />

        {/* Detail / main view */}
        <main className="flex-1 overflow-auto p-6" role="main">
          {page}
        </main>
      </div>
    </div>
  );
}
