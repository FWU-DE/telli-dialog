import { Sidebar, SidebarItem } from '@/components/navigation/Sidebar';
import { ROUTES } from '@/consts/routes';

export function OrganizationSidebar({ organizationId }: { organizationId: string }) {
  return (
    <Sidebar>
      <SidebarItem label="Modelle" href={ROUTES.api.llms(organizationId)} />
      <SidebarItem label="Provider-Keys" href={ROUTES.api.providerKeys(organizationId)} />
      <SidebarItem label="Projekte" href={ROUTES.api.projects(organizationId)} />
    </Sidebar>
  );
}
