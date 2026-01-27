import { getApiKeyByIdAction } from '../actions';
import { ApiKeyDetailView } from '../ApiKeyDetailView';

export default async function ApiKeyDetailPage(
  props: PageProps<'/organizations/[organizationId]/projects/[projectId]/api-keys/[apiKeyId]'>,
) {
  const { organizationId, projectId, apiKeyId } = await props.params;

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
}
