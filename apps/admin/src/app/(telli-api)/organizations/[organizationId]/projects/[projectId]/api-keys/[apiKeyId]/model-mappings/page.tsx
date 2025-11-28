import { ModelApiKeyMappingListView } from './ModelApiKeyMappingListView';

export const dynamic = 'force-dynamic';

export default async function ModelApiKeyMappingsPage(
  props: PageProps<'/organizations/[organizationId]/projects/[projectId]/api-keys/[apiKeyId]/model-mappings'>,
) {
  const { organizationId, projectId, apiKeyId } = await props.params;

  return (
    <ModelApiKeyMappingListView
      organizationId={organizationId}
      projectId={projectId}
      apiKeyId={apiKeyId}
    />
  );
}
