/**
 * WebSocket service for real-time chat functionality with room-based subscriptions
 */
import { 
  WebSocketMessage, 
  WebSocketEnvelope,
  WebSocketMessageType,
  TypingIndicator, 
  StreamingMessage,
} from '@/types/chat-types';

export interface WebSocketServiceInterface {
  // Legacy methods
  connect: (conversationId: string, userId: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  sendTypingIndicator: (indicator: TypingIndicator) => void;
  isConnected: boolean;
  
  // New room-based API
  join: (roomId: string) => void;
  leave: (roomId: string) => void;
  send: (type: WebSocketMessageType, payload: any, room?: string) => void;
  setAuth: (jwt: string) => void;
  
  // Callbacks
  onMessage: (callback: (message: WebSocketMessage) => void) => void;
  onTypingIndicator: (callback: (indicator: TypingIndicator) => void) => void;
  onError: (callback: (error: Error) => void) => void;
  onConnect: (callback: () => void) => void;
  onDisconnect: (callback: () => void) => void;
  
  // Envelope callbacks (new)
  on: (type: WebSocketMessageType, callback: (envelope: WebSocketEnvelope) => void) => void;
  off: (type: WebSocketMessageType, callback: (envelope: WebSocketEnvelope) => void) => void;
}

class WebSocketService implements WebSocketServiceInterface {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 250; // Starting delay (ms)
  private maxReconnectDelay = 30000; // Cap (30s)
  private isReconnecting = false;
  private isManualDisconnect = false;
  private joinedRooms = new Set<string>();
  private currentJwt: string | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private onlineListener = this.handleOnlineStatusChange.bind(this);
  
  // Legacy callbacks
  private messageCallbacks: ((message: WebSocketMessage) => void)[] = [];
  private typingCallbacks: ((indicator: TypingIndicator) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];
  private connectCallbacks: (() => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];
  
  // Envelope callbacks (new)
  private envelopeCallbacks = new Map<WebSocketMessageType, Set<(envelope: WebSocketEnvelope) => void>>();

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    // Monitor online/offline for reconnection (only in browser)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onlineListener);
      window.addEventListener('offline', this.onlineListener);
    }
  }

  async connect(conversationId: string, userId: string): Promise<void> {
    // Disconnect any existing connection first
    if (this.ws) {
      this.disconnect();
      // Wait a bit for the old connection to fully close
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Promise((resolve, reject) => {
      try {
        this.isManualDisconnect = false;
        // Build WS URL with JWT token as query parameter
        let wsUrl = `${this.baseUrl}/ws`;
        if (this.currentJwt) {
          wsUrl += `?token=${encodeURIComponent(this.currentJwt)}`;
        } else {
          reject(new Error('No JWT token available'));
          return;
        }
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket opened, state:', this.ws?.readyState);
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          
          // Don't join rooms here - wait for HELLO from server first
          // Rooms will be auto-joined by server on connection
          
          // Start heartbeat
          this.startHeartbeat();
          
          this.connectCallbacks.forEach(callback => callback());
          console.log('WebSocket connection resolved');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            console.log('WebSocket message received:', event.data.substring(0, 100));
            // Parse and handle envelope format
            const envelope: WebSocketEnvelope = JSON.parse(event.data);
            this.handleEnvelope(envelope);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            this.errorCallbacks.forEach(callback => callback(new Error('Failed to parse message')));
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', { code: event.code, reason: event.reason, wasClean: event.wasClean });
          this.stopHeartbeat();
          this.disconnectCallbacks.forEach(callback => callback());
          
          // Attempt to reconnect if not a manual disconnect
          // 1000 = normal close, 1006 = abnormal close (usually client-side issue)
          if (!this.isManualDisconnect && event.code !== 1000) {
            console.log('Abnormal disconnect, attempting reconnect...');
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (event) => {
          console.error('WebSocket error event:', event);
          const error = new Error('WebSocket connection error');
          this.errorCallbacks.forEach(callback => callback(error));
          // Don't reject here - let onclose handle the disconnection
          // Rejecting causes the promise to close, which can abort the connection
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.isManualDisconnect = true;
      this.stopHeartbeat();
      
      // Send leave for all joined rooms
      this.joinedRooms.forEach(room => {
        this.sendCommand('leave', { room });
      });
      this.joinedRooms.clear();
      
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  // Room management
  join(roomId: string): void {
    if (this.joinedRooms.has(roomId)) {
      return; // Already joined
    }
    
    this.joinedRooms.add(roomId);
    this.sendCommand('join', { room: roomId });
  }

  leave(roomId: string): void {
    if (!this.joinedRooms.has(roomId)) {
      return; // Not joined
    }
    
    this.joinedRooms.delete(roomId);
    this.sendCommand('leave', { room: roomId });
  }

  // Send command to server (join/leave, auth refresh, etc)
  private sendCommand(command: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ action: command, ...payload });
      this.ws.send(message);
    }
  }

  // Send envelope message
  send(type: WebSocketMessageType, payload: any, room?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const envelope: WebSocketEnvelope = {
        version: 1,
        type,
        room: room || `user:${this.currentJwt}`, // Fallback to user room
        ts: Date.now(),
        id: this.generateId(),
        payload,
      };
      this.ws.send(JSON.stringify(envelope));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Auth update
  setAuth(jwt: string): void {
    this.currentJwt = jwt;
    // Note: If you need to update the token, you should reconnect with the new token
    // The WebSocket connection is authenticated during the initial handshake
  }

  sendMessage(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  sendTypingIndicator(indicator: TypingIndicator): void {
    const message: WebSocketMessage = {
      type: 'typing',
      data: indicator,
      conversationId: indicator.conversationId,
      userId: indicator.userId
    };
    this.sendMessage(message);
  }

  private handleEnvelope(envelope: WebSocketEnvelope): void {
    // Dispatch to envelope callbacks first
    const callbacks = this.envelopeCallbacks.get(envelope.type);
    if (callbacks) {
      callbacks.forEach(cb => cb(envelope));
    }

    // Then handle specific types for legacy callback compatibility
    switch (envelope.type) {
      case WebSocketMessageType.Typing: {
        const payload = envelope.payload as TypingIndicator;
        this.typingCallbacks.forEach(callback => callback(payload));
        break;
      }

      case WebSocketMessageType.Error: {
        const error = new Error(envelope.payload.message || 'WebSocket error');
        this.errorCallbacks.forEach(callback => callback(error));
        break;
      }

      case WebSocketMessageType.Pong: {
        this.resetHeartbeatTimeout();
        break;
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.errorCallbacks.forEach(callback => callback(new Error('Failed to reconnect after max attempts')));
      return;
    }

    // Only reconnect if online
    if (!navigator.onLine) {
      console.log('Offline, waiting for online event to reconnect');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const baseDelay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    const jitter = Math.random() * 0.2 * baseDelay; // ±10% jitter
    const delay = Math.floor(baseDelay + jitter);
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    
    setTimeout(() => {
      // For simplicity, re-use the last connected state
      // In production, you'd track the last conversationId and userId
      const lastRooms = Array.from(this.joinedRooms);
      this.connect('', '').catch(error => {
        console.error('Reconnection failed:', error);
        this.attemptReconnect();
      });
    }, delay);
  }

  private handleOnlineStatusChange(): void {
    if (navigator.onLine && this.isReconnecting && !this.isConnected) {
      console.log('Back online, attempting to reconnect...');
      this.attemptReconnect();
    }
  }

  // Heartbeat
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send(WebSocketMessageType.Ping, {});
        // Expect pong within 15 seconds
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout, reconnecting...');
          this.ws?.close();
          this.attemptReconnect();
        }, 15000);
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.resetHeartbeatTimeout();
  }

  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  onTypingIndicator(callback: (indicator: TypingIndicator) => void): void {
    this.typingCallbacks.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  onConnect(callback: () => void): void {
    this.connectCallbacks.push(callback);
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallbacks.push(callback);
  }

  // Envelope callbacks (new API)
  on(type: WebSocketMessageType, callback: (envelope: WebSocketEnvelope) => void): void {
    if (!this.envelopeCallbacks.has(type)) {
      this.envelopeCallbacks.set(type, new Set());
    }
    this.envelopeCallbacks.get(type)!.add(callback);
  }

  off(type: WebSocketMessageType, callback: (envelope: WebSocketEnvelope) => void): void {
    const callbacks = this.envelopeCallbacks.get(type);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  // Utility methods
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Cleanup method
  removeAllListeners(): void {
    this.messageCallbacks = [];
    this.typingCallbacks = [];
    this.errorCallbacks = [];
    this.connectCallbacks = [];
    this.disconnectCallbacks = [];
    this.envelopeCallbacks.clear();
  }

  destroy(): void {
    this.removeAllListeners();
    this.disconnect();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineListener);
      window.removeEventListener('offline', this.onlineListener);
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;