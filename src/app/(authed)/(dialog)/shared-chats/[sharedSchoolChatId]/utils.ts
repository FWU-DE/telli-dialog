import {
  IntelliPointsPercentageValue,
  intelliPointsPercentageValueSchema,
  UsageTimeValue,
  usageTimeValueSchema,
} from './schema';
import { customAlphabet } from 'nanoid';

export function calculateTimeLeftBySharedChat({
  startedAt,
  maxUsageTimeLimit,
}: {
  startedAt: Date | null;
  maxUsageTimeLimit: number | null;
}) {
  if (startedAt === null || maxUsageTimeLimit === null) {
    return -1;
  }

  const startedAtDate = new Date(startedAt);

  const nowUtc = new Date().toISOString();
  const nowUtcDate = new Date(nowUtc);

  const sharedChatTimeLeft =
    maxUsageTimeLimit * 60 - Math.floor((nowUtcDate.getTime() - startedAtDate.getTime()) / 1000);

  return sharedChatTimeLeft;
}

export function getIntelliPointsValueOrDefault(
  value: unknown,
  defaultValue: IntelliPointsPercentageValue,
): IntelliPointsPercentageValue {
  try {
    return intelliPointsPercentageValueSchema.parse(value);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return defaultValue;
  }
}

export function getMaxUsageTimeValueOrDefault(
  value: unknown,
  defaultValue: UsageTimeValue,
): UsageTimeValue {
  try {
    return usageTimeValueSchema.parse(value);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return defaultValue;
  }
}

export function generateInviteCode(length = 8) {
  const nanoid = customAlphabet('123456789ABCDEFGHIJKLMNPQRSTUVWXYZ', length);
  return nanoid();
}
