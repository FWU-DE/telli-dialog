import { redirect } from 'next/navigation';
import { ROUTES } from '@/consts/routes';

export default async function OrganizationPage(
  props: PageProps<'/organizations/[organizationId]'>,
) {
  const { organizationId } = await props.params;
  redirect(ROUTES.api.llms(organizationId));
}
