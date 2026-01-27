import LogoutButton from '@/app/(authed)/logout-button';
import WarningIcon from '@/components/icons/warning-icon';
import { getFieldErrorsFromUrl } from '@shared/auth/authentication-service';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

const fieldNameMappings = {
  rolle: 'Rolle',
  schulkennung: 'Schulkennung',
  bundesland: 'Bundesland',
};

export default async function Page(props: PageProps<'/login/error'>) {
  const missingFieldsInProfile = getFieldErrorsFromUrl(await props.searchParams);
  const t = await getTranslations('authentication.login-error');

  return (
    <div className="flex justify-center min-h-screen items-center">
      <div className="p-6 flex flex-col gap-4 items-center rounded-xl border bg-light-gray max-w-fit">
        <WarningIcon />
        <div>{t('description')}</div>
        <ul>
          {missingFieldsInProfile.map((field) => {
            return (
              <li key={field}>
                {fieldNameMappings[field as keyof typeof fieldNameMappings] ?? field}
              </li>
            );
          })}
        </ul>
        {/* we cannot logout because there is no valid token but it works as intended */}
        <LogoutButton />
      </div>
    </div>
  );
}
