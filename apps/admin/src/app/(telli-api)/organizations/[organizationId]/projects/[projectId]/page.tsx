import ProjectDetailView from './ProjectDetailView';

export const dynamic = 'force-dynamic';

export default async function Page(
  props: PageProps<'/organizations/[organizationId]/projects/[projectId]'>,
) {
  const { organizationId, projectId } = await props.params;

  return <ProjectDetailView organizationId={organizationId} projectId={projectId} />;
}
