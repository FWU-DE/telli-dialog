/**
 * Calculates the time left (in seconds) for a shared chat (either learning scenario or character).
 */
export function calculateTimeLeft({
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
