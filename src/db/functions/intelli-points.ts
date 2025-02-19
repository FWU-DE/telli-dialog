import { sql } from 'drizzle-orm';
import { db } from '..';
import { getEndOfCurrentMonth, getStartOfCurrentMonth } from '@/utils/date';

type Interval = 'hour' | 'minute' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export async function dbGetModelUsageOfSharedChatsByUserId({ userId }: { userId: string }) {
  const interval: Interval = 'month';
  const startDate = getStartOfCurrentMonth();
  const endDate = getEndOfCurrentMonth();

  // @ts-expect-error weird typing errors
  const rows: {
    period: string;
    model_id: string;
    prompt_tokens: string;
    completion_tokens: string;
    nof_requests: string;
    user_id: string;
  }[] = (
    await db.execute(sql`
SELECT
    DATE_TRUNC(${interval}, tracking.created_at) AS period,
    tracking.model_id,
    SUM(tracking.prompt_tokens) AS prompt_tokens,
    SUM(tracking.completion_tokens) AS completion_tokens,
    COUNT(tracking.completion_tokens) AS nof_requests
FROM shared_school_conversation_usage_tracking as tracking
WHERE tracking.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()} AND tracking.user_id = ${userId}
GROUP BY period, tracking.model_id
ORDER BY period, tracking.model_id
`)
  ).rows;

  const mappedRows = rows.map((row) => ({
    period: new Date(row.period),
    modelId: row.model_id,
    promptTokens: Number(row.prompt_tokens),
    completionTokens: Number(row.completion_tokens),
    numberOfRequest: Number(row.nof_requests),
  }));

  return mappedRows;
}

export async function dbGetModelUsageOfChatsByUserId({ userId }: { userId: string }) {
  const interval: Interval = 'month';
  const startDate = getStartOfCurrentMonth();
  const endDate = getEndOfCurrentMonth();

  // @ts-expect-error weird typing errors
  const rows: {
    period: string;
    model_id: string;
    prompt_tokens: string;
    completion_tokens: string;
    nof_requests: string;
    user_id: string;
  }[] = (
    await db.execute(sql`
SELECT
    DATE_TRUNC(${interval}, c.created_at) AS period,
    c.model_id,
    SUM(c.prompt_tokens) AS prompt_tokens,
    SUM(c.completion_tokens) AS completion_tokens,
    COUNT(c.id) AS nof_requests
FROM conversation_usage_tracking as c
WHERE c.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()} AND c.user_id = ${userId}
GROUP BY period, c.model_id
ORDER BY period, c.model_id
`)
  ).rows;

  const mappedRows = rows.map((row) => ({
    period: new Date(row.period),
    modelId: row.model_id,
    promptTokens: Number(row.prompt_tokens),
    completionTokens: Number(row.completion_tokens),
    numberOfRequest: Number(row.nof_requests),
  }));

  return mappedRows;
}

export async function dbGetModelUsageBySharedChatId({
  sharedChatId,
  startedAt,
  maxUsageTimeLimit,
}: {
  sharedChatId: string;
  startedAt: Date;
  maxUsageTimeLimit: number;
}) {
  const interval: Interval = 'year';
  const startDate = startedAt;
  const endDate = new Date(startedAt.getTime() + maxUsageTimeLimit * 60_000);

  // @ts-expect-error weird typing errors
  const rows: {
    period: string;
    model_id: string;
    prompt_tokens: string;
    completion_tokens: string;
    nof_requests: string;
    user_id: string;
  }[] = (
    await db.execute(sql`
SELECT
    DATE_TRUNC(${interval}, tracking.created_at) AS period,
    tracking.model_id,
    SUM(tracking.prompt_tokens) AS prompt_tokens,
    SUM(tracking.completion_tokens) AS completion_tokens,
    COUNT(tracking.completion_tokens) AS nof_requests
FROM shared_school_conversation_usage_tracking as tracking
INNER JOIN shared_school_conversation as conversation ON conversation.id = tracking.shared_school_conversation_id
WHERE tracking.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()} AND conversation.id = ${sharedChatId}
GROUP BY period, tracking.model_id
ORDER BY period, tracking.model_id
`)
  ).rows;

  const mappedRows = rows.map((row) => ({
    period: new Date(row.period),
    modelId: row.model_id,
    promptTokens: Number(row.prompt_tokens),
    completionTokens: Number(row.completion_tokens),
    numberOfRequest: Number(row.nof_requests),
  }));

  return mappedRows;
}
