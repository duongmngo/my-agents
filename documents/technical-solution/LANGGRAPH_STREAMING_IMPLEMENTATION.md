# LangGraph Agent with Streaming Events - Implementation Summary

## Changes Made

### 1. Refactored `DefaultAgent` to Use LangGraph StateGraph

**File**: `backend/app/ai/agents/default_agent.py`

- Removed direct OpenAI API calls
- Built structured StateGraph with 3 nodes:
  - **Plan Node**: Analyzes input and creates strategy
  - **Generate Node**: Streams response tokens
  - **Finalize Node**: Marks completion
- Integrated Redis event emission at each step
- Added AgentState TypedDict for type-safe state management
- Async/thread-pool integration for sync LangGraph operations

### 2. Added LangChain OpenAI Dependency

**File**: `backend/requirements.txt`

```
langchain-openai>=0.1.0
```

### 3. Created Comprehensive Documentation

**Files**:
- `backend/LANGGRAPH_AGENT_GUIDE.md` - Detailed implementation guide
- `backend/WEBSOCKET_IMPLEMENTATION.md` - WebSocket architecture reference
- `backend/app/core/websocket/README.md` - WebSocket module docs (already created)

## Architecture Overview

### Graph Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   generate_agent_response                   │
│                                                             │
│  1. Setup: Create message_id, ensure Redis connection      │
│  2. Prepare: Build AgentState from inputs                  │
│  3. Execute: Run StateGraph in thread pool                 │
│  4. Persist: Save response to database                     │
│  5. Return: Return saved Message object                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────┐
        │    LangGraph StateGraph.invoke    │
        │                                  │
        ├─ START ─────────────────────┐   │
        │                             ↓   │
        │                      ┌──────────────┐
        │                      │ Plan Node    │
        │                      │ (reasoning)  │
        │                      └──────┬───────┘
        │                             ↓
        │  emit_step(kind="plan")
        │  emit_step(kind="reasoning")
        │                             ↓
        │                      ┌──────────────────┐
        │                      │ Generate Node    │
        │                      │ (LLM streaming)  │
        │                      └────────┬─────────┘
        │                             ↓
        │  emit_token(chunk) x N
        │  emit_step(kind="tool_call")
        │                             ↓
        │                      ┌──────────────┐
        │                      │ Finalize Node│
        │                      │ (completion) │
        │                      └────────┬─────┘
        │                             ↓
        │  emit_complete()
        │  emit_step(kind="tool_result")
        │                             ↓
        │                         END ──────┐
        └──────────────────────────────────┘
                           ↓
                    Return final_state
```

### Event Emission to Redis

```
Redis Pub/Sub Channels
├── agent:{conversation_id}:step
│   └─ Payload: AgentStepPayload
│      └─ kind: "plan" | "reasoning" | "tool_call" | "tool_result"
│
├── agent:{conversation_id}:token
│   └─ Payload: AgentResponseChunkPayload
│      └─ chunk: "response text token"
│
├── agent:{conversation_id}:complete
│   └─ Payload: AgentResponseCompletePayload
│      └─ finalText: "complete response"
│
└── agent:{conversation_id}:error
    └─ Payload: AgentErrorPayload
       └─ error: "error message"

                    ↓ Redis Adapter
        
        WebSocket Manager
        ├─ Subscribes to channels
        ├─ Transforms to WebSocketEnvelope
        └─ Broadcasts to room: conversation:{conversation_id}
        
                    ↓
        
        Frontend WebSocket Clients
        ├─ Receives agent_response_chunk
        ├─ Receives agent_response_complete
        ├─ Receives agent_step
        └─ Renders streaming UI
```

## Key Implementation Details

### AgentState Type Definition
```python
class AgentState(TypedDict):
    conversation_id: str                          # For routing
    message_id: str                               # For deduplication
    user_message: str                             # Current input
    conversation_history: List[Dict[str, str]]    # Recent context
    plan: str                                     # Plan node output
    response: str                                 # Generate node output
    step_index: int                               # For event numbering
```

### Plan Node
- Emits "reasoning" step before processing
- Creates planning prompt with conversation context
- Calls ChatOpenAI (non-streaming) for efficiency
- Emits "plan" step with output
- Increments step_index

### Generate Node
- Emits "tool_call" step before LLM
- Streams response tokens from ChatOpenAI
- Emits each token immediately for real-time UI
- Accumulates full response
- Small delay (0.01s) between emissions to prevent overload

### Finalize Node
- Emits "tool_result" step for completion
- Emits complete event with metadata
- Increments final step_index

### Main Method Flow
1. Create unique message_id for tracking
2. Ensure Redis connection to event emitter
3. Convert Message objects to dicts for state
4. Build AgentState from inputs
5. Execute graph in asyncio thread pool
6. Extract response from final state
7. Create Message object and persist
8. Return saved message or None on error

## Integration Points

### With Chat API
```python
# In chat handler
response = await agent.generate_agent_response(
    conversation=conversation,
    user_message=user_message,
    conversation_history=history,
    stream=True  # Currently always emits events
)
# Frontend receives real-time updates via WebSocket
```

### With Event Emitter
```python
# In each node
event_emitter = get_agent_event_emitter()
await event_emitter.emit_step(...)      # Step events
await event_emitter.emit_token(...)     # Token events
await event_emitter.emit_complete(...)  # Completion
await event_emitter.emit_error(...)     # Errors
```

### With WebSocket
```
Agent → Redis Events → RedisAdapter → WebSocketManager → Frontend
         (publish)      (subscribe)     (broadcast)     (receive)
```

## Error Handling Strategy

### Node-Level
- Each node wrapped in try/except
- Errors logged with full traceback
- Error event emitted to Redis
- Exception re-raised to graph

### Graph-Level
- Graph execution fails if any node raises
- Main method catches exception
- Error event emitted
- Returns None

### Frontend
- Receives error event via WebSocket
- Displays error message to user
- Can retry or recover gracefully

## Async/Thread Pool Considerations

### Why Thread Pool?
LangGraph and ChatOpenAI are synchronous libraries:

```python
# Sync operations
llm.invoke(messages)        # Blocking
graph.invoke(state)         # Blocking
llm.stream(messages)        # Blocking

# Solution: Run in thread pool
await asyncio.to_thread(graph.invoke, state)
await asyncio.to_thread(lambda: llm.stream(...))
```

### Why Not asyncio.gather()?
- SingleTask execution required
- Graph nodes must run sequentially
- No parallelization possible
- Thread pool best for CPU-bound work

### Performance Impact
- Small overhead from thread context switching
- Redis operations still async in emit_* calls
- Overall latency: 1-3s plan + N*0.01s tokens + <100ms finalize

## Testing Checklist

- [ ] Install `langchain-openai>=0.1.0`
- [ ] Set `OPENAI_API_KEY` in .env
- [ ] Start Redis: `docker run -d -p 6379:6379 redis:latest`
- [ ] Start backend: `uvicorn app.main:app --reload --port 8001`
- [ ] Test LangGraph directly (Python script)
- [ ] Test via REST API with WebSocket client
- [ ] Monitor Redis: `redis-cli SUBSCRIBE "agent:*:*"`
- [ ] Verify frontend receives streaming events
- [ ] Test error scenarios (missing API key, malformed input)
- [ ] Check logs for traces of execution
- [ ] Load test with concurrent requests

## Future Enhancements

### Tool Integration
Add nodes for tool invocation:
```python
workflow.add_node("tools", self._tool_node)
workflow.add_edge("plan", "tools")
workflow.add_edge("tools", "generate")
```

### Advanced Routing
Conditional edges based on state:
```python
def should_use_tools(state):
    return "tool_call" in state["plan"]

workflow.add_conditional_edges("plan", should_use_tools, {
    True: "tools",
    False: "generate"
})
```

### Memory Management
Store state in conversation metadata:
```python
# Save plan for context in next turn
conversation.metadata["last_plan"] = final_state["plan"]
```

### Streaming Optimization
Configurable token batching:
```python
# Batch tokens to reduce overhead
async def emit_batched_tokens(tokens, delay=0.05):
    for batch in chunks(tokens, 5):
        await emitter.emit_token("".join(batch))
        await asyncio.sleep(delay)
```

### Multi-Step Reasoning
Add reasoning loop:
```python
workflow.add_node("verify", self._verify_node)
workflow.add_edge("generate", "verify")
workflow.add_conditional_edges("verify", verify_correct, {
    True: END,
    False: "plan"  # Loop back for refinement
})
```

## Files Modified

```
backend/
├── app/
│   ├── ai/
│   │   └── agents/
│   │       └── default_agent.py          (refactored to LangGraph)
│   ├── core/
│   │   ├── websocket/
│   │   │   ├── __init__.py              (already created)
│   │   │   ├── types.py                 (already created)
│   │   │   ├── manager.py               (already created)
│   │   │   ├── redis_adapter.py         (already created)
│   │   │   └── README.md                (already created)
│   │   ├── dependencies.py              (already updated)
│   │   └── middleware.py                (no change)
│   ├── api/
│   │   └── v1/
│   │       └── websocket.py             (already created)
│   ├── services/
│   │   └── agent_event_emitter.py       (already created)
│   └── main.py                          (already updated)
├── requirements.txt                      (added langchain-openai)
├── WEBSOCKET_IMPLEMENTATION.md          (already created)
├── LANGGRAPH_AGENT_GUIDE.md             (NEW - comprehensive guide)
└── README.md                            (no change)
```

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Environment
```bash
export OPENAI_API_KEY="sk-..."
export REDIS_URL="redis://localhost:6379"
```

### 3. Start Infrastructure
```bash
# Terminal 1: Redis
docker run -d -p 6379:6379 redis:latest

# Terminal 2: Backend
uvicorn app.main:app --reload --port 8001

# Terminal 3: Monitor events
redis-cli SUBSCRIBE "agent:*:*"
```

### 4. Test Agent
```bash
# Option A: Send via chat API
curl -X POST http://localhost:8001/api/v1/chat/conversations/{id}/messages \
  -H "Authorization: Bearer {token}" \
  -d '{"content": "Hello!", "stream": true}'

# Option B: Connect WebSocket and send message via frontend
# Frontend at http://localhost:3000
```

### 5. Monitor Execution
```bash
# Watch backend logs
# Watch Redis events
# Check frontend streaming UI
```

## Documentation

- **Implementation Details**: `LANGGRAPH_AGENT_GUIDE.md`
- **WebSocket Architecture**: `websocket-architecture.md`
- **Agent Streaming Flow**: `agent-streaming-response-handling.md`
- **Module Docs**: `app/core/websocket/README.md`

## Support

For issues:
1. Check logs for error traces
2. Verify Redis is running and accessible
3. Confirm `OPENAI_API_KEY` is set
4. Test with websocat before frontend
5. Check database connectivity
6. Monitor Redis channels with `redis-cli MONITOR`

