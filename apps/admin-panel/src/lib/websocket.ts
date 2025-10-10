/**
 * WebSocket Client
 * Real-time updates using Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(API_CONFIG.WS_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      auth: {
        token: token || localStorage.getItem('accessToken'),
      },
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to event
   */
  on<T = any>(event: string, callback: (data: T) => void): () => void {
    if (!this.socket) {
      console.warn('Socket not connected');
      return () => {};
    }

    this.socket.on(event, callback);

    // Return unsubscribe function
    return () => {
      this.socket?.off(event, callback);
    };
  }

  /**
   * Emit event
   */
  emit(event: string, data: any): void {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// WebSocket event types
export enum WSEvent {
  // Marks events
  MARK_CREATED = 'marks:created',
  MARK_UPDATED = 'marks:updated',
  MARK_BLOCKED = 'marks:blocked',
  MARK_UNBLOCKED = 'marks:unblocked',
  MARK_EXPIRED = 'marks:expired',
  MARKS_BULK_BLOCKED = 'marks:bulk_blocked',
  
  // Metrics events
  METRICS_UPDATED = 'metrics:updated',
  
  // System events
  NOTIFICATION = 'notification',
}


