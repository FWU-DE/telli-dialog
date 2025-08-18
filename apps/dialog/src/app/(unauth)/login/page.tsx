import LoginForm from './login-form';
import { getMaybeUser } from '@/auth/utils';
import Footer from '@/components/navigation/footer';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams?: { testlogin?: string } }) {
  const params = searchParams ? await searchParams : {};
  const maybeUser = await getMaybeUser();

  if (params.testlogin === 'true') {
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
