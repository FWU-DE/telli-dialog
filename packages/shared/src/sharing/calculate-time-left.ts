/**
 * Calculates the time left (in seconds) for a shared chat (either learning scenario or character).
 * Returns -1 if the chat has been manually stopped (manuallyStoppedAt is set) or if required fields are missing.
 */
export function calculateTimeLeft({
  startedAt,
  maxUsageTimeLimit,
  manuallyStoppedAt,
}: {
  startedAt?: Date;
  maxUsageTimeLimit?: number;
  manuallyStoppedAt?: Date | null;
}) {
  if (manuallyStoppedAt) {
    return -1;
  }

  if (startedAt === undefined || maxUsageTimeLimit === undefined) {
    return -1;
  }

  const startedAtDate = new Date(startedAt);

  const nowUtc = new Date().toISOString();
  const nowUtcDate = new Date(nowUtc);

  const sharedChatTimeLeft =
    maxUsageTimeLimit * 60 - Math.floor((nowUtcDate.getTime() - startedAtDate.getTime()) / 1000);

  return sharedChatTimeLeft;
}
