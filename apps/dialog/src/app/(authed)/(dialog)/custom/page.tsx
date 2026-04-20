import { requireAuth } from '@/auth/requireAuth';
import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/custom'>) {
  await props.searchParams;
  await requireAuth();
  permanentRedirect('/assistants');
}
