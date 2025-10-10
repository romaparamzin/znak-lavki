/**
 * WebSocket Hook
 * React hook for WebSocket integration
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { wsClient, WSEvent } from '../lib/websocket';
import { useAuthStore } from '../stores/authStore';
import { markKeys } from './useMarks';

export const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Connect to WebSocket
    wsClient.connect();
    setConnected(wsClient.isConnected());

    // Setup event listeners
    const unsubscribe = setupEventListeners(queryClient);

    return () => {
      unsubscribe();
      wsClient.disconnect();
      setConnected(false);
    };
  }, [isAuthenticated, queryClient]);

  const subscribe = <T = any>(event: string, callback: (data: T) => void) => {
    return wsClient.on(event, callback);
  };

  const emit = (event: string, data: any) => {
    wsClient.emit(event, data);
  };

  return {
    connected,
    subscribe,
    emit,
  };
};

/**
 * Setup default event listeners
 */
function setupEventListeners(queryClient: any) {
  const unsubscribers: Array<() => void> = [];

  // Mark created
  unsubscribers.push(
    wsClient.on(WSEvent.MARK_CREATED, (data: any) => {
      queryClient.invalidateQueries({ queryKey: markKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      message.info(`Создана новая метка: ${data.markCode}`);
    })
  );

  // Mark updated
  unsubscribers.push(
    wsClient.on(WSEvent.MARK_UPDATED, (data: any) => {
      queryClient.invalidateQueries({ queryKey: markKeys.lists() });
      queryClient.invalidateQueries({ queryKey: markKeys.detail(data.id) });
    })
  );

  // Mark blocked
  unsubscribers.push(
    wsClient.on(WSEvent.MARK_BLOCKED, (data: any) => {
      queryClient.invalidateQueries({ queryKey: markKeys.lists() });
      message.warning(`Метка заблокирована: ${data.markCode}`);
    })
  );

  // Marks bulk blocked
  unsubscribers.push(
    wsClient.on(WSEvent.MARKS_BULK_BLOCKED, (data: { count: number }) => {
      queryClient.invalidateQueries({ queryKey: markKeys.lists() });
      message.warning(`Заблокировано меток: ${data.count}`);
    })
  );

  // Marks expired
  unsubscribers.push(
    wsClient.on(WSEvent.MARK_EXPIRED, (data: { count: number }) => {
      queryClient.invalidateQueries({ queryKey: markKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      if (data.count > 0) {
        message.info(`Истекло меток: ${data.count}`);
      }
    })
  );

  // Metrics updated
  unsubscribers.push(
    wsClient.on(WSEvent.METRICS_UPDATED, () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    })
  );

  // Notifications
  unsubscribers.push(
    wsClient.on(WSEvent.NOTIFICATION, (data: { type: string; message: string }) => {
      switch (data.type) {
        case 'info':
          message.info(data.message);
          break;
        case 'success':
          message.success(data.message);
          break;
        case 'warning':
          message.warning(data.message);
          break;
        case 'error':
          message.error(data.message);
          break;
      }
    })
  );

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}

