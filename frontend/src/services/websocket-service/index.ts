/**
 * WebSocket service for real-time chat functionality
 */
import { 
  WebSocketMessage, 
  TypingIndicator, 
  AgentResponseChunk,
  StreamingMessage 
} from '@/types/chat-types';

export interface WebSocketServiceInterface {
  connect: (conversationId: string, userId: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  sendTypingIndicator: (indicator: TypingIndicator) => void;
  isConnected: boolean;
  onMessage: (callback: (message: WebSocketMessage) => void) => void;
  onAgentResponseChunk: (callback: (chunk: AgentResponseChunk) => void) => void;
  onTypingIndicator: (callback: (indicator: TypingIndicator) => void) => void;
  onError: (callback: (error: Error) => void) => void;
  onConnect: (callback: () => void) => void;
  onDisconnect: (callback: () => void) => void;
}

class WebSocketService implements WebSocketServiceInterface {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isReconnecting = false;
  
  // Event callbacks
  private messageCallbacks: ((message: WebSocketMessage) => void)[] = [];
  private chunkCallbacks: ((chunk: AgentResponseChunk) => void)[] = [];
  private typingCallbacks: ((indicator: TypingIndicator) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];
  private connectCallbacks: (() => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
  }

  async connect(conversationId: string, userId: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.baseUrl}/ws/${conversationId}?userId=${userId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this.connectCallbacks.forEach(callback => callback());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            this.errorCallbacks.forEach(callback => callback(new Error('Failed to parse message')));
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.disconnectCallbacks.forEach(callback => callback());
          
          // Attempt to reconnect if not a manual disconnect
          if (event.code !== 1000 && !this.isReconnecting) {
            this.attemptReconnect(conversationId, userId);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.errorCallbacks.forEach(callback => callback(new Error('WebSocket connection error')));
          reject(error);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.isReconnecting = true;
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
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

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'message':
        this.messageCallbacks.forEach(callback => callback(message));
        break;
      
      case 'agent_response_chunk':
        const chunk: AgentResponseChunk = message.data as AgentResponseChunk;
        this.chunkCallbacks.forEach(callback => callback(chunk));
        break;
      
      case 'agent_response_complete':
        // Handle completion signal
        this.messageCallbacks.forEach(callback => callback(message));
        break;
      
      case 'typing':
        const indicator: TypingIndicator = message.data as TypingIndicator;
        this.typingCallbacks.forEach(callback => callback(indicator));
        break;
      
      case 'error':
        const error = new Error(message.data.message || 'WebSocket error');
        this.errorCallbacks.forEach(callback => callback(error));
        break;
      
      case 'pong':
        // Handle pong response
        break;
      
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private attemptReconnect(conversationId: string, userId: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect(conversationId, userId).catch(error => {
        console.error('Reconnection failed:', error);
        this.attemptReconnect(conversationId, userId);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Event subscription methods
  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  onAgentResponseChunk(callback: (chunk: AgentResponseChunk) => void): void {
    this.chunkCallbacks.push(callback);
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

  // Utility methods
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Cleanup method
  removeAllListeners(): void {
    this.messageCallbacks = [];
    this.chunkCallbacks = [];
    this.typingCallbacks = [];
    this.errorCallbacks = [];
    this.connectCallbacks = [];
    this.disconnectCallbacks = [];
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
