import { decryptMaybeValue, encrypt } from '@/db/crypto';
import { dbGetAllFederalStates, dbUpsertFederalState } from '@/db/functions/federal-state';
import { validateApiKeyByHeadersWithResult } from '@/db/utils';
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

const federalStateSchema = z.object({
  id: z.string(),
  teacherPriceLimit: z.coerce.number(),
  studentPriceLimit: z.coerce.number(),
  createdAt: z.coerce.date(),
  decryptedApiKey: z.string().nullable(),
});

export async function POST(req: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(req.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const body = await req.json();
  const federalState = federalStateSchema.parse(body);

  const encryptedApiKey =
    federalState.decryptedApiKey !== null
      ? encrypt({
          text: federalState.decryptedApiKey,
          plainEncryptionKey: env.encryptionKey,
        })
      : null;

  const upserted = await dbUpsertFederalState({ ...body, encryptedApiKey });

  if (upserted === undefined) {
    return NextResponse.json({ error: 'Could not upsert federal state' }, { status: 500 });
  }

  return NextResponse.json(upserted, { status: 201 });
}
