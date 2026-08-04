import { getProviderKeysAction } from './actions';
import { ProviderKeyListView } from './ProviderKeyListView';

export default async function ProviderKeysPage(
  props: PageProps<'/organizations/[organizationId]/provider-keys'>,
) {
  const { organizationId } = await props.params;
  const providerKeys = await getProviderKeysAction(organizationId);
  return <ProviderKeyListView organizationId={organizationId} providerKeys={providerKeys} />;
}
