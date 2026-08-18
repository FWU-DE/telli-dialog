import ProjectDetailView from './ProjectDetailView';

export default async function Page(
  props: PageProps<'/organizations/[organizationId]/projects/[projectId]'>,
) {
  const { organizationId, projectId } = await props.params;

  return <ProjectDetailView organizationId={organizationId} projectId={projectId} />;
}
