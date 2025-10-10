import { encrypt } from '@/db/crypto';
import { dbUpdateFederalState, dbGetFederalStateById } from '@/db/functions/federal-state';
import { federalStateTable } from '@/db/schema';
import { validateApiKeyByHeadersWithResult } from '@/db/utils';
import { env } from '@/env';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const { id } = await params;
  const federalState = await dbGetFederalStateById(id);

  if (federalState === undefined) {
    return NextResponse.json(
      { error: `Federal state with id ${id} does not exist` },
      { status: 404 },
    );
  }

  return NextResponse.json(federalState, { status: 200 });
}

const federalStateUpdateSchema = createInsertSchema(federalStateTable)
  .omit({
    encryptedApiKey: true,
    createdAt: true,
    id: true,
  })
  .extend({
    decryptedApiKey: z.string().nullable().optional(),
  });

/**
 * Updates an existing federal state record.
 * @param request
 * @returns 200 on success, 403 on forbidden, 404 if not found, 500 on error
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const body = await request.json();
  const federalStateToUpdate = federalStateUpdateSchema.parse(body);

  const { id } = await params;

  const existingFederalState = await dbGetFederalStateById(id);
  if (existingFederalState === undefined) {
    return NextResponse.json(
      { error: `Federal state with id ${id} does not exist` },
      { status: 404 },
    );
  }
  const encryptedApiKey =
    federalStateToUpdate.decryptedApiKey !== undefined &&
    federalStateToUpdate.decryptedApiKey !== null
      ? encrypt({
          text: federalStateToUpdate.decryptedApiKey,
          plainEncryptionKey: env.encryptionKey,
        })
      : existingFederalState.encryptedApiKey; // keep existing if not provided;
  const updated = await dbUpdateFederalState({ ...federalStateToUpdate, id, encryptedApiKey });

  if (updated === undefined) {
    return NextResponse.json({ error: 'Could not update federal state' }, { status: 500 });
  }

  return NextResponse.json(updated, { status: 200 });
}
