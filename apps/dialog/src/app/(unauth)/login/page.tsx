import LoginForm from './login-form';
import { getMaybeUser } from '@/auth/utils';
import Footer from '@/components/navigation/footer';
import { env } from '@/env';
import { parseSearchParams } from '@/utils/parse-search-params';
import { redirect } from 'next/navigation';
import z from 'zod';

export const dynamic = 'force-dynamic';

export const LOGIN_PAGE_URL = new URL('/login', env.nextauthUrl);

const searchParamsSchema = z.object({
  testlogin: z.string().optional().default('false'),
});

export default async function Page(props: PageProps<'/login'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const maybeUser = await getMaybeUser();

  if (searchParams.testlogin === 'true') {
    redirect('/test-login');
  }

  if (maybeUser !== null) {
    redirect('/');
  }

  return (
    <div className="h-[100dvh] flex flex-col gap-4 sm:gap-8">
      <LoginForm />
      <div className="px-4 pt-4 sm:px-8 sm:pt-8">
        <hr className="w-full" />
        <Footer />
      </div>
    </div>
  );
}
