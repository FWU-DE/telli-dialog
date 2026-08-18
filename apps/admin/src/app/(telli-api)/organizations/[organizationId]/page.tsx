import { redirect } from 'next/navigation';
import { ROUTES } from '@/consts/routes';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function OrganizationPage(
  props: PageProps<'/organizations/[organizationId]'>,
) {
  const { organizationId } = await props.params;
  redirect(ROUTES.api.llms(organizationId));
}
