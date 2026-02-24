import { env } from "@/env";
import {
  InvalidRequestBodyError,
  NotFoundError,
  UnauthorizedError,
} from "@/errors";
import { getMaybeBearerToken } from "@/routes/utils";
import { dbGetOrganizationById } from "@telli/api-database";

/**
 * Validates if the organization with the given ID exists in database.
 * Throws NotFoundError if the organization does not exist.
 * @param organizationId
 */
export async function validateOrganizationId(
  organizationId: string,
): Promise<void> {
  const organization = await dbGetOrganizationById(organizationId);
  if (!organization) {
    throw new NotFoundError(`Organization ${organizationId} not found`);
  }
}

/**
 * Validates the admin API key from the authorization header.
 * Throws UnauthorizedError if the API key is missing or invalid.
 * @param authorizationHeader
 */
export function validateAdminApiKeyAndThrow(
  authorizationHeader: string | undefined,
) {
  const token = getMaybeBearerToken(authorizationHeader);
  if (!token) throw new UnauthorizedError("No Bearer token found.");
  if (token !== env.apiKey) throw new UnauthorizedError("Api key is not valid");
}

/**
 * Validates that the request body is a non-empty object.
 * Throws InvalidRequestBodyError if the body is empty or invalid.
 * @param body
 */
export function validateRequestBody(body: unknown) {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length === 0
  ) {
    throw new InvalidRequestBodyError();
  }
}
