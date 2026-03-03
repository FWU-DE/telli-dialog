import LoginForm from './login-form';
import { getMaybeUser } from '@/auth/utils';
import Footer from '@/components/navigation/footer';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; vidis_idp_hint?: string }>;
}) {
  const maybeUser = await getMaybeUser();
  const { callbackUrl, vidis_idp_hint } = await searchParams;

  const safeCallbackUrl = callbackUrl || '/';

  if (maybeUser !== null) {
    // User is already logged in, redirect to callbackUrl or home
    redirect(safeCallbackUrl);
  } else {
    // automatic sign-in if vidis_idp_hint is present
    if (vidis_idp_hint) {
      const qs = new URLSearchParams({
        provider: 'vidis',
        callbackUrl: safeCallbackUrl,
        vidis_idp_hint,
      });

      redirect(`/api/auth/signin?${qs.toString()}`);
    }
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
