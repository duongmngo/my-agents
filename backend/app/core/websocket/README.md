# WebSocket Implementation - Backend

This directory contains the complete WebSocket implementation for real-time agent streaming and notifications.

## Architecture

### Components

1. **WebSocket Manager** (`manager.py`)
   - Manages all active WebSocket connections
   - Handles room-based subscriptions
   - Enforces authentication and authorization
   - Implements rate limiting and heartbeat
   - Routes messages to clients

2. **Redis Adapter** (`redis_adapter.py`)
   - Pub/sub integration for multi-instance scaling
   - Subscribes to room channels and agent events
   - Transforms agent events to WebSocket envelopes
   - Maintains room membership sets

3. **Types** (`types.py`)
   - Pydantic models for all message types
   - WebSocketEnvelope schema
   - Client message parsing
   - Type-safe payload definitions

### Message Flow

#### Agent Streaming
```
User sends message
    ↓
Chat API handler
    ↓
DefaultAgent.generate_agent_response(stream=True)
    ↓
Agent emits events to Redis:
  - agent:{conv_id}:step (thinking steps)
  - agent:{conv_id}:token (response chunks)
  - agent:{conv_id}:complete (final message)
  - agent:{conv_id}:error (errors)
    ↓
Redis Adapter listens and transforms to envelopes
    ↓
WebSocket Manager routes to room: conversation:{conv_id}
    ↓
All clients in room receive updates
```

#### Room Subscriptions
```
Client connects with JWT token
    ↓
WebSocket Manager validates and accepts
    ↓
Auto-join user:{user_id} room
    ↓
Client sends: {"action": "join", "room": "conversation:123"}
    ↓
Manager checks authorization
    ↓
Client added to room and receives join_ack
    ↓
Messages broadcast to room reach all subscribed clients
```

## API Endpoint

### WebSocket Connection
```
WS /api/v1/ws?token={JWT_TOKEN}
```

**Authentication**: JWT token via query parameter

**Protocol**:
1. Connect with token
2. Receive HELLO message with clientId
3. Auto-subscribed to `user:{userId}` room
4. Send actions to join/leave rooms
5. Receive envelopes for subscribed rooms

## Client Actions

### Join Room
```json
{
  "action": "join",
  "room": "conversation:123"
}
```

### Leave Room
```json
{
  "action": "leave",
  "room": "conversation:123"
}
```

### Ping
```json
{
  "action": "ping"
}
```
Responds with PONG envelope.

### Typing Indicator
```json
{
  "action": "typing",
  "room": "conversation:123",
  "data": {
    "isTyping": true
  }
}
```
Broadcasts to all room members.

## Message Types

### Agent Response Chunk
```json
{
  "version": 1,
  "type": "agent_response_chunk",
  "room": "conversation:123",
  "ts": 1702512345678,
  "id": "uuid",
  "payload": {
    "conversationId": "123",
    "messageId": "456",
    "chunk": "Hello ",
    "isFinal": false
  }
}
```

### Agent Response Complete
```json
{
  "version": 1,
  "type": "agent_response_complete",
  "room": "conversation:123",
  "ts": 1702512345678,
  "id": "uuid",
  "payload": {
    "conversationId": "123",
    "messageId": "456",
    "finalText": "Hello, how can I help?",
    "metadata": {
      "model": "gpt-4",
      "temperature": 0.7
    }
  }
}
```

### Agent Step
```json
{
  "version": 1,
  "type": "agent_step",
  "room": "conversation:123",
  "ts": 1702512345678,
  "id": "uuid",
  "payload": {
    "conversationId": "123",
    "messageId": "456",
    "stepIndex": 0,
    "kind": "plan",
    "content": "Analyzing the question...",
    "ts": 1702512345678
  }
}
```

### Error
```json
{
  "version": 1,
  "type": "error",
  "room": "system",
  "ts": 1702512345678,
  "id": "uuid",
  "payload": {
    "error": "Rate limit exceeded",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

## Room Types

### User Room
- Format: `user:{userId}`
- Purpose: Personal notifications, badges, system messages
- Authorization: User can only join their own room

### Conversation Room
- Format: `conversation:{conversationId}`
- Purpose: Chat streaming, agent responses, typing indicators
- Authorization: User must be a participant (checked against database)

### System Broadcast
- Format: `system:broadcast`
- Purpose: Global announcements
- Authorization: Read-only for all authenticated users

## Configuration

### Environment Variables
```env
REDIS_URL=redis://localhost:6379
```

### Settings (config.py)
```python
redis_url: str = "redis://localhost:6379"
```

## Security

### Authentication
- JWT validation on WebSocket upgrade
- Token extracted from query parameter
- User context derived from token claims

### Authorization
- Room access checked before joining
- `user:{id}` - Only self
- `conversation:{id}` - Participants only (TODO: database check)
- `system:broadcast` - All authenticated users

### Rate Limiting
- 100 messages per 60 seconds per client
- Enforced in WebSocket Manager
- Exceeding limit returns error envelope

### Message Size
- Maximum 1MB per message
- Oversized messages rejected with error

### Origin Validation
- Checks against `allowed_origins` from settings
- Prevents unauthorized domains

## Deployment

### Prerequisites
1. Redis server running
2. Environment variables configured
3. Database connection for authorization checks

### Multi-Instance Setup
1. All instances connect to same Redis
2. Redis pub/sub fans out messages
3. Each instance delivers to local clients only
4. No cross-instance duplication

### Scaling Considerations
- Redis is the coordination point
- Horizontal scaling: Add more backend instances
- Redis can be clustered for HA
- Room subscriptions are lightweight

## Testing

### Manual Testing with websocat
```bash
# Install websocat
brew install websocat

# Connect (replace with your JWT token)
websocat "ws://localhost:8001/api/v1/ws?token=YOUR_JWT_TOKEN"

# Send join command
{"action": "join", "room": "conversation:123"}

# Send ping
{"action": "ping"}

# In another terminal, trigger agent response via API
curl -X POST http://localhost:8001/api/v1/chat/conversations/123/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello", "stream": true}'
```

### Python Client Example
```python
import asyncio
import websockets
import json

async def test_websocket():
    token = "YOUR_JWT_TOKEN"
    uri = f"ws://localhost:8001/api/v1/ws?token={token}"
    
    async with websockets.connect(uri) as websocket:
        # Receive hello
        hello = await websocket.recv()
        print("Received:", hello)
        
        # Join room
        await websocket.send(json.dumps({
            "action": "join",
            "room": "conversation:123"
        }))
        
        # Listen for messages
        async for message in websocket:
            envelope = json.loads(message)
            print(f"Type: {envelope['type']}")
            print(f"Payload: {envelope['payload']}")

asyncio.run(test_websocket())
```

## Monitoring

### Logging
- Connection/disconnection events
- Room joins/leaves
- Message routing
- Errors and rate limit violations

### Metrics to Track
- Active connections count
- Rooms per instance
- Messages per second
- Redis pub/sub lag
- Stale connection cleanup rate

### Redis Monitoring
```bash
# Monitor pub/sub activity
redis-cli
> PUBSUB CHANNELS ws:room:*
> PUBSUB NUMSUB ws:room:conversation:123

# Check room members
> SMEMBERS ws:room:conversation:123:members

# Check user presence
> GET presence:user:123
```

## Troubleshooting

### Connection Rejected
- Check JWT token validity
- Verify token not expired
- Check allowed_origins in settings

### Messages Not Received
- Verify room subscription
- Check Redis connection
- Ensure agent is emitting events
- Check room membership in Redis

### Rate Limit Errors
- Reduce message frequency
- Check rate limit settings
- Look for message loops

### Stale Connections
- Heartbeat runs every 30s
- Connections idle >60s are disconnected
- Client should implement reconnection logic

## Future Enhancements

- [ ] Database-backed conversation authorization
- [ ] User presence status with TTL
- [ ] Typing indicator debouncing
- [ ] Message acknowledgments
- [ ] Offline message queueing
- [ ] WebSocket compression
- [ ] Metrics endpoint for monitoring
- [ ] Admin dashboard for connection management
