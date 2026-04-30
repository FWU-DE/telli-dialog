import { dbCreateUser, dbGetUserById, dbUpdateUserById } from '@telli/shared/db/functions/user';
import { dbGetFederalStateById } from '@shared/db/functions/federal-state';
import { AuthErrorCode, validateOidcProfile } from '@shared/auth/authentication-service';
import { normalizeVidisSchoolIds, vidisRoleToUserRole } from '@shared/db/functions/vidis';

export type VidisSignInResult =
  | { success: true }
  | { success: false; fieldErrors: string[] }
  | { success: false; authError: AuthErrorCode };

export async function validateAndSyncVidisUser(profile: unknown): Promise<VidisSignInResult> {
  const profileValidationResult = validateOidcProfile(profile);
  if (!profileValidationResult.success) {
    return profileValidationResult;
  }

  const parsedProfile = profileValidationResult.value;
  const federalState = await dbGetFederalStateById(parsedProfile.bundesland.trim());
  if (!federalState) {
    return { success: false, authError: 'federal_state_not_found' };
  }

  const existingUser = await dbGetUserById({ userId: parsedProfile.sub });
  if (
    existingUser &&
    existingUser.federalStateId &&
    existingUser.federalStateId !== federalState.id
  ) {
    return { success: false, authError: 'federal_state_changed' };
  }

  const schoolIds = normalizeVidisSchoolIds(parsedProfile.schulkennung);
  const userRole = vidisRoleToUserRole(parsedProfile.rolle.trim());

  if (!existingUser) {
    await dbCreateUser({
      id: parsedProfile.sub,
      firstName: '',
      lastName: '',
      email: `${parsedProfile.sub}@vidis.schule`,
      schoolIds,
      federalStateId: federalState.id,
      userRole,
    });

    return { success: true };
  }

  await dbUpdateUserById({
    id: existingUser.id,
    firstName: existingUser.firstName,
    lastName: existingUser.lastName,
    email: existingUser.email,
    schoolIds,
    federalStateId: existingUser.federalStateId ?? federalState.id,
    userRole,
  });

  return { success: true };
}
