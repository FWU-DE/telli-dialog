import { ModelApiKeyMappingListView } from './ModelApiKeyMappingListView';

export const dynamic = 'force-dynamic';

export default async function ModelApiKeyMappingsPage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string; apiKeyId: string }>;
}) {
  const { organizationId, projectId, apiKeyId } = await params;
  return (
    <ModelApiKeyMappingListView
      organizationId={organizationId}
      projectId={projectId}
      apiKeyId={apiKeyId}
    />
  );
}
