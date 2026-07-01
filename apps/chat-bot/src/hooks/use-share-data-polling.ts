import { useEffect, useState } from 'react';
import { ServerActionResult } from '@shared/actions/server-action-result';

export interface SharePollingData {
  expiredAt: Date | null;
  manuallyStoppedAt: Date | null;
  tokenPointsLimit: number | null;
  budgetUsedBySharedChat: number;
}

export function useShareDataPolling({
  fetchShareData,
  isActive,
  intervalMs = 60_000,
}: {
  fetchShareData: () => Promise<ServerActionResult<SharePollingData>>;
  isActive: boolean;
  intervalMs?: number;
}): SharePollingData | null {
  const [polledData, setPolledData] = useState<SharePollingData | null>(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const poll = async () => {
      const result = await fetchShareData();
      if (result.success && result.value) {
        setPolledData(result.value);
      }
    };

    const interval = setInterval(() => {
      void poll();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [fetchShareData, isActive, intervalMs]);

  return polledData;
}
