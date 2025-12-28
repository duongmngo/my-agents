/**
 * Hook to connect WebSocket streaming events to conversation store
 */
import { useEffect } from 'react';
import websocketService from '@/services/websocket-service';
import { useConversationStore } from '@/hooks/use-chat/conversation-store';
import { WebSocketMessageType, WebSocketEnvelope } from '@/types/chat-types';

export function useWebSocketStreaming() {
  const {
    selectedConversationId,
    handleAgentToken,
    handleAgentStep,
    handleAgentComplete,
    handleAgentError,
  } = useConversationStore();

  useEffect(() => {
    // Handler for agent_token: streaming chunks
    const onAgentToken = (envelope: WebSocketEnvelope) => {
      const payload = envelope.payload as any;
      const { conversationId, messageId, chunk } = payload;
      
      // Only handle if it's for the current conversation
      if (conversationId === selectedConversationId) {
        console.log('[WebSocket] agent_token:', { messageId, chunk: chunk.substring(0, 50) });
        handleAgentToken(messageId, conversationId, chunk);
      }
    };

    // Handler for agent_step: thinking/tool execution steps
    const onAgentStep = (envelope: WebSocketEnvelope) => {
      const payload = envelope.payload as any;
      const { conversationId, messageId, content } = payload;
      
      if (conversationId === selectedConversationId) {
        console.log('[WebSocket] agent_step:', { messageId, content });
        handleAgentStep(messageId, conversationId, content);
      }
    };

    // Handler for agent_complete: final message
    const onAgentComplete = (envelope: WebSocketEnvelope) => {
      const payload = envelope.payload as any;
      const { conversationId, messageId, finalText } = payload;
      
      if (conversationId === selectedConversationId) {
        console.log('[WebSocket] agent_complete:', { messageId, finalText: finalText?.substring(0, 50) });
        handleAgentComplete(messageId, conversationId, finalText);
      }
    };

    // Handler for agent_error: error during generation
    const onAgentError = (envelope: WebSocketEnvelope) => {
      const payload = envelope.payload as any;
      const { conversationId, messageId, error } = payload;
      
      if (conversationId === selectedConversationId) {
        console.error('[WebSocket] agent_error:', { messageId, error });
        handleAgentError(messageId, conversationId, error);
      }
    };

    // Register event handlers
    console.log('[WebSocket] Registering streaming handlers');
    websocketService.on(WebSocketMessageType.AgentToken, onAgentToken);
    websocketService.on(WebSocketMessageType.AgentStep, onAgentStep);
    websocketService.on(WebSocketMessageType.AgentComplete, onAgentComplete);
    websocketService.on(WebSocketMessageType.AgentError, onAgentError);

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Unregistering streaming handlers');
      websocketService.off(WebSocketMessageType.AgentToken, onAgentToken);
      websocketService.off(WebSocketMessageType.AgentStep, onAgentStep);
      websocketService.off(WebSocketMessageType.AgentComplete, onAgentComplete);
      websocketService.off(WebSocketMessageType.AgentError, onAgentError);
    };
  }, [selectedConversationId, handleAgentToken, handleAgentStep, handleAgentComplete, handleAgentError]);

  return {
    isConnected: websocketService.isConnected,
  };
}
