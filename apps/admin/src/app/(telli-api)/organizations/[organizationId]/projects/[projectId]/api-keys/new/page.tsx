import { ApiKeyDetailView } from '../ApiKeyDetailView';

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
