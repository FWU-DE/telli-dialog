import { OrganizationListView } from './OrganizationListView';

export const ORGANIZATIONS_ROUTE = '/organizations';
export default async function OrganizationsPage() {
  return <OrganizationListView />;
}
