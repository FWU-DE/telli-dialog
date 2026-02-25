import LoginForm from './login-form';
import { getMaybeUser } from '@/auth/utils';
import Footer from '@/components/navigation/footer';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const maybeUser = await getMaybeUser();
  const { callbackUrl } = await searchParams;

  if (maybeUser !== null) {
    // User is already logged in, redirect to callbackUrl or home
    redirect(callbackUrl || '/');
  }

  return (
    <div className="h-dvh flex flex-col gap-4 sm:gap-8">
      <LoginForm />
      <div className="px-4 pt-4 sm:px-8 sm:pt-8">
        <hr className="w-full" />
        <Footer />
      </div>
    </div>
  );
}
