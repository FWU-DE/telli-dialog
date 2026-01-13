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
): { success: true } | { success: false; missingFields: string[] } {
  const profileResult = vidisProfileSchema.safeParse(profile);
  if (profileResult.success) {
    return { success: true };
  }

  const flattened = z.flattenError(profileResult.error);
  const missingFields = Object.keys(flattened.fieldErrors);

  return { success: false, missingFields };
}

/**
 * Based on the missing fields array, an error url is generated
 * that contains the missing fields as search params.
 */
export function generateErrorUrl(missingFields: string[]) {
  if (missingFields.length === 0) {
    return '/login/error';
  }
  const searchParams = new URLSearchParams();
  searchParams.append('profile_error', missingFields.join(','));
  return `/login/error?${searchParams.toString()}`;
}

const profileSearchParamsSchema = z.object({
  profile_error: z.string(),
});

export function getMissingFieldsFromUrl(
  searchParams: Record<string, string | string[] | undefined>,
): string[] {
  if (searchParams === undefined) {
    return [];
  }
  const parseResult = profileSearchParamsSchema.safeParse(searchParams);
  if (!parseResult.success) {
    return [];
  }

  const params = new URLSearchParams(parseResult.data);
  const missingFieldsEncoded = params.get('profile_error');
  if (!missingFieldsEncoded) {
    return [];
  }
  // we have to decode the strings because comma is encoded as %2C
  const missingFields = decodeURIComponent(missingFieldsEncoded);
  return missingFields.split(',');
}
