import { ModelApiKeyMappingListView } from './ModelApiKeyMappingListView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
