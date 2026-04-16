import { ReactNode } from 'react';

type ResponsiveLayoutWrapperProps = {
  children: ReactNode;
};

// TODO (TD-1004): Will be moved to root layout.tsx, once old layout is removed and replaced with new one.
// For now, this is used to wrap pages that use the new UI components, so that we can have a consistent padding and min-width across those pages.
export function ResponsiveLayoutWrapper({ children }: ResponsiveLayoutWrapperProps) {
  return <div className="mx-auto p-6">{children}</div>;
}
