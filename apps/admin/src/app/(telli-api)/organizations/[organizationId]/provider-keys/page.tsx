import { getProviderKeysAction } from './actions';
import { ProviderKeyListView } from './ProviderKeyListView';

export default async function ProviderKeysPage(
  props: PageProps<'/organizations/[organizationId]/provider-keys'>,
) {
  const { organizationId } = await props.params;
  const result = await getProviderKeysAction(organizationId);
  if (!result.success) throw new Error(result.error.message);
  return <ProviderKeyListView organizationId={organizationId} providerKeys={result.value} />;
}
