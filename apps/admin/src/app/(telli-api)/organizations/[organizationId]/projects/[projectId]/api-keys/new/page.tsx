import { ApiKeyDetailView } from '../ApiKeyDetailView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function NewApiKeyPage(
  props: PageProps<'/organizations/[organizationId]/projects/[projectId]/api-keys/new'>,
) {
  const { organizationId, projectId } = await props.params;

  return (
    <div className="container mx-auto py-8">
      <ApiKeyDetailView organizationId={organizationId} projectId={projectId} mode="create" />
    </div>
  );
}
