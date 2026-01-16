import { UseChatHelpers } from '@ai-sdk/react';

export type StreamingFinishedMarkerProps = {
  status: UseChatHelpers['status'];
};

/**
 * Based on the chat status, this component renders a hidden div with a specific data-testid
 * that is needed to detect when streaming has finished in end-to-end tests.
 */
export default function StreamingFinishedMarker(props: StreamingFinishedMarkerProps) {
  const isStreamingFinished = props.status === 'ready' || props.status === 'error';

  return isStreamingFinished ? (
    <div data-testid="streaming-finished" style={{ height: 0, width: 0 }} />
  ) : null;
}
