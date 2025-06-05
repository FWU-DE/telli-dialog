import { decryptMaybeValue, encrypt } from '@/db/crypto';
import { dbGetAllFederalStates, dbUpsertFederalState } from '@/db/functions/federal-state';
import { DesignConfiguration } from '@/db/types';
import { validateApiKeyByHeadersWithResult, validateApiKeyByHeadersWithThrow403 } from '@/db/utils';
import { env } from '@/env';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(req.headers);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  const federalStates = await dbGetAllFederalStates();

  return NextResponse.json(
    {
      federalStates: federalStates.map((f) => ({
        ...f,
        decryptedApiKey: decryptMaybeValue({
          data: f.encryptedApiKey,
          plainEncryptionKey: env.encryptionKey,
        }),
      })),
    },
    { status: 200 },
  );
}

const designConfigurationSchema: z.ZodType<DesignConfiguration> = z.object({
  primaryColor: z.string(),
  primaryTextColor: z.string(),
  secondaryColor: z.string(),
  secondaryTextColor: z.string(),
  secondaryDarkColor: z.string(),
  secondaryLightColor: z.string(),
  primaryHoverColor: z.string(),
  primaryHoverTextColor: z.string(),
  chatMessageBackgroundColor: z.string(),
  buttonPrimaryTextColor: z.string(),
});

/** Based on the database table this schema has a decryptedApiKey which is store encrypted in database. */
const federalStateCreateSchema = z.object({
  id: z.string(),
  teacherPriceLimit: z.coerce.number(),
  studentPriceLimit: z.coerce.number(),
  decryptedApiKey: z.string().nullable(),
  mandatoryCertificationTeacher: z.coerce.boolean().optional(),
  chatStorageTime: z.coerce.number().optional(),
  supportContact: z.coerce.string().nullable().optional(),
  trainingLink: z.coerce.string().nullable().optional(),
  studentAccess: z.coerce.boolean().optional(),
  enableCharacter: z.coerce.boolean().optional(),
  enableSharedChats: z.coerce.boolean().optional(),
  enableCustomGpt: z.coerce.boolean().optional(),
  designConfiguration: designConfigurationSchema.nullable().optional(),
  telliName: z.coerce.string().nullable().optional(),
});

/**
 * Creates a new federal state record or updates an existing one if
 * there is already a record with the given id.
 * @param request
 * @returns 201 on success, 403 on forbidden, 500 on error
 */
export async function POST(request: NextRequest) {
  validateApiKeyByHeadersWithThrow403(request.headers);

  const body = await request.json();
  const federalStateToCreate = federalStateCreateSchema.parse(body);

  const encryptedApiKey =
    federalStateToCreate.decryptedApiKey !== null
      ? encrypt({
          text: federalStateToCreate.decryptedApiKey,
          plainEncryptionKey: env.encryptionKey,
        })
      : null;

  const upserted = await dbUpsertFederalState({ ...federalStateToCreate, encryptedApiKey });

  if (upserted === undefined) {
    return NextResponse.json({ error: 'Could not upsert federal state' }, { status: 500 });
  }

  return NextResponse.json(upserted, { status: 201 });
}
