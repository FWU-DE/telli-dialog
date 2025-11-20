import { getApiKeyByIdAction } from '../actions';
import { ApiKeyDetailView } from '../ApiKeyDetailView';
import { redirect } from 'next/navigation';

export default async function ApiKeyDetailPage({
  params,
}: {
  params: Promise<{
    organizationId: string;
    projectId: string;
    apiKeyId: string;
  }>;
}) {
  const { organizationId, projectId, apiKeyId } = await params;

  try {
    const apiKey = await getApiKeyByIdAction(organizationId, projectId, apiKeyId);

    return (
      <div className="container mx-auto py-8">
        <ApiKeyDetailView
          organizationId={organizationId}
          projectId={projectId}
          apiKey={apiKey}
          mode="edit"
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching API key:', error);
    // Redirect to list if API key not found
    redirect(`/organizations/${organizationId}/projects/${projectId}/api-keys`);
  }
}
