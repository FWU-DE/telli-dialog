import { useEffect, useRef, useState } from 'react';
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

  // we store that function in a ref to avoid re-running the effect when the function changes
  // this is important if the calling component uses a lambda function that is re-created on every render
  const fetchRef = useRef(fetchShareData);

  useEffect(() => {
    fetchRef.current = fetchShareData;
  }, [fetchShareData]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const poll = async () => {
      const result = await fetchRef.current(); // latest version
      if (result.success && result.value) {
        setPolledData(result.value);
      }
    };

    const interval = setInterval(() => void poll(), intervalMs);
    return () => clearInterval(interval);
  }, [isActive, intervalMs]);

  return polledData;
}
