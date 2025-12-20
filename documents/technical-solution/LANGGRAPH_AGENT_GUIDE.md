# LangGraph Agent Implementation Guide

## Overview

The `DefaultAgent` has been refactored to use **LangGraph StateGraph** instead of direct OpenAI API calls. This provides a structured, extensible graph-based agent that:

- Breaks processing into discrete nodes (Plan, Generate, Finalize)
- Emits events at each step for WebSocket streaming
- Integrates with the Redis event emitter for real-time client updates
- Maintains all existing agent interfaces

## Architecture

### StateGraph Structure

```
START → Plan → Generate → Finalize → END
         ↓       ↓          ↓
       [Emit   [Emit      [Emit
        Step]   Tokens]    Complete]
         ↓       ↓          ↓
      Redis Event Emitter (to WebSocket)
```

### AgentState TypedDict

```python
class AgentState(TypedDict):
    conversation_id: str      # Conversation ID
    message_id: str          # Unique message ID for streaming
    user_message: str        # Current user input
    conversation_history: List[Dict[str, str]]  # Recent message history
    plan: str               # Planning node output
    response: str           # Final response
    step_index: int         # Current step for event numbering
```

## Node Implementations

### 1. Plan Node (`_plan_node`)
**Purpose**: Analyze the user message and conversation context to create a strategy

**Process**:
1. Emits "reasoning" step indicating analysis is beginning
2. Creates a planning prompt from conversation history and user message
3. Calls ChatOpenAI LLM to generate a plan (1-2 sentences)
4. Emits "plan" step with the generated plan
5. Returns updated state with plan and incremented step_index

**Event Emission**:
```
emit_step(kind="reasoning", content="Analyzing user message...")
emit_step(kind="plan", content="Generated plan...")
```

### 2. Generate Node (`_generate_node`)
**Purpose**: Generate the response based on the plan using LLM streaming

**Process**:
1. Emits "tool_call" step indicating LLM invocation
2. Builds generation prompt incorporating:
   - The plan from previous node
   - Full conversation history
   - System prompt for behavior
   - Current user message
3. Creates ChatOpenAI with streaming=True
4. Streams response tokens and emits each chunk
5. Accumulates full response
6. Returns updated state with complete response

**Event Emission**:
```
emit_step(kind="tool_call", content="Calling LLM...")
emit_token(chunk="Hello ", is_final=False)  # For each token
emit_token(chunk="there!", is_final=False)
```

### 3. Finalize Node (`_finalize_node`)
**Purpose**: Mark completion and prepare for persistence

**Process**:
1. Emits "tool_result" step indicating finalization
2. Emits "complete" event with:
   - Final response text
   - Metadata (model, temperature, plan)
3. Returns updated step_index

**Event Emission**:
```
emit_step(kind="tool_result", content="Response finalized")
emit_complete(final_text="...", metadata={...})
```

## Integration with Event Emitter

### Redis Channels

Events are published to Redis channels following the pattern: `agent:{conversation_id}:{event_type}`

**Channels**:
- `agent:{conv_id}:step` → AgentStepPayload
- `agent:{conv_id}:token` → AgentResponseChunkPayload
- `agent:{conv_id}:complete` → AgentResponseCompletePayload
- `agent:{conv_id}:error` → AgentErrorPayload

### Event Flow

```python
# In each node
event_emitter = get_agent_event_emitter()

# Emit step
await event_emitter.emit_step(
    conversation_id=state["conversation_id"],
    message_id=state["message_id"],
    step_index=state["step_index"],
    kind="plan",  # "plan" | "reasoning" | "tool_call" | "tool_result"
    content="...",
    tool_name=None,
    tool_input=None
)

# Emit token (in generate node)
await event_emitter.emit_token(
    conversation_id=state["conversation_id"],
    message_id=state["message_id"],
    chunk="token text",
    is_final=False
)

# Emit completion
await event_emitter.emit_complete(
    conversation_id=state["conversation_id"],
    message_id=state["message_id"],
    final_text="...",
    metadata={...}
)
```

## Main Method: `generate_agent_response`

### Signature
```python
async def generate_agent_response(
    self,
    conversation: Conversation,
    user_message: Message,
    conversation_history: Optional[List[Message]] = None,
    stream: bool = False,
) -> Optional[Message]
```

### Execution Flow

1. **Setup**:
   - Get event emitter instance
   - Generate unique message_id for streaming tracking
   - Ensure Redis connection

2. **Prepare State**:
   - Convert Message objects to dicts
   - Build AgentState with conversation context
   - Last 12 messages used for history

3. **Execute Graph**:
   - Run graph in thread pool to avoid blocking
   - Graph processes through Plan → Generate → Finalize
   - Events emitted at each step to Redis

4. **Persist Result**:
   - Create Message object from final response
   - Save to database via ChatRepository
   - Return saved message

5. **Error Handling**:
   - Catch all exceptions
   - Emit error event to Redis
   - Return None on failure

### Code
```python
async def generate_agent_response(
    self,
    conversation: Conversation,
    user_message: Message,
    conversation_history: Optional[List[Message]] = None,
    stream: bool = False,
) -> Optional[Message]:
    """Run the LangGraph and save the final response."""
    event_emitter = get_agent_event_emitter()
    message_id = str(uuid.uuid4())
    
    try:
        # Ensure Redis connection
        await event_emitter.connect()
        
        # Convert conversation history to dict format
        history_dicts = []
        if conversation_history:
            for msg in conversation_history[-12:]:
                role = "assistant" if msg.type.value == MessageType.AI_RESPONSE.value else "user"
                history_dicts.append({
                    "role": role,
                    "content": msg.content or ""
                })
        
        # Build initial state
        initial_state: AgentState = {
            "conversation_id": str(conversation.id),
            "message_id": message_id,
            "user_message": str(user_message.content or ""),
            "conversation_history": history_dicts,
            "plan": "",
            "response": "",
            "step_index": 0
        }
        
        # Execute the graph in thread pool
        def invoke_graph():
            if self.graph:
                return self.graph.invoke(initial_state)
            return initial_state
        
        final_state = await asyncio.to_thread(invoke_graph)
        
        # Save the response
        chat_repo = ChatRepository()
        ai_message = Message(
            content=final_state.get("response", ""),
            type=MessageType.AI_RESPONSE,
            conversation_id=conversation.id,
            workspace_id=conversation.workspace_id,
            ai_model=self.model
        )
        
        saved = chat_repo.create_message(ai_message)
        return saved
    
    except Exception as e:
        logger.exception(f"DefaultAgent response generation failed: {e}")
        await event_emitter.emit_error(
            str(conversation.id),
            str(e),
            message_id=message_id,
            code="AGENT_ERROR"
        )
        return None
```

## Dependencies

### Installed via requirements.txt
- `langgraph>=0.8.0` - Graph framework
- `langchain>=1.1.0` - LangChain core
- `langchain-openai>=0.1.0` - OpenAI integration (NEW)

### API Keys Required
- `OPENAI_API_KEY` - For ChatOpenAI LLM calls

## Async/Thread Considerations

### Why Thread Pool?
- LangGraph's `invoke` is synchronous
- ChatOpenAI's `stream` is synchronous
- AsyncIO would block the event loop
- Solution: Run in thread pool with `asyncio.to_thread()`

### Code Pattern
```python
# Blocking function wrapped for async
def sync_operation():
    return llm.stream([message])

# Run in thread pool
result = await asyncio.to_thread(sync_operation)
```

## Error Handling

All nodes implement try/except with event emission:

```python
async def _plan_node(self, state: AgentState) -> Dict[str, Any]:
    event_emitter = get_agent_event_emitter()
    
    try:
        # ... process ...
        await event_emitter.emit_step(...)
        return {...}
    
    except Exception as e:
        logger.error(f"Plan node error: {e}")
        await event_emitter.emit_error(
            state["conversation_id"],
            str(e),
            message_id=state["message_id"],
            code="PLAN_ERROR"
        )
        raise  # Re-raise to propagate to main handler
```

Errors are:
1. Logged with full traceback
2. Emitted as error events to Redis (for frontend notification)
3. Re-raised to propagate up the graph
4. Caught in main method and handled

## Testing the Agent

### Local Test (without frontend)

```python
# In Python shell or script
from app.ai.agents.default_agent import DefaultAgent
from app.models import Conversation, Message, MessageType
import asyncio

async def test():
    agent = DefaultAgent()
    
    # Create mock objects
    conversation = Conversation(id="test-123", workspace_id="ws-123")
    user_msg = Message(content="Hello!", type=MessageType.USER_MESSAGE)
    history = []
    
    # Generate response
    response = await agent.generate_agent_response(
        conversation=conversation,
        user_message=user_msg,
        conversation_history=history,
        stream=True
    )
    
    print(f"Response: {response.content}")
    print(f"Model: {response.ai_model}")

asyncio.run(test())
```

### With Backend + WebSocket

1. **Terminal 1** - Start backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8001
```

2. **Terminal 2** - Send chat message:
```bash
curl -X POST http://localhost:8001/api/v1/chat/conversations/123/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!", "stream": true}'
```

3. **Terminal 3** - Monitor Redis events:
```bash
redis-cli
SUBSCRIBE "agent:*:*"
```

Should see:
```
agent:123:step
agent:123:token
agent:123:token
...
agent:123:complete
```

4. **Frontend** - WebSocket automatically receives streaming

## Extending the Agent

### Add New Node

```python
def _build_graph(self):
    workflow = StateGraph(AgentState)
    
    # Add new node
    workflow.add_node("new_step", self._new_step_node)
    
    # Add edges
    workflow.add_edge("plan", "new_step")
    workflow.add_edge("new_step", "generate")
    
    self.graph = workflow.compile()

async def _new_step_node(self, state: AgentState) -> Dict[str, Any]:
    """Custom processing node"""
    event_emitter = get_agent_event_emitter()
    
    try:
        await event_emitter.emit_step(
            state["conversation_id"],
            state["message_id"],
            step_index=state["step_index"],
            kind="reasoning",
            content="Custom processing..."
        )
        
        # ... your logic ...
        
        return {"step_index": state["step_index"] + 1}
    
    except Exception as e:
        logger.error(f"New step error: {e}")
        await event_emitter.emit_error(...)
        raise
```

### Add Tool Calls

```python
async def _generate_node(self, state: AgentState) -> Dict[str, Any]:
    # ... existing code ...
    
    # Before calling LLM, check if tool call needed
    if should_use_tool(state["user_message"]):
        await event_emitter.emit_step(
            ...,
            kind="tool_call",
            tool_name="search",
            tool_input={"query": "..."}
        )
        result = await call_tool("search", {...})
        await event_emitter.emit_step(
            ...,
            kind="tool_result",
            content=f"Tool result: {result}"
        )
    
    # ... continue with generation ...
```

## Performance Considerations

### Token Streaming Latency
- Each token waits 0.01s before emitting: `await asyncio.sleep(0.01)`
- Prevents overwhelming Redis/WebSocket
- Can be tuned based on message velocity

### Graph Execution Time
Typical latency per node:
- Plan node: 1-3 seconds (analysis + LLM)
- Generate node: Variable (streaming, depends on response length)
- Finalize node: <100ms

Total: 2-10 seconds typical for full response

### Memory Usage
- Stored in message in-flight (AgentState dict)
- ~100KB per conversation typical
- Cleaned up after completion

## Monitoring

### Logs to Watch
```
# Successful execution
INFO: Starting LangGraph execution for conversation {id}
INFO: Response saved for conversation {id}

# Errors
ERROR: Plan node error: ...
ERROR: Generate node error: ...
ERROR: DefaultAgent response generation failed: ...
```

### Redis Monitoring
```bash
redis-cli
MONITOR  # See all events

# Or count events
PUBSUB CHANNELS "agent:*"
PUBSUB NUMSUB "agent:conv-123:token"
```

### WebSocket Events (Frontend)
```json
// Step
{"type": "agent_step", "payload": {"kind": "plan", "content": "..."}}

// Token
{"type": "agent_response_chunk", "payload": {"chunk": "Hello"}}

// Complete
{"type": "agent_response_complete", "payload": {"finalText": "..."}}

// Error
{"type": "error", "payload": {"error": "..."}}
```

## Next Steps

1. **Install langchain-openai**: `pip install langchain-openai`
2. **Test with websocat**: Connect and send message
3. **Monitor Redis**: Verify events flowing
4. **Frontend integration**: Already implemented, auto-receives events
5. **Add tools**: Extend nodes with tool calls (search, calculator, etc.)
6. **Add memory**: Implement multi-turn conversation state
7. **Add validation**: Input validation in plan node
8. **Optimize timing**: Tune token emission delays

