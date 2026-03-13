# Tool Outputs Metadata Pattern

## Overview

This document describes the pattern for storing and displaying tool outputs in the agent response metadata. Each tool can include a `dataType` flag in its output, allowing the frontend to filter and display results appropriately.

## Architecture

```
┌─────────────────────┐
│   Tool Execution    │
│  (knowledge_base,   │
│   web_search, etc)  │
└─────────┬───────────┘
          │ returns { dataType: "...", ... }
          ▼
┌─────────────────────┐
│   Agent State       │
│   tool_outputs: []  │
└─────────┬───────────┘
          │ collected outputs with dataType
          ▼
┌─────────────────────┐
│   COMPLETE Event    │
│   metadata: {       │
│     tool_outputs    │
│   }                 │
└─────────┬───────────┘
          │ saved to message_metadata
          ▼
┌─────────────────────┐
│   Message Entity    │
│   message_metadata  │
│   (JSON column)     │
└─────────┬───────────┘
          │ parsed to dict
          ▼
┌─────────────────────┐
│   Frontend          │
│   filter by dataType│
└─────────────────────┘
```

## Backend Implementation

### 1. Tool Output Format

Tools should return a `dataType` field to identify their output type:

```python
# backend/app/ai/tools/knowledge_base.py
return {
    "success": True,
    "query": query,
    "results": formatted_results,
    "dataType": "knowledge_base_results",  # <-- Required for frontend filtering
    "total_results": len(formatted_results),
}
```

### 2. Agent State TypedDict

Agents maintain a `tool_outputs` list in their state:

```python
# backend/app/ai/agents/default_agent.py
class AgentState(TypedDict):
    # ... other fields
    tool_outputs: List[Dict[str, Any]]  # All tool outputs with dataType
```

### 3. Collecting Tool Outputs

In the execute_tools node, outputs with `dataType` are collected:

```python
# Collect all tool outputs with dataType for frontend
tool_outputs = []
for result in tool_results:
    output = result.get("output", {})
    if isinstance(output, dict) and output.get("dataType"):
        tool_outputs.append({
            "tool": result.get("tool"),
            "dataType": output.get("dataType"),
            "data": output
        })

return {
    "tool_results": tool_results, 
    "tool_outputs": tool_outputs,
    "step_index": state["step_index"] + 2
}
```

### 4. Completion Event Metadata

The COMPLETE event includes tool_outputs in metadata:

```python
await self.chat_service.handle_response_events(
    conversation_id=str(conversation.id),
    response_id=message_id,
    event_type=AgentEventType.COMPLETE,
    payload={
        "content": final_state.get("response", ""),
        "metadata": {
            "model": self.model,
            "tool_outputs": final_state.get("tool_outputs", [])
        },
        # ...
    }
)
```

### 5. Message DTO

The API parses metadata JSON and returns as dict:

```python
# backend/app/api/v1/dtos/chat_dtos.py
class MessageItem(BaseApiModel):
    metadata: Optional[Dict[str, Any]] = None  # Parsed metadata object
```

```python
# backend/app/api/v1/chat.py
metadata_dict = json.loads(m.message_metadata) if isinstance(m.message_metadata, str) else m.message_metadata
dto_list.append(
    MessageItemDto(
        # ...
        metadata=metadata_dict,  # Parsed metadata dict
    )
)
```

## Frontend Implementation

### 1. TypeScript Types

```typescript
// frontend/src/types/chat-types/index.ts
export interface ToolOutput {
  tool: string;
  dataType: string;
  data: any;
}

export interface MessageMetadata {
  tool_outputs?: ToolOutput[];
  [key: string]: any;
}
```

### 2. Extracting Data by Type

Frontend filters tool_outputs by `dataType`:

```typescript
// frontend/src/app/[locale]/(authenticated)/chat/components/conversation-details-page.tsx
function getKnowledgeBaseSources(msg: Message): KnowledgeSource[] {
  // New format: filter tool_outputs by dataType
  if (msg.metadata?.tool_outputs) {
    const kbOutputs = msg.metadata.tool_outputs.filter(
      (output) => output.dataType === 'knowledge_base_results'
    );
    return kbOutputs.flatMap((output) => output.data?.results || []);
  }
  // Legacy fallback
  return msg.metadata?.sources ?? msg.sources ?? [];
}
```

### 3. Key Normalization

The `SourceCitations` component normalizes snake_case from backend to camelCase:

```typescript
// frontend/src/components/features/chat-system/source-citations.tsx
function normalizeSource(src: KnowledgeSource): KnowledgeSource {
  return {
    id: src.id,
    score: src.score,
    sourceType: (src.sourceType || src.source_type) as KnowledgeSource['sourceType'],
    sourceId: src.sourceId || src.source_id,
    source: {
      type: src.source.type,
      parentId: src.source.parentId || src.source.parent_id,
      // ... other fields
    },
  };
}
```

## Supported Data Types

| dataType | Tool | Description |
|----------|------|-------------|
| `knowledge_base_results` | `search_knowledge_base` | Vector DB search results with source citations |

## Adding New Tool Output Types

To add a new displayable tool output:

1. **Backend Tool**: Add `dataType` to return value
   ```python
   return {
       "success": True,
       "dataType": "your_data_type",
       "results": [...],
   }
   ```

2. **Frontend Filter**: Add extraction function
   ```typescript
   function getYourDataType(msg: Message): YourType[] {
     if (msg.metadata?.tool_outputs) {
       const outputs = msg.metadata.tool_outputs.filter(
         (output) => output.dataType === 'your_data_type'
       );
       return outputs.flatMap((output) => output.data?.results || []);
     }
     return [];
   }
   ```

3. **Component**: Create display component for the data type

## Files Modified

### Backend
- `backend/app/ai/tools/knowledge_base.py` - Added `dataType` field
- `backend/app/ai/agents/default_agent.py` - Collect `tool_outputs` in state
- `backend/app/ai/agents/rag_agent.py` - Collect `tool_outputs` in state
- `backend/app/api/v1/chat.py` - Parse metadata JSON to dict
- `backend/app/api/v1/dtos/chat_dtos.py` - Changed metadata type to `Dict[str, Any]`

### Frontend
- `frontend/src/types/chat-types/index.ts` - Added `ToolOutput` interface
- `frontend/src/components/features/chat-system/source-citations.tsx` - Normalize keys
- `frontend/src/app/[locale]/(authenticated)/chat/components/conversation-details-page.tsx` - Extract sources by dataType
