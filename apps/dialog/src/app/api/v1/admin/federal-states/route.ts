import { encrypt } from '@shared/db/crypto';
import {
  dbDeleteFederalState,
  dbGetAllFederalStates,
  dbGetFederalStateById,
  dbInsertFederalState,
} from '@shared/db/functions/federal-state';
import { federalStateTable } from '@shared/db/schema';
import { validateApiKeyByHeadersWithResult } from '@/utils/validation';
import { env } from '@/env';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createInsertSchema } from 'drizzle-zod';

export async function GET(req: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(req.headers);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const federalStates = await dbGetAllFederalStates();

  return NextResponse.json(
    {
      federalStates: federalStates.map((federalState) => ({
        ...federalState,
        hasApiKeyAssigned: !!federalState.encryptedApiKey,
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
 * Creates a new federal state record.
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
    federalStateToCreate.decryptedApiKey !== null &&
    federalStateToCreate.decryptedApiKey !== undefined
      ? encrypt({
          text: federalStateToCreate.decryptedApiKey,
          plainEncryptionKey: env.encryptionKey,
        })
      : null;
  const existingFederalState = await dbGetFederalStateById(federalStateToCreate.id);
  console.log('existingFederalState', existingFederalState);
  if (existingFederalState !== undefined) {
    return NextResponse.json(
      { error: `Federal state with id ${federalStateToCreate.id} already exists` },
      { status: 409 },
    );
  }
  const inserted = await dbInsertFederalState({ ...federalStateToCreate, encryptedApiKey });

  if (inserted === undefined) {
    return NextResponse.json({ error: 'Could not insert federal state' }, { status: 500 });
  }

  return NextResponse.json(inserted, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  let id: string | undefined;
  try {
    const body = await request.json();
    id = body.id;
  } catch (err) {
    return NextResponse.json({ error: `Invalid request body ${err}` }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const existingFederalState = await dbGetFederalStateById(id);
  if (existingFederalState === undefined) {
    return NextResponse.json(
      { error: `Federal state with id ${id} does not exist` },
      { status: 404 },
    );
  }

  const deleted = await dbDeleteFederalState(id);
  if (!deleted) {
    return NextResponse.json(
      { error: `Federal state with id ${id} does not exist` },
      { status: 404 },
    );
  }
  return NextResponse.json(deleted, { status: 200 });
}
