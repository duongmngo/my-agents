# Agent Streaming and Response Handling

## Overview

This document describes the architecture and implementation for streaming AI agent responses with multi-step thinking/execution, including fallback mechanisms for WebSocket failures.

## Architecture

### High-Level Flow

```
User Message → Backend REST API → Background Task (asyncio)
                                 ↓
                         LangGraph + OpenAI
                                 ↓
                    WebSocket Events (streaming)
                    OR Polling Fallback (REST)
                                 ↓
                          Frontend UI Update
                                 ↓
                         Unlock Input + Render
```

## Backend Implementation

### 1. Message Creation & Asynchronous Processing

**Endpoint:** `POST /api/v1/messages`

```
Request:
{
  "conversationId": "conv-123",
  "type": "user_message",
  "content": "What is Python?"
}

Response (immediate):
{
  "data": {
    "id": "msg-user-456",
    "conversationId": "conv-123",
    "content": "What is Python?",
    "type": "user_message",
    "senderId": "user-789",
    "createdAt": "2025-12-13T10:00:00Z",
    ...
  }
}
```

**Backend behavior:**
1. Create user message immediately
2. Return response to FE (no blocking)
3. Spawn async background task for AI response
4. Task instantiates AgentEventEmitter (callback implementation)
5. Passes callback to agent.generate_agent_response(callback=emitter)
6. Agent calls callback methods, emitter publishes to Redis
7. WebSocketManager listens to Redis and forwards to clients

### 2. DefaultAgent with Streaming Support

**File:** `backend/app/ai/agents/default_agent.py`

**Key features:**
- LangGraph with 3 nodes: `Plan → Generate → Finalize`
- Accepts `callback: AgentEventCallback` protocol parameter
- Supports streaming tokens from OpenAI
- Delegates event emission to callback (separation of concerns)
- Persists final message with metadata containing step history

**Callback Protocol:**

```python
from typing import Protocol, Dict, Any, Optional

class AgentEventCallback(Protocol):
    """Protocol for agent event callbacks.
    
    The agent should NOT directly emit to Redis/WebSocket.
    Instead, it calls methods on this protocol, and the
    caller decides how to handle events (Redis, logging, testing, etc.)
    """
    
    async def on_step(
        self,
        conversation_id: str,
        message_id: str,
        step_index: int,
        kind: str,  # "reasoning", "plan", "tool_call", "tool_result"
        content: str
    ) -> None:
        """Called for thinking/planning/tool steps"""
        pass

    async def on_token(
        self,
        conversation_id: str,
        message_id: str,
        token: str,
        is_final: bool = False
    ) -> None:
        """Called for each streamed token"""
        pass

    async def on_complete(
        self,
        conversation_id: str,
        message_id: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Called when AI response is complete"""
        pass

    async def on_error(
        self,
        conversation_id: str,
        error: str,
        message_id: Optional[str] = None,
        code: Optional[str] = None
    ) -> None:
        """Called on failure"""
        pass
```

**Agent flow:**
```python
1. Accept callback parameter in generate_agent_response()
2. Load OpenAI API key from .env
3. Prepare conversation history (last 12 messages)
4. Build initial state with conversation_id, message_id
5. Execute LangGraph nodes:
   - Plan node: callback.on_step(kind="plan", ...)
   - Generate node: callback.on_token(...) for each token
   - Finalize node: callback.on_complete(...)
6. Create Message in database with metadata
7. Return saved Message
```

**Message persistence with metadata:**

```python
# Database message row
{
  "id": "msg-ai-457",
  "conversation_id": "conv-123",
  "type": "ai_response",
  "sender_id": "ai-assistant",
  "content": "Python is a high-level programming language...\n\n```python\nprint('Hello')\n```",
  "message_metadata": {
    "steps": [
      {
        "kind": "plan",
        "text": "Analyzing your request..."
      },
      {
        "kind": "final",
        "text": "Python is a high-level programming language..."
      }
    ],
    "model": "gpt-4o-mini",
    "aiCompletionTokens": 456
  },
  "created_at": "2025-12-13T10:00:05Z"
}
```

### 3. Event Emitter Callback Implementation

**File:** `backend/app/services/agent_event_emitter.py`

**Class:** `AgentEventEmitter` (implements `AgentEventCallback` protocol)

This service implements the callback protocol and publishes events to Redis channels.
The agent DOES NOT directly import or use this - it only knows about the protocol.

```python
class AgentEventEmitter:
    """Redis-based implementation of AgentEventCallback.
    
    Publishes agent events to Redis pub/sub channels for WebSocket delivery.
    """
    
    async def on_step(
        self,
        conversation_id: str,
        message_id: str,
        step_index: int,
        kind: str,
        content: str
    ) -> None:
        """Publish step event to Redis"""
        await self.redis.publish(
            f"agent:{conversation_id}:step",
            json.dumps({
                "type": "agent_step",
                "message_id": message_id,
                "step_index": step_index,
                "kind": kind,
                "content": content
            })
        )
    
    async def on_token(
        self,
        conversation_id: str,
        message_id: str,
        token: str,
        is_final: bool = False
    ) -> None:
        """Publish token event to Redis"""
        await self.redis.publish(
            f"agent:{conversation_id}:token",
            json.dumps({
                "type": "agent_token",
                "message_id": message_id,
                "token": token,
                "is_final": is_final
            })
        )
    
    # ... on_complete, on_error implementations
```

**WebSocket events received by frontend:**

```python
# Event 1: Thinking step
{
  "type": "agent_step",
  "conversationId": "conv-123",
  "step": {
    "kind": "plan",
    "text": "Analyzing your request..."
  }
}

# Event 2: Streamed token (real-time)
{
  "type": "agent_token",
  "conversationId": "conv-123",
  "token": "Python"
}

# Event 3: Completion with full message
{
  "type": "agent_complete",
  "conversationId": "conv-123",
  "message": {
    "id": "msg-ai-457",
    "conversationId": "conv-123",
    "content": "Python is a high-level...",
    "type": "ai_response",
    "metadata": {
      "steps": [...]
    },
    "createdAt": "2025-12-13T10:00:05Z"
  }
}

# Event 4: Error
{
  "type": "agent_error",
  "conversationId": "conv-123",
  "error": "OpenAI API error: rate limit exceeded"
}
```

### 4. Polling Fallback Endpoints

**Endpoint 1:** `GET /api/v1/messages/{message_id}`

Fetch single message by ID for polling verification.

```
Response:
{
  "data": {
    "id": "msg-ai-457",
    "conversationId": "conv-123",
    "content": "Python is...",
    "type": "ai_response",
    "metadata": {...},
    "createdAt": "2025-12-13T10:00:05Z"
  }
}
```

**Endpoint 2:** `GET /api/v1/conversations/{conversation_id}/messages`

Fetch all messages in a conversation for polling fallback.

```
Query params:
- limit: 20 (default)
- offset: 0 (default)

Response:
{
  "data": [
    { message objects }
  ]
}
```

### 5. Database Schema

**Messages table:**

```sql
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  type ENUM('user_message', 'ai_response', ...) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  content LONGTEXT,
  message_metadata JSON,  -- stores steps, model, tokens
  ai_model VARCHAR(255),
  ai_prompt_tokens INT,
  ai_completion_tokens INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  INDEX idx_conversation_created (conversation_id, created_at)
);
```

**Message metadata structure:**

```json
{
  "steps": [
    {
      "kind": "plan",
      "text": "Planning..."
    },
    {
      "kind": "tool_call",
      "tool": "search",
      "args": {"q": "python"},
      "callId": "tool-1"
    },
    {
      "kind": "tool_result",
      "callId": "tool-1",
      "output": "Search result..."
    },
    {
      "kind": "final",
      "text": "Final response..."
    }
  ],
  "model": "gpt-4o-mini",
  "aiCompletionTokens": 456
}
```

## Frontend Implementation

### 1. Message Send Flow

**User interaction:**
1. User types message in input
2. User clicks send button
3. Input locks (disabled state)
4. POST request to create message
5. Receive user message ID immediately
6. Attempt WebSocket connection
7. If WS fails → fallback to polling

### 2. WebSocket Listener

```typescript
class MessageStreamListener {
  private ws: WebSocket
  private conversationId: string
  private pollTimeout: ReturnType<typeof setTimeout> | null = null
  private maxPollAttempts = 60

  constructor(conversationId: string) {
    this.conversationId = conversationId
  }

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(
          `ws://localhost:8001/ws/conversations/${this.conversationId}`
        )

        this.ws.onopen = () => {
          console.log("WebSocket connected")
          resolve(true)
        }

        this.ws.onmessage = (event) => {
          const payload = JSON.parse(event.data)
          this.handleMessage(payload)
        }

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          resolve(false)  // Switch to polling
        }

        this.ws.onclose = () => {
          console.log("WebSocket closed")
        }

        // Timeout after 3 seconds
        setTimeout(() => resolve(false), 3000)
      } catch (error) {
        console.error("WebSocket connection failed:", error)
        resolve(false)
      }
    })
  }

  private handleMessage(payload: any) {
    switch (payload.type) {
      case "agent_step":
        this.emit("step", payload.step)
        break
      case "agent_token":
        this.emit("token", payload.token)
        break
      case "agent_complete":
        this.emit("complete", payload.message)
        this.disconnect()
        break
      case "agent_error":
        this.emit("error", payload.error)
        this.disconnect()
        break
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
    }
  }

  private emit(event: string, data: any) {
    // Emit to UI listeners
    window.dispatchEvent(
      new CustomEvent(`stream:${event}`, { detail: data })
    )
  }
}
```

### 3. Polling Fallback

```typescript
class PollingFallback {
  private conversationId: string
  private userMessageId: string
  private pollInterval = 5000  // 5 seconds
  private maxAttempts = 60  // 5 minutes total
  private attempts = 0
  private pollTimer: ReturnType<typeof setInterval> | null = null

  constructor(conversationId: string, userMessageId: string) {
    this.conversationId = conversationId
    this.userMessageId = userMessageId
  }

  start() {
    this.pollTimer = setInterval(async () => {
      this.attempts++

      try {
        const response = await fetch(
          `/api/v1/conversations/${this.conversationId}/messages`
        )
        const result = await response.json()
        const messages = result.data

        // Find AI response created after user message
        const aiResponse = messages.find((msg) =>
          msg.type === "ai_response" &&
          new Date(msg.createdAt) > new Date(Date.now() - 60000)  // Within last minute
        )

        if (aiResponse) {
          this.emit("complete", aiResponse)
          this.stop()
          return
        }

        if (this.attempts >= this.maxAttempts) {
          this.emit("error", "Timeout waiting for AI response")
          this.stop()
        }
      } catch (error) {
        console.error("Polling error:", error)
        if (this.attempts >= this.maxAttempts) {
          this.emit("error", String(error))
          this.stop()
        }
      }
    }, this.pollInterval)
  }

  stop() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
    }
  }

  private emit(event: string, data: any) {
    window.dispatchEvent(
      new CustomEvent(`stream:${event}`, { detail: data })
    )
  }
}
```

### 4. Message Send Handler

```typescript
async function handleSendMessage(content: string, conversationId: string) {
  try {
    // Lock input
    setInputLocked(true)
    setStreamingSteps([])
    setStreamingContent("")

    // 1. Create user message
    const userMsgResponse = await fetch("/api/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        type: "user_message",
        content,
      }),
    })

    const userMsgData = await userMsgResponse.json()
    const userMessage = userMsgData.data

    // 2. Try WebSocket connection
    const listener = new MessageStreamListener(conversationId)
    const wsConnected = await listener.connect()

    if (wsConnected) {
      // 3a. WebSocket path
      setupWebSocketListeners(listener)
    } else {
      // 3b. Polling fallback
      console.log("WebSocket failed, using polling fallback")
      const poller = new PollingFallback(conversationId, userMessage.id)
      poller.start()
    }

    // 4. Listen for completion/error (both paths)
    window.addEventListener("stream:complete", handleComplete)
    window.addEventListener("stream:error", handleError)
    window.addEventListener("stream:token", handleToken)
    window.addEventListener("stream:step", handleStep)
  } catch (error) {
    console.error("Send message error:", error)
    setInputLocked(false)
  }
}

function handleToken(event: CustomEvent) {
  setStreamingContent((prev) => prev + event.detail)
}

function handleStep(event: CustomEvent) {
  const step = event.detail
  setStreamingSteps((prev) => [...prev, step])
}

function handleComplete(event: CustomEvent) {
  const message = event.detail
  addMessageToChat(message)  // Add to conversation
  setInputLocked(false)  // Unlock input
  setStreamingContent("")
  setStreamingSteps([])
}

function handleError(event: CustomEvent) {
  showErrorNotification(event.detail)
  setInputLocked(false)
}
```

### 5. Message Rendering

```typescript
function renderMessage(message: Message) {
  const { content, metadata } = message

  return (
    <div className="message ai-response">
      {/* Render steps timeline */}
      {metadata?.steps && (
        <div className="steps-timeline">
          {metadata.steps.map((step, idx) => (
            <div key={idx} className={`step step-${step.kind}`}>
              {step.kind === "plan" && (
                <div className="step-plan">
                  <span className="icon">🤔</span>
                  <p>{step.text}</p>
                </div>
              )}

              {step.kind === "tool_call" && (
                <div className="step-tool">
                  <span className="icon">🔧</span>
                  <p>Calling {step.tool} with {JSON.stringify(step.args)}</p>
                </div>
              )}

              {step.kind === "tool_result" && (
                <div className="step-result">
                  <span className="icon">📋</span>
                  <p>{step.output}</p>
                </div>
              )}

              {step.kind === "final" && (
                <div className="step-final">
                  <span className="icon">✓</span>
                  <Markdown content={step.text} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Final markdown content */}
      <div className="message-content">
        <Markdown content={content} />
      </div>
    </div>
  )
}
```

### 6. Real-time Streaming UI

```typescript
function StreamingMessage() {
  const [steps, setSteps] = useState([])
  const [content, setContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(true)

  return (
    <div className="message streaming">
      {/* Steps so far */}
      {steps.map((step, idx) => (
        <StepComponent key={idx} step={step} />
      ))}

      {/* Buffered content */}
      {content && (
        <div className="streaming-content">
          <Markdown content={content} />
          {isStreaming && <span className="cursor">▋</span>}
        </div>
      )}

      {/* Loading indicator */}
      {isStreaming && !content && (
        <div className="loading">
          <span>AI is thinking</span>
          <div className="dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      )}
    </div>
  )
## AI Implementation (LangGraph)

### Agent Architecture

```
START
  ↓
[Plan Node]
  - Analyze user message and context
  - Generate plan for response
  - callback.on_step(kind="plan", content=plan)
  ↓
[Generate Node]
  - Build messages from conversation history
  - Call OpenAI Chat Completions API with streaming
  - For each token: callback.on_token(token)
  ↓
[Finalize Node]
  - callback.on_complete(content, metadata)
  ↓
END
```

### Current Implementation

**File:** `backend/app/ai/agents/default_agent.py`

**Key principles:**
- Agent accepts `callback: AgentEventCallback` parameter
- Agent does NOT import Redis, WebSocket, or any infrastructure
- Agent only calls callback methods (dependency inversion)
- Caller provides concrete implementation (AgentEventEmitter)
- Easy to test with mock callbacks
- Easy to add new event destinations (logging, metrics, etc.)

**Method signature:**

```python
async def generate_agent_response(
    self,
    conversation: Conversation,
    user_message: Message,
    conversation_history: Optional[List[Message]] = None,
    stream: bool = False,
    callback: Optional[AgentEventCallback] = None  # ← NEW
) -> Optional[Message]:
    """Generate agent response with optional event callback.
    
    Args:
        conversation: The conversation context
        user_message: The user's message to respond to
        conversation_history: Previous messages for context
        stream: Whether to stream tokens (always true if callback provided)
        callback: Optional callback for streaming events
    
    Returns:
        Saved Message object or None on error
    """
    pass
```ion
- Supports streaming via `stream=True` parameter
- Emits tokens through callback interface
- Persists final message with metadata

### Future Multi-Step Implementation

For agents that think, call tools, and execute:

```python
# Node 1: Planner (think about what to do)
async def planner(state):
    # Call LLM with instruction: "Should you call a tool?"
    # Return either: {"action": "tool", "tool_name": "search", ...}
    # Or: {"action": "finish", "reply": "..."}
    pass

# Node 2: Tool Executor
async def tool_executor(state):
    # Execute the requested tool
    # Return tool result
    pass

# Node 3: Reflector (think about result)
async def reflector(state):
    # Call LLM with tool result as context
    # Return final reply or loop back to planner
    pass

# Graph edges with conditional logic
graph.add_edge(START, "planner")
graph.add_conditional_edges(
    "planner",
    lambda state: "tool" if state.get("action") == "tool" else "finish",
    {"tool": "tool_executor", "finish": END}
)
graph.add_conditional_edges(
    "tool_executor",
    lambda state: "planner" if state.get("continue") else "reflector",
)
graph.add_edge("reflector", END)
```

## Error Handling

### Backend Scenarios

| Scenario | Action |
|----------|--------|
| OpenAI API rate limit | Emit `agent_error`, don't persist message |
| Empty response from LLM | Log warning, emit `agent_error` |
| Database connection error | Catch exception, emit `agent_error` |
| Missing OpenAI API key | Fail fast at agent init, emit `agent_error` |

### Frontend Scenarios

| Scenario | Action |
|----------|--------|
| WebSocket connection timeout | Switch to polling after 3s |
| Polling timeout (5 min) | Show error, unlock input, allow retry |
| Network error during send | Show error, unlock input |
| Message not found after polling | Show timeout error, allow retry |

## Performance Considerations

### Backend
- Async task execution (non-blocking)
- Stream tokens instead of buffering entire response
- Metadata stored as JSON for flexibility
- Message indexing on `conversation_id` and `created_at`

### Frontend
- WebSocket for low-latency streaming (preferred)
- Polling interval: 5 seconds (balance between latency and server load)
- Max polling duration: 5 minutes
- Render streaming content incrementally
- Step indicators show thinking progress

## Security

- OpenAI API key stored in `.env`, never exposed to FE
- WebSocket connected only for authorized users
- REST endpoints require authentication
- Message metadata sanitized before persistence
- Step text length limits to prevent injection

## Future Enhancements

1. **Multi-tool support:** Add `tool_call` and `tool_result` steps
2. **Agent branching:** Multiple parallel execution paths
3. **Token usage tracking:** Monitor and limit token consumption
4. **Response caching:** Cache similar queries
5. **Model selection:** UI-configurable LLM model per conversation
6. **Custom system prompts:** Per-agent or per-conversation prompts
7. **Streaming metadata:** Send step metadata over WebSocket as it happens (not just at completion)

## References

- LangGraph: https://langchain-ai.github.io/langgraph/
- OpenAI Streaming: https://platform.openai.com/docs/guides/gpt/chat-completions
- WebSocket Best Practices: https://www.ably.io/topic/websockets
