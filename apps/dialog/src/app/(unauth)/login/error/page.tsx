import LogoutButton from '@/app/(authed)/logout-button';
import WarningIcon from '@/components/icons/warning-icon';
import { getMissingFieldsFromUrl } from '@shared/auth/authentication-service';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/login/error'>) {
  const missingFieldsInProfile = getMissingFieldsFromUrl(await props.searchParams);

  return (
    <div className="flex justify-center min-h-screen items-center">
      <div className="p-6 flex flex-col gap-4 items-center rounded-xl border bg-light-gray max-w-fit">
        <WarningIcon />
        <div>
          Login leider nicht möglich. Folgende Informationen müssen mit dem Profil übermittelt
          werden:
        </div>
        <ul>
          {missingFieldsInProfile.map((field, index) => {
            return <li key={index}>{field.toString()}</li>;
          })}
        </ul>
        {/* // Todo RL: Logout funktioniert nicht, da kein valides token vorhanden ist */}
        <LogoutButton />
      </div>
    </div>
  );
}
