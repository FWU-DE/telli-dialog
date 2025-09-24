import { dbGetCodesByFederalStateId, dbInsertCodes } from '@/db/functions/codes';
import { CodeInsertModel, CodeTable } from '@/db/schema';
import { validateApiKeyByHeadersWithResult } from '@/db/utils';
import { createInsertSchema } from 'drizzle-zod';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { federal_state_id: string };
  },
) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const codes = await dbGetCodesByFederalStateId(params.federal_state_id);
  return NextResponse.json({ codes }, { status: 200 });
}

const codePostSchema = createInsertSchema(CodeTable)
  .pick({
    increase_amount: true,
    duration_months: true,
    createdBy: true,
    create_reason: true,
  }).extend({
    increase_amount: z.number().min(1).max(20_000),
    duration_months: z.number().min(1).max(12).default(3),
    number_of_codes: z.number().min(1).default(1),
  });

// Creates Multiple codes at once
export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: { federal_state_id: string };
  },
) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  const body = await request.json();
  const parseResult = codePostSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.errors }, { status: 400 });
  }
  const parseData = parseResult.data;

  var valid_until = new Date();
  valid_until.setFullYear(valid_until.getFullYear() + 2);
  
  const codesToCreate: CodeInsertModel[] = [];
  for (let i = 0; i < parseData.number_of_codes; i++) {
    codesToCreate.push({
      code: crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase(),
      increase_amount: parseData.increase_amount,
      duration_months: parseData.duration_months,
      valid_until: valid_until,
      federalStateId: params.federal_state_id,
      createdBy: parseData.createdBy,
      create_reason: parseData.create_reason,
    });
  }

  const createdCodes = await dbInsertCodes(codesToCreate);
  return NextResponse.json({ createdCodes }, { status: 201 });
}

export async function PATCH(request: NextRequest,
  {
    params,
  }: {
    params: { federal_state_id: string };
  }) {
  }