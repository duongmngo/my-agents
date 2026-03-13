# Notes Embedding Feature

**Status:** ✅ Complete  
**Implementation Date:** March 2026  

## Overview

Notes embedding enables semantic search over user-created notes by generating vector embeddings and storing them in Qdrant for RAG retrieval.

## Features

### Text Chunking
- Automatic chunking for notes > 1500 characters
- Semantic boundaries (paragraphs, sentences)
- Configurable chunk size (default: 1000 chars)
- Overlap for context continuity (default: 200 chars)

### Embedding Generation
- OpenAI text-embedding-3-small model
- Per-workspace isolation in Qdrant
- Metadata preservation (title, folder, tags)

### Source Citations
- Knowledge base tool returns source details
- Frontend displays citations with links
- Chunk-level source tracking

## Architecture

```
Note Creation/Update
        │
        ▼
┌───────────────────┐
│  NoteService      │
│  generate_note_   │
│  embedding_async  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐     ┌───────────────────┐
│  TextChunker      │────▶│  EmbeddingService │
│  chunk_text()     │     │  generate_and_    │
│                   │     │  store_vector()   │
└───────────────────┘     └────────┬──────────┘
                                   │
                                   ▼
                          ┌───────────────────┐
                          │  Qdrant Vector DB │
                          │  workspace_{id}   │
                          └───────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/services/note_service.py` | Embedding orchestration |
| `backend/app/utils/text_chunker.py` | Text chunking utility |
| `backend/app/services/embedding_service.py` | Vector generation & storage |
| `backend/app/ai/tools/knowledge_base.py` | RAG search tool |

## API

### Generate Embedding
```
POST /api/v1/notes/{note_id}/embed
```

Response:
```json
{
  "success": true,
  "dimension": 1536,
  "model": "text-embedding-3-small",
  "chunks_stored": 5,
  "total_chunks": 5,
  "latency_ms": 1234
}
```

### Check Embedding Status
Included in note response:
```json
{
  "id": "...",
  "title": "My Note",
  "embedding_stats": {
    "generated": true,
    "dimension": 1536,
    "model": "text-embedding-3-small",
    "chunks_stored": 5,
    "generated_at": "2026-03-11T12:00:00Z"
  }
}
```

## Chunking Details

| Parameter | Value | Notes |
|-----------|-------|-------|
| Chunk Size | 1000 chars | Approx 250 tokens |
| Overlap | 200 chars | Context continuity |
| Min Chunk | 100 chars | Don't create tiny chunks |
| Threshold | 1500 chars | Below this, no chunking |

### Chunk ID Format
Uses UUID5 for Qdrant compatibility:
```python
chunk_id = uuid.uuid5(CHUNK_NAMESPACE, f"{source_id}__chunk_{index}")
# e.g., "a1b2c3d4-e5f6-5789-0abc-def123456789"
```

## Metadata Stored

Each embedding point includes:
```json
{
  "title": "Note Title",
  "source_type": "note_chunk",
  "source_id": "uuid-chunk-id",
  "parent_id": "original-note-id",
  "chunk_index": 0,
  "total_chunks": 5,
  "char_start": 0,
  "char_end": 1000,
  "folder_id": "folder-uuid",
  "tags": ["tag1", "tag2"],
  "workspace_id": "workspace-uuid",
  "created_by": "user-uuid"
}
```

## Frontend Integration

### Embedding Button
Notes page shows "Generate Embedding" or "Embedded" status.

### Source Citations
`SourceCitations` component displays knowledge sources:
```tsx
<SourceCitations 
  sources={getKnowledgeBaseSources(message)}
  showContent={false}
  maxVisible={3}
/>
```

## Related Documentation

- [Tool Outputs Pattern](../../architecture/tool-outputs-metadata-pattern.md)
- [Vector Database Selection](../../architecture/vector-database-selection.md)
