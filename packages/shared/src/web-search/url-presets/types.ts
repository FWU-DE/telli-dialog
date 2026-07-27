import z from 'zod';

export const urlSchema = z.httpUrl();

export const urlPresetSchema = z.object({
  id: z.uuidv4().nonoptional(),
  name: z.string().nonempty().nonoptional(),
  orderNumber: z.number().int().nonnegative().nonoptional(),
  urls: z.array(urlSchema).nonoptional(),
});

export const urlPresetInsertSchema = urlPresetSchema.omit({ id: true });
export const urlPresetUpdateSchema = urlPresetSchema;

export type UrlPreset = z.infer<typeof urlPresetSchema>;
export type UrlPresetInsert = z.infer<typeof urlPresetInsertSchema>;
export type UrlPresetUpdate = z.infer<typeof urlPresetUpdateSchema>;
