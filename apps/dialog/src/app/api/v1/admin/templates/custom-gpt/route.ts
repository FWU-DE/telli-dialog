import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import {
  dbGetGlobalGpts,
  dbUpsertCustomGpt,
  dbGetGlobalCustomGptByName,
} from '@shared/db/functions/custom-gpts';
import { CustomGptInsertModel, customGptTable } from '@shared/db/schema';
import { DUMMY_USER_ID } from '@shared/db/seed/user-entity';
import { validateApiKeyByHeadersWithResult } from '@/utils/validation';

// Generate Zod schema from Drizzle table definition
const baseCustomGptInsertSchema = createInsertSchema(customGptTable);

// Customize the schema for API validation
const customGptTemplateSchema = baseCustomGptInsertSchema
  .omit({
    id: true,
    createdAt: true,
    userId: true,
    // this not used anymore but still required for the db schema
    systemPrompt: true,
  })
  .extend({
    description: z.string(),
    specification: z.string(),
  });

const customGptTemplateArraySchema = z.array(customGptTemplateSchema);

export async function GET(request: NextRequest) {
  try {
    const [error] = validateApiKeyByHeadersWithResult(request.headers);
    if (error !== null) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const federalStateID = searchParams.get('federalStateID');

    if (!federalStateID) {
      return NextResponse.json({ error: 'federalStateID parameter is required' }, { status: 400 });
    }

    const customGpts = await dbGetGlobalGpts({ federalStateId: federalStateID });

    return NextResponse.json(customGpts);
  } catch (error) {
    console.error('Error fetching template custom GPTs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch template custom GPTs',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const [error] = validateApiKeyByHeadersWithResult(request.headers);
    if (error !== null) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const body = await request.json();

    // Validate the request body using Zod
    const parseResult = customGptTemplateArraySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        },
        { status: 400 },
      );
    }

    const validatedCustomGpts = parseResult.data;
    const results = [];

    for (const customGptData of validatedCustomGpts) {
      try {
        // Check if a global custom GPT with this name already exists
        const existingGlobalCustomGpt = await dbGetGlobalCustomGptByName({
          name: customGptData.name.trim(),
        });

        const customGpt: CustomGptInsertModel = {
          id: existingGlobalCustomGpt?.id ?? undefined,
          ...customGptData,
          accessLevel: 'global',
          userId: DUMMY_USER_ID,
          systemPrompt: '',
          promptSuggestions: customGptData.promptSuggestions || [],
        };

        const upsertedCustomGpt = await dbUpsertCustomGpt({ customGpt });

        results.push({
          data: upsertedCustomGpt,
        });
      } catch (error) {
        console.error('Error upserting custom GPT:', error);
        results.push({
          error: error instanceof Error ? error.message : 'Unknown error',
          data: customGptData,
        });
      }
    }

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error('Error processing custom GPT templates:', error);
    return NextResponse.json(
      {
        error: 'Failed to process custom GPT templates',
      },
      { status: 500 },
    );
  }
}
