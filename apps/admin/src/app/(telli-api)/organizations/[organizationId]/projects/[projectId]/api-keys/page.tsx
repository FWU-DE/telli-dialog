import { ApiKeyListView } from './ApiKeyListView';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;
  return <ApiKeyListView organizationId={organizationId} projectId={projectId} />;
}
