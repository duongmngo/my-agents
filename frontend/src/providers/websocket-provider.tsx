'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { websocketService } from '@/services/websocket-service';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { WebSocketEnvelope, WebSocketMessageType } from '@/types/chat-types';

interface WebSocketContextType {
  isConnected: boolean;
  join: (roomId: string) => void;
  leave: (roomId: string) => void;
  on: (type: WebSocketMessageType, callback: (envelope: WebSocketEnvelope) => void) => void;
  off: (type: WebSocketMessageType, callback: (envelope: WebSocketEnvelope) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  const isConnectingRef = useRef(false);
  const [isConnected, setIsConnected] = React.useState(false);

  // Establish WS connection after login
  useEffect(() => {
    if (!user || !token || isConnectingRef.current) {
      return;
    }

    const connect = async () => {
      isConnectingRef.current = true;
      try {
        console.log('WebSocketProvider: Connecting...');
        
        // Set auth first
        websocketService.setAuth(token);
        
        // Connect with dummy conversation ID (will join user:{id} room)
        await websocketService.connect('', user.id);
        
        setIsConnected(true);
        console.log('WebSocketProvider: Connection established');
        console.log('WebSocketProvider: Connected');
      } catch (error) {
        console.log('WebSocketProvider: Connection failed', error);
        console.error('WebSocketProvider: Failed to connect:', error);
        setIsConnected(false);
      } finally {
        isConnectingRef.current = false;
      }
    };

    connect();

    // Cleanup on unmount or logout
    return () => {
      // Only disconnect if we actually connected
      if (websocketService.isConnected) {
        console.log('WebSocketProvider: Disconnecting...');
        websocketService.disconnect();
      }
      setIsConnected(false);
      isConnectingRef.current = false;
    };
  }, [user, token]);

  // Listen for connect/disconnect events
  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    websocketService.onConnect(handleConnect);
    websocketService.onDisconnect(handleDisconnect);

    return () => {
      // Note: listeners are stored in arrays, so we can't easily unsubscribe
      // Consider refactoring websocketService to support unsubscribe
    };
  }, []);

  // Handle token refresh
  useEffect(() => {
    if (token && isConnected) {
      websocketService.setAuth(token);
    }
  }, [token, isConnected]);

  const value: WebSocketContextType = {
    isConnected,
    join: (roomId: string) => websocketService.join(roomId),
    leave: (roomId: string) => websocketService.leave(roomId),
    on: (type: WebSocketMessageType, callback: (envelope: WebSocketEnvelope) => void) =>
      websocketService.on(type, callback),
    off: (type: WebSocketMessageType, callback: (envelope: WebSocketEnvelope) => void) =>
      websocketService.off(type, callback),
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
