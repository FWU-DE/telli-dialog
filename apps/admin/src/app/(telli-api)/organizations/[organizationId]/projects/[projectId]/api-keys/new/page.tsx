import { ApiKeyDetailView } from '../ApiKeyDetailView';

export default function NewApiKeyPage({
  params,
}: {
  params: {
    organizationId: string;
    projectId: string;
  };
}) {
  const { organizationId, projectId } = params;

  return (
    <div className="container mx-auto py-8">
      <ApiKeyDetailView organizationId={organizationId} projectId={projectId} mode="create" />
    </div>
  );
}
