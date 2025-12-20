# WebSocket Handshake - Can It Finish?

## Answer: Yes ✅ The handshake **should complete successfully** if conditions are met

Let me trace through the complete flow:

## Handshake Sequence

### 1. Client Initiates WebSocket Connection

```javascript
// Frontend (browser)
const token = localStorage.getItem('access_token');
const ws = new WebSocket(`ws://localhost:8001/api/v1/ws?token=${token}`);

ws.onopen = () => {
  console.log("WebSocket opened");
  // Handshake complete!
};

ws.onmessage = (event) => {
  const envelope = JSON.parse(event.data);
  if (envelope.type === "hello") {
    console.log("Received HELLO from server");
  }
};
```

### 2. Server Receives Connection Request

```python
# backend/app/api/v1/websocket.py
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    manager: WebSocketManager = Depends(get_websocket_manager)
):
    """Entry point"""
    # ✅ Step 1: Check for token
    if not token:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION, 
            reason="Missing token"
        )
        return  # Handshake FAILED
    
    # ✅ Step 2: Call manager.accept() which does:
    client_id = await manager.accept(websocket, token)
    
    # ✅ Step 3: If accept returns client_id, handshake COMPLETE
    if not client_id:
        return  # Handshake FAILED
    
    # ✅ Now in message loop - handshake is done!
    while True:
        message = await websocket.receive_text()
        await manager.handle_client_message(client_id, message)
```

### 3. Manager Accepts Connection

```python
# backend/app/core/websocket/manager.py
async def accept(self, websocket: WebSocket, token: str) -> Optional[str]:
    """Completes the WebSocket handshake"""
    
    # ✅ Step A: Validate JWT token
    auth_ctx = await self.validate_auth(token)
    if not auth_ctx:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return None  # ❌ Handshake FAILED - Invalid token
    
    # ✅ Step B: ACCEPT the connection (FastAPI WebSocket handshake completes here!)
    await websocket.accept()
    # 🎉 HANDSHAKE COMPLETE AT THIS POINT
    
    # ✅ Step C: Generate client ID
    client_id = str(uuid.uuid4())
    
    # ✅ Step D: Create connection object
    conn = WebSocketConnection(websocket, client_id, auth_ctx)
    self.connections[client_id] = conn
    self.user_clients[auth_ctx.user_id] = client_id
    
    # ✅ Step E: Send HELLO message (application-level, after handshake)
    hello_payload = HelloPayload(
        serverTime=int(time.time() * 1000),
        clientId=client_id,
        version="1.0"
    )
    hello_envelope = WebSocketEnvelope.create(
        WebSocketMessageType.HELLO,
        room="system",
        payload=hello_payload
    )
    await self._send_to_client(client_id, hello_envelope)
    
    # ✅ Step F: Auto-join user room
    await self.join_room(client_id, f"user:{auth_ctx.user_id}")
    
    logger.info(f"Client {client_id} connected for user {auth_ctx.user_id}")
    
    return client_id  # ✅ Success!
```

## Detailed Handshake Timeline

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT (Browser)                      │
│                                                             │
│  const ws = new WebSocket('ws://...');                      │
│                                                             │
│  [Waiting for connection...] ←─ TCP 3-way handshake       │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP Upgrade Request
                             │ GET /api/v1/ws?token=XXX
                             │ Upgrade: websocket
                             │ Connection: Upgrade
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (FastAPI)                        │
│                                                             │
│  1. Receive upgrade request                                 │
│  2. Extract token from query: token = "XXX"                 │
│  3. Inject manager dependency                              │
│  4. await manager.accept(websocket, token)                 │
│     ├─ Validate token (JWT decode)                         │
│     ├─ await websocket.accept()  ← HTTP 101 Switching      │
│     └─ Create connection tracking                          │
│  5. Send HELLO envelope                                    │
│  6. Auto-join user room                                    │
│  7. Return client_id                                       │
│  8. Enter message loop                                     │
└────────────────────────────────┬────────────────────────────┘
                             │ HTTP 101 Switching Protocols
                             │ Upgrade: websocket
                             │ Connection: Upgrade
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT (Browser)                      │
│                                                             │
│  ws.onopen() triggered  ← 🎉 Handshake COMPLETE!          │
│  ws.readyState === WebSocket.OPEN  (1)                     │
│                                                             │
│  ws.onmessage(HELLO)                                       │
│                                                             │
│  ws.send(join_room_message)                                │
│                                                             │
│  [Ready for bidirectional messaging]                       │
└─────────────────────────────────────────────────────────────┘
```

## Potential Handshake Failures

### ❌ Failure 1: Missing Token

```
Client connects: ws://localhost:8001/api/v1/ws
  ↓
Server: if not token: close(WS_1008_POLICY_VIOLATION)
  ↓
Result: Connection rejected immediately
```

**Fix**: Always include token in query:
```javascript
const ws = new WebSocket(`ws://localhost:8001/api/v1/ws?token=${token}`);
```

### ❌ Failure 2: Invalid Token

```
Client connects: ws://localhost:8001/api/v1/ws?token=invalid
  ↓
Server: auth_ctx = verify_token("invalid")
  ↓
Server: if not auth_ctx: close(WS_1008_POLICY_VIOLATION, "Invalid token")
  ↓
Result: Connection rejected after validation
```

**Fix**: Use valid JWT token from login:
```javascript
const token = localStorage.getItem('access_token');  // From login response
const ws = new WebSocket(`ws://localhost:8001/api/v1/ws?token=${token}`);
```

### ❌ Failure 3: WebSocket Manager Not Initialized

```
Client connects: ws://localhost:8001/api/v1/ws?token=valid
  ↓
Server: manager = Depends(get_websocket_manager())
  ↓
Server: if _websocket_manager is None: raise RuntimeError(...)
  ↓
Result: 500 error, no connection
```

**Fix**: Ensure backend startup completed:
```bash
# Check logs for:
# INFO: Starting up My Agents API...
# INFO: WebSocket system initialized
# INFO: Uvicorn running on http://127.0.0.1:8001
```

### ❌ Failure 4: Redis Not Connected

```
Server startup:
  redis_adapter = RedisAdapter(...)
  await redis_adapter.connect()  ← Fails!
  ↓
  Manager initialization blocked
  ↓
Result: Backend never finishes startup, no connections accepted
```

**Fix**: Ensure Redis is running:
```bash
# Check Redis
redis-cli ping
# Should return: PONG

# Or start Redis
docker run -d -p 6379:6379 redis:latest

# Check logs for:
# INFO: Connected to Redis at redis://localhost:6379
```

### ❌ Failure 5: Database Connection Issues

```
Token validation:
  payload = verify_token(token)  ← Uses crypto, no DB
  auth_ctx = AuthContext(...)     ← Just creates object
  
This should NOT fail due to DB
But if it does fail elsewhere:
  ↓
Result: 500 error
```

**Fix**: Not usually an issue during handshake, but check if database is available.

## Success Criteria Checklist

For handshake to complete ✅:

- [ ] **Client has valid JWT token** from `/api/v1/auth/login`
- [ ] **Redis is running** and accessible at `REDIS_URL`
- [ ] **Backend is fully started** (see startup logs)
- [ ] **Client connects with token** in query: `?token=XXX`
- [ ] **CORS is properly configured** (allowed_origins in settings)
- [ ] **Network is reachable** (no firewall blocking WebSocket port)

## Testing the Handshake

### Test 1: websocat (Simple Test)

```bash
# Get token from login
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' | jq -r '.access_token')

# Connect with websocat
websocat "ws://localhost:8001/api/v1/ws?token=$TOKEN"

# Should receive:
# {"version":1,"type":"hello","room":"system","ts":1702552800000,"id":"...","payload":{...}}
```

### Test 2: JavaScript Console

```javascript
// In browser console
const token = localStorage.getItem('access_token');
const ws = new WebSocket(`ws://localhost:8001/api/v1/ws?token=${token}`);

ws.onopen = () => console.log("✅ Handshake complete!");
ws.onerror = (e) => console.error("❌ Error:", e);
ws.onmessage = (e) => console.log("📨 Message:", JSON.parse(e.data));

// Send test message
ws.send(JSON.stringify({action: "ping"}));
```

### Test 3: Frontend Integration

```javascript
// In React component
useEffect(() => {
  const token = localStorage.getItem('access_token');
  const ws = new WebSocket(`ws://localhost:8001/api/v1/ws?token=${token}`);
  
  ws.onopen = () => {
    console.log("✅ WebSocket connected");
    setConnected(true);
  };
  
  ws.onerror = (e) => {
    console.error("❌ WebSocket error:", e);
    setError("Connection failed");
  };
  
  return () => ws.close();
}, []);
```

## Debug Checklist

If handshake is failing, check in order:

```
1. Backend Logs
   ├─ Look for: "Starting up My Agents API..."
   ├─ Look for: "WebSocket system initialized"
   └─ Look for: "Connected to Redis at..."

2. Redis Connectivity
   ├─ redis-cli ping
   ├─ Check REDIS_URL env var
   └─ Docker: docker ps | grep redis

3. Token Validity
   ├─ Check token not expired
   ├─ Check token matches user_id
   └─ Try new login for fresh token

4. Browser Network Tab
   ├─ Check WebSocket request headers
   ├─ Check Switching Protocols response
   ├─ Look for error codes (101 = success)
   └─ Check query string has token

5. Frontend Error Boundaries
   ├─ ws.onerror event handler
   ├─ Browser console for JS errors
   └─ Network tab for failed handshake

6. Backend Firewall/Network
   ├─ Port 8001 is accessible
   ├─ WebSocket not blocked by proxy
   └─ CORS headers present
```

## Summary

**Can the socket finish handshake?**

✅ **YES** - The handshake will complete if:
1. Backend is fully initialized (startup completed)
2. Redis is running and connected
3. Client sends valid JWT token
4. Client connects to correct endpoint: `/api/v1/ws?token=XXX`
5. No network issues or firewall blocks

**The critical moment**: When `await websocket.accept()` is called in `manager.accept()`, the HTTP 101 Switching Protocols response is sent and the handshake is complete.

**After handshake**: The connection enters the message loop and is ready for bidirectional communication (app-level events like HELLO, JOIN_ACK, etc.).

