import Link from 'next/link';
import { SignOutButton } from '../authentication/SignOutButton';
import { ROUTES } from '../../consts/routes';
import { Button } from '@ui/components/Button';

export function Header() {
  return (
    <header className="flex gap-6 items-center">
      <Link href={ROUTES.home} className="flex-none">
        <Button variant="link" className="text-xl font-bold">
          AIS.chat-admin
        </Button>
      </Link>
      <div className="flex-1 flex flex-row gap-4">
        <Link href={ROUTES.api.organizations}>
          <Button variant={'link'}>AIS.chat-api</Button>
        </Link>
        <Link href={ROUTES.app.page}>
          <Button variant={'link'}>AIS.chat-app</Button>
        </Link>
      </div>
      <div className="flex-none">
        <SignOutButton />
      </div>
    </header>
  );
}
