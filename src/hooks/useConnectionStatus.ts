import { useSyncExternalStore } from 'react';
import { marketSocket } from '../services/marketSocket';
import type { ConnectionStatus } from '../types';

/**
 * Connection status read straight from the socket service with useSyncExternalStore,
 * React's API for external stores. It lives outside the tickers context, so the header
 * re-renders only when the status changes, not on every price flush.
 */
export function useConnectionStatus(): ConnectionStatus {
  return useSyncExternalStore(marketSocket.onStatusChange, marketSocket.getStatus);
}
