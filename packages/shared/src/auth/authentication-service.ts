import z from 'zod';
import { vidisProfileSchema } from './vidis';
import { dbGetFederalStateById } from '../db/functions/federal-state';
import { dbGetUserById } from '../db/functions/user';
import {
  dbCreateVidisUser,
  dbUpdateVidisUserById,
  normalizeVidisSchoolIds,
  vidisRoleToUserSchoolRole,
} from '../db/functions/vidis';

const authErrorCodeSchema = z.enum(['federal_state_not_found', 'federal_state_changed']);
export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>;

type OidcValidationResult = { success: true } | { success: false; fieldErrors: string[] };

type VidisSignInResult =
  | { success: true }
  | { success: false; fieldErrors: string[] }
  | { success: false; authError: AuthErrorCode };

function isEmptyString(value: string): boolean {
  return value.trim().length === 0;
}

function getBusinessFieldErrors(profile: z.infer<typeof vidisProfileSchema>): string[] {
  const fieldErrors: string[] = [];

  if (isEmptyString(profile.rolle)) {
    fieldErrors.push('rolle');
  }
  if (isEmptyString(profile.bundesland)) {
    fieldErrors.push('bundesland');
  }

  const schoolIds = normalizeVidisSchoolIds(profile.schulkennung);
  if (schoolIds.length === 0) {
    fieldErrors.push('schulkennung');
  }

  return fieldErrors;
}

/**
 * The profile returned by VIDIS must contain certain fields
 * like federalState, role, school, etc.
 * This function checks if all mandatory fields are present in the profile.
 * If not, it returns which fields are missing from the zod error.
 *
 * @param profile - The profile object to validate
 * @returns An object indicating whether the profile is valid or which fields are missing
 */
export function validateOidcProfile(profile: unknown): OidcValidationResult {
  const profileResult = vidisProfileSchema.safeParse(profile);
  if (!profileResult.success) {
    const flattened = z.flattenError(profileResult.error);
    const fieldErrors = Object.keys(flattened.fieldErrors);

    return { success: false, fieldErrors };
  }

  const fieldErrors = getBusinessFieldErrors(profileResult.data);
  if (fieldErrors.length > 0) {
    return { success: false, fieldErrors };
  }

  return { success: true };
}

export async function validateAndSyncVidisUser(profile: unknown): Promise<VidisSignInResult> {
  const profileValidationResult = validateOidcProfile(profile);
  if (!profileValidationResult.success) {
    return profileValidationResult;
  }

  const parsedProfile = vidisProfileSchema.parse(profile);
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
  const userRole = vidisRoleToUserSchoolRole(parsedProfile.rolle.trim());

  if (!existingUser) {
    await dbCreateVidisUser({
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

  await dbUpdateVidisUserById({
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

/**
 * Generates an error URL with the missing field names as search params.
 */
export function generateErrorUrl(fieldErrors: string[], authError?: AuthErrorCode) {
  if (fieldErrors.length === 0 && !authError) {
    return '/login/error';
  }

  const searchParams = new URLSearchParams();
  if (fieldErrors.length > 0) {
    searchParams.append('profile_error', fieldErrors.join(','));
  }
  if (authError) {
    searchParams.append('auth_error', authError);
  }

  return `/login/error?${searchParams.toString()}`;
}

const profileSearchParamsSchema = z.object({
  profile_error: z.string().optional(),
  auth_error: authErrorCodeSchema.optional(),
});

export function getFieldErrorsFromUrl(
  searchParams: Record<string, string | string[] | undefined>,
): string[] {
  const parseResult = profileSearchParamsSchema.safeParse(searchParams);
  if (!parseResult.success) {
    return [];
  }

  const fieldErrorsEncoded = parseResult.data.profile_error;
  if (!fieldErrorsEncoded) {
    return [];
  }
  // Decode the strings because comma is encoded as %2C
  const fieldErrors = decodeURIComponent(fieldErrorsEncoded);
  return fieldErrors.split(',');
}

export function getAuthErrorFromUrl(
  searchParams: Record<string, string | string[] | undefined>,
): AuthErrorCode | undefined {
  const parseResult = profileSearchParamsSchema.safeParse(searchParams);
  if (!parseResult.success) {
    return undefined;
  }

  return parseResult.data.auth_error;
}
