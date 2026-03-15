# Streaming Chat Feature

## Overview

Real-time streaming chat system using WebSocket connections with Redis pub/sub for multi-instance support.

## ✅ Implemented Features

### WebSocket Connection
- JWT token authentication via query parameter
- Room-based subscriptions (user rooms, conversation rooms)
- Automatic reconnection with exponential backoff
- Heartbeat/ping-pong for connection health

### Streaming Events

| Event Type | Direction | Purpose |
|------------|-----------|---------|
| `agent_token` | Server → Client | Stream content chunks |
| `agent_step` | Server → Client | Tool calls, reasoning steps |
| `agent_complete` | Server → Client | Final response with metadata |
| `agent_error` | Server → Client | Error notification |
| `typing` | Bidirectional | Typing indicators |
| `ping`/`pong` | Bidirectional | Connection health |

### Backend Components

- **WebSocket Manager**: Connection lifecycle, room management
- **Redis Adapter**: Pub/sub for multi-instance coordination
- **Agent Event Emitter**: Emit streaming events to Redis
- **Chat Service**: Handle events and persist messages

### Frontend Components

- **WebSocket Service**: Connection management, auto-reconnect
- **WebSocket Provider**: React context for WebSocket access
- **useWebSocketStreaming Hook**: Connect events to conversation store
- **Conversation Store**: State management for streaming messages

### Recent Improvements

#### WebSocket Authentication (March 2026)
- Redirect to login on invalid/expired token (close code 1008)
- Clear auth data and preserve return URL for post-login redirect

#### Metadata in Complete Events (March 2026)
- `agent_complete` event includes `metadata` with `tool_outputs`
- Source citations display immediately after streaming
- Store handler updates message with metadata

#### Auto-scroll Improvements (March 2026)
- Scroll to bottom when streaming completes
- Track message completion status to trigger scroll once per message
- Handle dynamic content height during streaming

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   FastAPI   │────▶│   Redis     │
│  WebSocket  │◀────│  WebSocket  │◀────│   Pub/Sub   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Agent     │
                    │  Execution  │
                    └─────────────┘
```

## Key Files

### Backend
- `app/core/websocket/manager.py` - WebSocket connection manager
- `app/core/websocket/redis_adapter.py` - Redis pub/sub adapter
- `app/services/agent_event_emitter.py` - Emit streaming events
- `app/services/chat_service.py` - Handle response events

### Frontend
- `services/websocket-service/index.ts` - WebSocket client
- `providers/websocket-provider.tsx` - React context
- `hooks/use-websocket-streaming.ts` - Event handlers
- `hooks/use-chat/conversation-store.ts` - State management

## Related Documentation

- [Tool Outputs Metadata Pattern](../../architecture/tool-outputs-metadata-pattern.md)
- [WebSocket Implementation](../../architecture/WEBSOCKET_IMPLEMENTATION.md)
- [WebSocket Handshake Guide](../../architecture/WEBSOCKET_HANDSHAKE_GUIDE.md)
