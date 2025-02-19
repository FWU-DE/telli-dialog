import LoginForm from './login-form';
import { getMaybeUser } from '@/auth/utils';
import Footer from '@/components/navigation/footer';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const maybeUser = await getMaybeUser();

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
