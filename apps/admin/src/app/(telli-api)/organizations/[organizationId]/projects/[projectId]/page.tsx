import ProjectDetailView from './ProjectDetailView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(
  props: PageProps<'/organizations/[organizationId]/projects/[projectId]'>,
) {
  const { organizationId, projectId } = await props.params;

  return <ProjectDetailView organizationId={organizationId} projectId={projectId} />;
}
