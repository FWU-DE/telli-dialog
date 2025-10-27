import { ProjectListView } from './ProjectListView';

export const dynamic = 'force-dynamic';

export const ORGANIZATIONS_ROUTE = '/organizations';
export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return <ProjectListView organizationId={organizationId} />;
}
