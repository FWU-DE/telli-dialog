import { z } from "zod";


type ZodFieldMetadata = Partial<Pick<HTMLInputElement, 'maxLength' | 'minLength' | 'required'>>;

function getZodFieldInfo(schema: z.ZodTypeAny, field: string): ZodFieldMetadata {
    if (!schema) return { required: false };
    let fieldSchema = (schema as any).shape?.[field];
    if (!fieldSchema) return { required: false };
  
    // Check for nullable wrapper
    let nullable = false;
    if (fieldSchema._def.typeName === "ZodNullable") {
      nullable = true;
      fieldSchema = fieldSchema._def.innerType;
    }
  
    // Find max length
    const maxLength = fieldSchema._def.checks?.find((check: any) => check.kind === 'max')?.value;
    const minLength = fieldSchema._def.checks?.find((check: any) => check.kind === 'min')?.value;
    return { maxLength, minLength, required: !nullable };
  }
  
/**
 * Returns a function that can be used to get the metadata for a field in a zod schema.
 * @param schema - The zod schema to get the metadata for.
 * @returns A function that can be used to get the metadata for a field in the schema.
 */
export function getZodFieldMetadataFn(schema: z.ZodTypeAny) {
  return (field: string) => getZodFieldInfo(schema, field);
}
