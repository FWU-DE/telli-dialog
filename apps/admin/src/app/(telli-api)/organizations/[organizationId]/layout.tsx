import type { ReactNode } from 'react';
import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { OrganizationSidebar } from './OrganizationSidebar';

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
