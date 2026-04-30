import LogoutButton from '@/app/(authed)/logout-button';
import WarningIcon from '@/components/icons/warning-icon';
import { getAuthErrorFromUrl, getFieldErrorsFromUrl } from '@shared/auth/authentication-service';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

const fieldNameMappings = {
  rolle: 'Rolle',
  schulkennung: 'Schulkennung',
  bundesland: 'Bundesland',
};

export default async function Page(props: PageProps<'/login/error'>) {
  const searchParams = await props.searchParams;
  const missingFieldsInProfile = getFieldErrorsFromUrl(searchParams);
  const authError = getAuthErrorFromUrl(searchParams);
  const t = await getTranslations('authentication.login-error');

  return (
    <div className="flex justify-center min-h-screen items-center">
      <div className="p-6 flex flex-col gap-4 items-center rounded-xl border bg-light-gray max-w-fit">
        <WarningIcon />
        <div>{t('description')}</div>
        {authError === 'federal_state_not_found' ? <div>{t('federal-state-not-found')}</div> : null}
        {authError === 'federal_state_changed' ? <div>{t('federal-state-changed')}</div> : null}
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
