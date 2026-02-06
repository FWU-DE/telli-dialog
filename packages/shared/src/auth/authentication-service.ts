import z from 'zod';
import { vidisProfileSchema } from './vidis';

/**
 * The profile returned by VIDIS must contain certain fields
 * like federalState, role, school, etc.
 * This function checks if all mandatory fields are present in the profile.
 * If not, it returns which fields are missing from the zod error.
 *
 * @param profile - The profile object to validate
 * @returns An object indicating whether the profile is valid or which fields are missing
 */
export function validateOidcProfile(
  profile: unknown,
): { success: true } | { success: false; fieldErrors: string[] } {
  const profileResult = vidisProfileSchema.safeParse(profile);
  if (profileResult.success) {
    return { success: true };
  }

  const flattened = z.flattenError(profileResult.error);
  const fieldErrors = Object.keys(flattened.fieldErrors);

  return { success: false, fieldErrors };
}

/**
 * Generates an error URL with the missing field names as search params.
 */
export function generateErrorUrl(fieldErrors: string[]) {
  if (fieldErrors.length === 0) {
    return '/login/error';
  }
  const searchParams = new URLSearchParams();
  searchParams.append('profile_error', fieldErrors.join(','));
  return `/login/error?${searchParams.toString()}`;
}

const profileSearchParamsSchema = z.object({
  profile_error: z.string(),
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
