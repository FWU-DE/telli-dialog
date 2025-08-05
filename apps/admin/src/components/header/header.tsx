import { SignOutButton } from 'components/authentication/sign-out-button';

export function Header() {
  return (
    <header className="flex p-6 gap-6 justify-between">
      <span className="text-xl font-bold">telli-admin</span>
      <SignOutButton />
    </header>
  );
}
