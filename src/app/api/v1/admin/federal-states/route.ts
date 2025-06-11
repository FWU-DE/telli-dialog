import { decryptMaybeValue, encrypt } from '@/db/crypto';
import { dbGetAllFederalStates, dbUpsertFederalState } from '@/db/functions/federal-state';
import { federalStateTable } from '@/db/schema';
import { validateApiKeyByHeadersWithResult } from '@/db/utils';
import { env } from '@/env';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

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

/** Based on the database table this schema has a decryptedApiKey which is store encrypted in database. */
const federalStateCreateSchema = createInsertSchema(federalStateTable)
  .omit({
    encryptedApiKey: true,
    createdAt: true,
  })
  .extend({
    decryptedApiKey: z.string().nullable(),
  });

/**
 * Creates a new federal state record or updates an existing one if
 * there is already a record with the given id.
 * @param request
 * @returns 201 on success, 403 on forbidden, 500 on error
 */
export async function POST(request: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

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
