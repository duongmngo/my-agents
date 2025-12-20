# WebSocket Architecture and Implementation Guide

## Overview
- Goal: Single authenticated WebSocket connection per user with room-based subscriptions (`user:{id}` for notifications, `conversation:{id}` for chat streaming), Redis-backed multi-instance scaling, and robust polling fallback on FE.
- Scope: Backend WS gateway architecture, Redis adapter, FE client service, chat hook integration, provider setup, unified envelope schema, security/performance, and deployment prerequisites.

## Architecture
- Single connection: Maintain one WebSocket per logged-in user; avoid per-page sockets.
- Rooms:
  - `user:{id}`: global events, notifications, lightweight badges.
  - `conversation:{id}`: chat streaming, agent tokens/steps/completion.
  - Optional `system:broadcast`: global announcements (read-only).
- Page handlers:
  - Layout: consumes notifications from `user:{id}`.
  - Chat page: consumes agent stream from `conversation:{id}`.
- Routing: Unified envelope parsing; route by `room` and `type`; Redis pub/sub fans out across backend instances.
- Fallback: Poll REST endpoints when WS unavailable; degrade streaming UX gracefully.
- Lifecycle: Start WS post-login; rejoin intended rooms on reconnect; teardown on logout; multi-instance coordination via Redis.

## Backend Architecture

### WebSocket Gateway (`backend/app/core/websocket`)
- **Manager class responsibilities:**
  - Accept WS connections; validate JWT on upgrade.
  - Track active connections by `client_id` and map to `user_id`.
  - Manage room membership: track which clients are in which rooms.
  - Enforce authorization: only allow `user:{id}` for self; `conversation:{id}` for participants.
  - Dispatch messages: route locally and via Redis for cross-instance.
  - Heartbeat/ping-pong to detect stale connections.
  - Rate limiting: per user and per IP; drop oversized envelopes.

- **Connection lifecycle:**
  - **On upgrade:** Extract JWT from query or header; validate; resolve user_id; assign client_id; emit `hello` with server info.
  - **On message:** Parse envelope; validate schema and auth; dispatch or broadcast.
  - **On close:** Remove client; leave all rooms; cleanup Redis memberships.

- **Interfaces:**
  ```python
  class WebSocketManager:
    async def accept(ws, client_id, user_id, auth_context) -> None
    async def disconnect(client_id) -> None
    async def join_room(client_id, room_id) -> bool  # AuthZ check
    async def leave_room(client_id, room_id) -> None
    async def broadcast(room_id, envelope) -> None  # Local + Redis
    async def dispatch(client_id, envelope) -> None  # Direct send
    async def validate_origin(headers) -> bool
    async def validate_auth(token) -> AuthContext
    async def can_access_room(auth_ctx, room_id) -> bool
  ```

### Redis Adapter (`backend/app/core/redis_adapter`)
- **Responsibilities:**
  - Pub/sub bridge: subscribe to channels `ws:room:{room_id}` for all rooms on startup.
  - Fan-out: all backend instances subscribe; deliver to local clients only (no cross-instance duplication).
  - Event bus integration: subscribe to `agent:{conversation_id}:*` topics; transform agent events to envelopes; publish to `ws:room:conversation:{conversation_id}`.
  - Room membership tracking (optional): store Redis sets `ws:room:{room_id}:members` for presence/debugging.
  - Presence (optional): maintain `presence:user:{id}` with online status and TTL.

- **Pub/sub channels:**
  - `ws:room:user:{id}`: user-level notifications and events.
  - `ws:room:conversation:{id}`: conversation chat streaming.
  - `agent:{conversation_id}:step`: agent thinking steps.
  - `agent:{conversation_id}:token`: agent response chunks.
  - `agent:{conversation_id}:complete`: agent response completion.
  - `agent:{conversation_id}:error`: agent errors.

- **Interfaces:**
  ```python
  class RedisAdapter:
    async def publish(room_id: str, envelope: WebSocketEnvelope) -> None
    async def subscribe(patterns: List[str]) -> None
    async def on_message(callback: Callable) -> None
    async def add_to_room(room_id: str, client_id: str) -> None
    async def remove_from_room(room_id: str, client_id: str) -> None
    async def presence_set(user_id: str, status: str, ttl: int) -> None
    async def presence_get(user_id: str) -> Optional[str]
  ```

### Event Bus Integration
- **Agent service** (`backend/app/ai/agents/default_agent.py`):
  - Emits events to Redis channels as agent processes:
    - `agent:{conversation_id}:step` with `AgentStepPayload`
    - `agent:{conversation_id}:token` with `AgentResponseChunkPayload`
    - `agent:{conversation_id}:complete` with `AgentResponseCompletePayload`
    - `agent:{conversation_id}:error` with `AgentErrorPayload`
  - Or emit to a unified `agent:{conversation_id}` channel with envelope `type` field.

- **Redis Adapter transforms** agent events to WS envelopes:
  ```python
  # Example: agent:conv-123:token -> ws:room:conversation:conv-123
  {
    "version": 1,
    "type": "agent_response_chunk",
    "room": "conversation:conv-123",
    "ts": <epoch_ms>,
    "id": "<uuid>",
    "payload": {
      "conversationId": "conv-123",
      "messageId": "msg-456",
      "chunk": "Hello ",
      "metadata": {"model": "gpt-4o-mini"}
    },
    "meta": {"serverId": "backend-instance-1"}
  }
  ```

### Security
- **AuthN:** Validate JWT on WS upgrade; extract claims (sub=user_id, scope for conversation access).
- **AuthZ:** Server enforces room membership on join; `user:{id}` for self only; `conversation:{id}` checks participant list.
- **Origin checks:** Validate `Origin` header against allowed hosts; reject cross-site WS.
- **Rate limiting:** Per user/IP quotas; track messages/sec; drop or backoff on excess.
- **Message size:** Enforce max envelope size (e.g., 64KB); drop oversized messages.
- **Heartbeat:** Ping every 30s; close connection on missed pong after timeout.

### Error Handling
- **Invalid envelope:** Log and drop; send `error` envelope back to client.
- **AuthZ failure:** Deny join/leave; send `error` envelope.
- **Rate limit hit:** Throttle or close with 1008 (policy violation).
- **Redis unavailable:** Degrade to local-only broadcasts; log and alert.

### Performance
- **Streaming:** Chunk tokens as they arrive; don't buffer entire response; emit each chunk immediately.
- **Backpressure:** Monitor WebSocket buffer; if > threshold, slow sends or drop low-priority messages.
- **Room scaling:** Use Redis Streams or Sharded Pub/Sub if room member counts are very large.
- **Latency:** Keep connection handlers async; offload CPU-heavy work to background tasks.

### Deployment
- **Redis setup:**
  - Managed Redis or self-hosted with Sentinel/Cluster.
  - Enable keyspace notifications if needed for debugging.
  - Set reasonable `maxmemory` policy (ALLKEYS-LRU or VOLATILE-LRU).
  - TLS enabled; AUTH required; network ACLs.
- **Backend scaling:**
  - Multiple FastAPI instances behind load balancer.
  - All instances subscribe to same Redis channels.
  - Stateless: no sticky sessions required for WS; reconnect logic on FE handles instance changes.
  - Health check: `GET /healthz` includes Redis connectivity.
- **Monitoring:**
  - Metrics: active connections, room sizes, pub/sub lag, envelope throughput.
  - Logs: connection lifecycle, auth failures, rate limit hits, errors.
  - Alerts: disconnect spikes, Redis lag, WS buffer backpressure.

## Frontend Architecture

## WebSocket Client Service (`src/services/websocket-service/index.ts`)
- Connection lifecycle:
  - Connect: After auth is available; pass JWT via query or subprotocol.
  - Open: Reset backoff; emit `onConnect`; optionally send `join` for `user:{id}` and current `conversation:{id}`.
  - Close: Emit `onDisconnect`; distinguish clean vs error; schedule reconnect.
  - Teardown: Manual `disconnect()` sends code 1000; clears timers/listeners.
- Reconnection & backoff:
  - Exponential backoff with jitter; cap attempts; reset on successful open.
  - Rejoin rooms after reconnect; buffer outbound sends until open.
  - Pause reconnect when offline; resume when online.
- Authentication:
  - Prefer `Sec-WebSocket-Protocol: Bearer <JWT>` or `?token=<JWT>`; refresh token triggers reconnect or `auth_refresh` command.
- Rooms join/leave:
  - Client API: `join(roomId)`, `leave(roomId)`; track joined rooms to avoid duplicates.
  - Default join `user:{id}`; chat hook manages `conversation:{id}`.
- Envelope routing:
  - Unified message envelope: `{ version, type, room, ts, id, payload, meta }`.
  - Dispatch: Map `type` to callbacks: `agent_response_chunk`, `agent_response_complete`, `typing`, `notification`, `error`, `ping/pong`.
- Health & backpressure:
  - Heartbeat ping/pong; reconnect on missed pongs.
  - Monitor buffered amount; batch large sends.
- Surface:
  - `connect(conversationId, userId)`, `disconnect()`, `sendMessage()`, `sendTypingIndicator()` already exist.
  - Extend with `join(roomId)`, `leave(roomId)`, `on(envelopeType, cb)`, `off(envelopeType, cb)`, `setAuth(jwt)`.

## Chat Hook (`src/hooks/use-chat/index.ts`)
- Room subscription:
  - On `selectConversation(id)`: call `websocketService.join('conversation:' + id)`; `leave` previous room.
  - Rely on provider for `user:{id}` room.
- Streaming handling:
  - `agent_response_chunk`: buffer chunks in `streamingMessageRef`; update UI incrementally.
  - `agent_response_complete`: finalize streaming state; convert to persisted `Message`; prepend to `messages`.
  - Guard by `conversationId` and `messageId` to avoid cross-talk.
- Typing indicators:
  - Handle `typing` messages for current conversation; update `typingUsers`.
- Polling fallback:
  - On WS error or disconnected state, poll `chatService.getMessages(conversationId)` at ~5s intervals until AI response appears or timeout.
- Cleanup:
  - On unmount or conversation change, remove listeners, `leave` room, reset streaming refs.

## Provider Integration (`WebSocketProvider` + `WorkspaceProvider`)
- WebSocketProvider responsibilities:
  - Establish single WS after login (listen to Auth store).
  - Join `user:{id}` upon connect; expose helpers and state via context.
  - Handle token rotation: reconnect or refresh auth.
  - Clean close on logout, tab close, or provider unmount.
- Composition:
  - App providers: `AuthProvider` → `WorkspaceProvider` → `WebSocketProvider` → pages/components.
  - Chat hook requests conversation room joins via service; layout listens for notifications from context.

## Deployment Prerequisites
- **Env:** 
  - Backend: `REDIS_URL` for pub/sub adapter, `WS_HEARTBEAT_INTERVAL` (30s), `WS_MAX_SIZE` (64KB).
  - Frontend: `NEXT_PUBLIC_WS_URL` → `wss://` production URL.
- **Backend WS gateway:** 
  - FastAPI with `python-socketio` or raw WebSocket handler; JWT validation on upgrade.
  - Redis pub/sub adapter; multi-instance coordination.
  - Rate limiting: token bucket or sliding window per user/IP.
  - Heartbeat/ping-pong implementation.
  - Authorization per room on join/leave and publish.
- **Frontend requirements:**
  - Node.js 16+ with WebSocket support (native in modern browsers).
  - `NEXT_PUBLIC_WS_URL` configured to backend WSS endpoint.
- **Infrastructure:**
  - Redis: managed service (AWS ElastiCache, GCP Cloud Memorystore, Heroku Redis) or self-hosted.
  - Proxy (Nginx/Cloudflare/ALB): configure WebSocket upgrade headers (e.g., `Upgrade: websocket`, `Connection: Upgrade`).
  - TLS/SSL: use `wss://` in production; certificate on reverse proxy or backend.
  - CORS/WS origins: restrict allowed origins; configure at proxy and backend.
- **Observability:** 
  - Client logs: connect/reconnect events, errors, streaming latency.
  - Backend metrics: active connections, room sizes, pub/sub lag, envelope throughput.
  - Traces: include `traceId` and `requestId` in envelope meta for debugging.

## Message Envelope Schema

### Unified Envelope (sent over WS)
```typescript
interface WebSocketEnvelope<TPayload = unknown> {
  version: number;           // 1
  type: WebSocketMessageType; // agent_response_chunk, typing, notification, etc.
  room: string;               // 'user:{id}', 'conversation:{id}'
  ts: number;                 // ms since epoch
  id: string;                 // UUID for dedupe
  payload: TPayload;          // Type-specific data
  meta?: {
    traceId?: string;
    requestId?: string;
    serverId?: string;
    model?: string;
    tokens?: { prompt: number; completion: number };
  };
}
```

### Message Types & Payloads
- **AgentResponseChunk:**
  ```json
  {
    "conversationId": "conv-123",
    "messageId": "msg-456",
    "chunk": "Hello world",
    "index": 0,
    "metadata": {"model": "gpt-4o-mini"}
  }
  ```

- **AgentResponseComplete:**
  ```json
  {
    "conversationId": "conv-123",
    "messageId": "msg-456",
    "summary": "Full response text...",
    "usage": {
      "promptTokens": 10,
      "completionTokens": 50
    }
  }
  ```

- **AgentStep:**
  ```json
  {
    "conversationId": "conv-123",
    "stepId": "step-1",
    "kind": "plan",
    "text": "I will search for information..."
  }
  ```

- **Typing:**
  ```json
  {
    "userId": "user-789",
    "conversationId": "conv-123",
    "isTyping": true
  }
  ```

- **Notification:**
  ```json
  {
    "title": "New message",
    "body": "You have a new message",
    "severity": "info",
    "actionUrl": "/chat/conv-123"
  }
  ```

- **Error:**
  ```json
  {
    "code": "AGENT_ERROR",
    "message": "Failed to process request"
  }
  ```

- **Ping/Pong:** `{}` (empty payload)

- **JoinAck/LeaveAck:**
  ```json
  {
    "room": "conversation:conv-123",
    "success": true,
    "message": "Joined successfully"
  }
  ```

## Integration Points

### Backend → FE Streaming
1. User sends message in chat page.
2. Backend creates user message and spawns async agent task.
3. Agent task emits events to Redis channels as it processes.
4. Redis Adapter converts events to WS envelopes.
5. WS Manager publishes to `ws:room:conversation:{id}`.
6. FE WS client receives envelopes; routes to `useChat` hook.
7. Hook buffers chunks and renders incrementally.
8. On completion, hook finalizes message and stops polling.

### FE → Backend Commands
- **Join room:** `{"action": "join", "room": "conversation:conv-123"}`
- **Leave room:** `{"action": "leave", "room": "conversation:conv-123"}`
- **Ping:** `{"action": "ping"}`
- **Typing indicator:** `{"action": "typing", "room": "conversation:conv-123", "data": {"isTyping": true}}`
- **Send message:** (via REST `POST /messages`, not WS)
- **Note:** Authentication is handled during WebSocket handshake via JWT token in URL query parameter. Token refresh requires reconnection with new token.

### Notifications (Layout)
1. Backend service triggers notification (e.g., new collaboration invite).
2. Backend publishes to `ws:room:user:{user_id}`.
3. Envelope type: `notification`.
4. FE layout listens on `user:{id}` room; shows badge/toast.

## Logging & Debugging

### Backend Logs
- Connection: `[WS] Client {client_id} connected (user_id={user_id})`
- Room join: `[WS] Client {client_id} joined room {room_id}`
- Publish: `[WS] Published {envelope_type} to {room_id} ({recipient_count} recipients)`
- Error: `[WS] Error: {code} - {message} (trace_id={trace_id})`

### Frontend Logs
- Connection: `[WS] Connecting to ws://...`
- Reconnect: `[WS] Reconnection attempt {attempt}/{max} in {delay}ms`
- Envelope: `[WS] Received {type} for room {room}`
- Fallback: `[WS] Polling fallback started for conversation {id}`

## Testing Strategy

### Backend Unit Tests
- `test_ws_manager_accept`: validate JWT, assign client_id, emit hello.
- `test_ws_manager_join_room`: authZ checks, room membership.
- `test_ws_manager_broadcast`: publish to Redis, deliver to local clients.
- `test_redis_adapter_subscribe`: channel subscription, message routing.
- `test_redis_adapter_publish`: transform and fan-out envelopes.

### Frontend Unit Tests
- `test_websocket_service_connect`: establish WS, set auth, emit connect event.
- `test_websocket_service_join_leave`: room management, dedup.
- `test_websocket_service_reconnect`: backoff, rejoin rooms, state recovery.
- `test_use_chat_stream_handling`: buffer chunks, finalize on complete.
- `test_use_chat_polling_fallback`: start/stop polling, handle timeout.

### Integration Tests
- E2E: Send message → agent processes → WS streams chunks → FE displays incrementally → polling as fallback.
- Multi-instance: Publish from instance A, client connected to instance B receives via Redis.
- Auth: Reject unauthorized room joins; allow only participants.
- Reconnect: Disconnect mid-stream → reconnect → rejoin room → resume or fetch final state.

## Implementation Checklist
- ✅ Frontend Client service: Join/leave, JWT propagation, heartbeat, unified envelope routing, reconnection with jitter.
- ✅ Frontend Chat hook: Room join/leave per selection, streaming buffer/finalization, typing, polling fallback.
- ✅ Frontend Provider: Implement `WebSocketProvider` to connect post-login and subscribe to `user:{id}`.
- ✅ Frontend Types: Introduce envelope and enums, align with backend schema.
- ⬜ Backend WS Manager: Accept connections, validate auth, manage rooms, dispatch/broadcast.
- ⬜ Backend Redis Adapter: Pub/sub integration, channel mapping, event bus transformation.
- ⬜ Backend Agent integration: Emit events to Redis channels as agent processes.
- ⬜ Backend Auth validation: JWT on upgrade, room-level authZ checks.
- ⬜ Backend Health/monitoring: Connection count metrics, Redis lag monitoring, error tracking.
- ⬜ Config: `NEXT_PUBLIC_WS_URL` (frontend), `REDIS_URL` (backend), TLS/WSS in production.
- ⬜ Deployment: Redis setup, proxy WS upgrade headers, monitoring/alerting.
