import { createSelectSchema } from 'drizzle-zod';
import z from 'zod/v4';
import { VoucherTable } from '../db/schema';

// Generate zod schemas from the database table
export const voucherSelectSchema = createSelectSchema(VoucherTable).extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
  redeemedAt: z.coerce.date().nullable(),
  validUntil: z.coerce.date(),
});

export const createVoucherSchema = z.object({
  increaseAmount: z.number().min(1).max(20_000),
  durationMonths: z.number().min(1).max(12).default(3),
  createdBy: z.string().min(1),
  createReason: z.string().min(1).max(500),
  numberOfCodes: z.number().min(1).default(1),
});

// Infer types from schemas
export type VoucherModel = z.infer<typeof voucherSelectSchema>;
export type CreateVoucherModel = z.infer<typeof createVoucherSchema>;

export const patchSchema = z.object({
  code: z.string().length(16),
  revoked: z.boolean().optional(),
  updatedBy: z.string().min(1).max(100),
  updateReason: z.string().min(1).max(500),
});
