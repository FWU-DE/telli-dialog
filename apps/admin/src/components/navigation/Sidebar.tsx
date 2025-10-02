import { Separator } from '@ui/components/Separator';
import Link from 'next/link';
import { ORGANIZATIONS_ROUTE } from '../../app/organizations/page';
import { LLMS_ROUTE } from '../../app/llms/page';
import { FEDERAL_STATES_ROUTE } from '../../app/federal-states/page';

export function Sidebar() {
  return (
    <div className="w-[240px] h-full p-4">
      <div className="text-sm">telli-api</div>
      <Link href={ORGANIZATIONS_ROUTE} className="block mt-2">
        Organisationen
      </Link>
      <Link href={LLMS_ROUTE} className="block mt-2">
        Modelle
      </Link>
      <Separator className="my-8" />
      <div className="text-sm">telli-dialog</div>
      <Link href={FEDERAL_STATES_ROUTE} className="block mt-2">
        Bundesländer
      </Link>
    </div>
  );
}
