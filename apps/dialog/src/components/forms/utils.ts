import { z, ZodNullable } from 'zod';

type ZodFieldMetadata = Partial<Pick<HTMLInputElement, 'maxLength' | 'minLength' | 'required'>>;

function getZodFieldInfoForTextInputField(schema: z.ZodObject, field: string): ZodFieldMetadata {
  if (!schema) return { required: false };
  let fieldSchema = schema.shape[field];
  if (!fieldSchema) return { required: false };

  // Check for nullable wrapper
  let nullable = false;
  if (fieldSchema.def.type === 'nullable') {
    nullable = true;
    // get the inner type of the nullable wrapper
    fieldSchema = (fieldSchema as ZodNullable).unwrap();
  }

  // this works only for string fields
  if (fieldSchema.type === 'string') {
    const stringField = fieldSchema as z.ZodString;
    const maxLength = stringField.maxLength ?? undefined;
    const minLength = stringField.minLength ?? undefined;
    return { maxLength, minLength, required: !nullable };
  }

  return { required: !nullable };
}

/**
 * Returns a function that can be used to get the metadata for a string field in a zod schema.
 * @param schema - The zod schema to get the metadata for.
 * @returns A function that can be used to get the metadata for a field in the schema.
 */
export function getZodStringFieldMetadataFn(schema: z.ZodObject) {
  return (field: string) => getZodFieldInfoForTextInputField(schema, field);
}
