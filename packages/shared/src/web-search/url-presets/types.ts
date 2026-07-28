import z from 'zod';

export const urlSchema = z.httpUrl();

export const urlPresetSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  orderNumber: z.number().int().nonnegative(),
  urls: z.array(urlSchema),
});

export const urlPresetInsertSchema = urlPresetSchema.omit({ id: true });
export const urlPresetUpdateSchema = urlPresetSchema.omit({ id: true });

export type UrlPreset = z.infer<typeof urlPresetSchema>;
export type UrlPresetInsert = z.infer<typeof urlPresetInsertSchema>;
export type UrlPresetUpdate = z.infer<typeof urlPresetUpdateSchema>;
