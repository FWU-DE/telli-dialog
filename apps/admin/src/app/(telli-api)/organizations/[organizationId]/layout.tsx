import type { ReactNode } from 'react';
import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { OrganizationSidebar } from './OrganizationSidebar';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function OrganizationLayout({
  children,
  params,
}: LayoutProps<'/organizations/[organizationId]'> & { children: ReactNode }) {
  const { organizationId } = await params;

  return (
    <TwoColumnLayout
      sidebar={<OrganizationSidebar organizationId={organizationId} />}
      page={children}
    />
  );
}
