import { ApiKeyDetailView } from '../ApiKeyDetailView';

export default async function NewApiKeyPage({
  params,
}: {
  params: Promise<{
    organizationId: string;
    projectId: string;
  }>;
}) {
  const { organizationId, projectId } = await params;

  return (
    <div className="container mx-auto py-8">
      <ApiKeyDetailView organizationId={organizationId} projectId={projectId} mode="create" />
    </div>
  );
}
