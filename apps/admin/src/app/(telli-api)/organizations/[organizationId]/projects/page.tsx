import { ProjectListView } from './ProjectListView';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage(
  props: PageProps<'/organizations/[organizationId]/projects'>,
) {
  const { organizationId } = await props.params;
  return <ProjectListView organizationId={organizationId} />;
}
