import { z } from 'zod';

export const telliNewChatMessageEventSchema = z.object({
  event_type: z.literal('telli_new_chat_message'),
  pseudonym_id: z.string(),
  chat_id: z.string(),
  input_tokens: z.coerce.number(),
  output_tokens: z.coerce.number(),
  federal_state: z.string(),
  provider: z.string(),
  cost_in_cent: z.coerce.number(),
  school_id: z.string(),
  user_role: z.string(),
  chat_type: z.string(),
  timestamp: z.coerce.date(),
});
export type TelliNewChatMessageEventType = z.infer<typeof telliNewChatMessageEventSchema>;

export const telliMonthlyTokenBudgetExceededEventSchema = z.object({
  event_type: z.literal('telli_monthly_token_budget_exceeded'),
  pseudonym_id: z.string(),
  federal_state: z.string(),
  school_id: z.string(),
  user_role: z.string(),
  timestamp: z.coerce.date(),
});
export type TelliMonthlyTokenBudgetExceededEventType = z.infer<
  typeof telliMonthlyTokenBudgetExceededEventSchema
>;
