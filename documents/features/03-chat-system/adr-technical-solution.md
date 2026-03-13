# ADR: Chat System Technical Solution

Date: 2025-11-19
Author: Architect / Engineering

**Status:** Proposed

**Context & Goals**
- Integrate the existing backend Agent system with a streaming chat API that supports market-standard behaviours (progressive streaming, stop/cancel, attachments, variant response types) similar to ChatGPT and Gemini.
- Requirements:
  - Streaming responses (token / chunk deltas) with the ability for the client to stop/cancel mid-stream.
  - Two-way control and low-latency progressive updates.
  - Support multiple response types (markdown, code snippets, downloadable files like PDFs, tables, HTML/JS), with a clear, extensible response-type model for future formats.
  - Safe rendering options (no arbitrary JS execution), authentication, observability, and persistence of transcripts/attachments.

**Decision**
Use WebSocket as the primary streaming transport (bi-directional control messages), with an SSE fallback (uni-directional) for simpler clients. Implement an event envelope (JSON) with typed events for deltas, final content, control signals, metadata updates and attachments. Integrate the Agent Runner to emit structured events into an async queue consumed by the WebSocket/SSE handlers. Add a server-side cancellation token and a `POST /v1/agent/chat/{chat_id}/stop` endpoint for non-WS clients.

**High-level Architecture**
- Client (browser or API client)
  - Opens a WebSocket to `WS /v1/agent/chat/{chat_id}/ws` (preferred) or subscribes to SSE `GET /v1/agent/chat/{chat_id}/events`.
  - Sends control messages (stop/pause/resume) over WS; calls `POST /v1/agent/chat/{chat_id}/stop` for SSE.
  - Renders streaming events using a renderer registry that maps `format`/`mimetype` to UI components.

- Backend (FastAPI)
  - API controllers under `app.api` expose: create-chat, WS streaming endpoint, SSE endpoint, stop endpoint, attachments download, and transcript fetch.
  - Conversation Manager: creates records in DB (via `app.repositories`), tracks status and cancellation tokens, and enqueues Agent runs.
  - Agent Runner: executes `app.ai.agents` logic and streams structured events to an asyncio.Queue.
  - Storage: attachments stored via existing storage adapter (S3-compatible or local media dir). Metadata + transcripts persisted in DB.

**API Surface**
1) Create/Start chat (synchronous request to kick off run)
- `POST /v1/agent/chat`
  - Request: `{ "agent_id": "<id>", "conversation_id": "optional", "input": "...", "response_types": ["text.markdown","file.pdf"], "metadata": {...} }`
  - Response: `202 Accepted` with `{ "chat_id": "<uuid>", "ws_url": "/v1/agent/chat/<chat_id>/ws" }`
  - Notes: This creates a DB entry and schedules an Agent-run worker (in-process async or offloaded worker).

2) WebSocket streaming (preferred)
- `WS /v1/agent/chat/{chat_id}/ws`
  - Client handshake payload (optional) on connect: `{ "user_id":"...", "mode":"stream" }`.
  - Server sends JSON event messages (one per WS message) matching the Event Envelope.
  - Client can send control messages: `{"type":"control","action":"stop"}` or `{"type":"control","action":"pause"}`.
  - Connection lifecycle: close when `control.done` or `control.error` emitted.

3) SSE fallback (uni-directional)
- `GET /v1/agent/chat/{chat_id}/events` (SSE stream of JSON `data:` lines)
- Stop: `POST /v1/agent/chat/{chat_id}/stop`

4) Stop / Cancel
- `POST /v1/agent/chat/{chat_id}/stop`
  - Cancels the Agent run, persists partial results, emits `control.cancelled` event to clients.

5) Attachments
- `GET /v1/agent/chat/{chat_id}/attachments/{attachment_id}`
  - Returns file or pre-signed URL of generated artifact (PDF, ZIP, etc.).

6) Fetch transcript/status
- `GET /v1/agent/chat/{chat_id}`
  - Returns conversation transcript, attachments metadata, and status (`running`, `done`, `cancelled`, `error`).

**Event Envelope**
Every message (WS or SSE) is a JSON object with these core fields:
- `type`: string — one of `content.delta`, `content.final`, `attachment.created`, `control.done`, `control.error`, `control.cancelled`, `meta.update`, etc.
- `timestamp`: ISO8601 UTC
- `seq`: integer monotonic event sequence for ordering
- `payload`: object containing type-specific fields

Example events:
- Token/Chunk delta (typing animation):
```
{
  "type": "content.delta",
  "seq": 12,
  "timestamp": "2025-11-19T10:20:30Z",
  "payload": {
    "format": "text.markdown",
    "mimetype": "text/markdown",
    "text": "Hello, wor"
  }
}
```

- Final content:
```
{
  "type":"content.final",
  "seq": 20,
  "payload": {
    "format":"text.markdown",
    "mimetype":"text/markdown",
    "text":"Hello, world\n\n```py\nprint(\"ok\")\n```"
  }
}
```

- Attachment created (file generation):
```
{
  "type":"attachment.created",
  "seq": 25,
  "payload": {
    "id":"att-1",
    "mimetype":"application/pdf",
    "filename":"summary.pdf",
    "size": 12345,
    "url":"/v1/agent/chat/<chat_id>/attachments/att-1"
  }
}
```

- Control done / error:
```
{ "type":"control.done", "payload": { "status":"success" } }
{ "type":"control.error", "payload": { "code":"agent_failure", "message":"Tool X failed" } }
```

Design guidelines:
- Prefer structured payloads (format + mimetype + content or reference) over free-text wrapping.
- Keep `format` as the logical renderer type (e.g., `text.markdown`, `code`, `file.pdf`, `table.csv`) and `mimetype` for Content-Type hints.

**Response Type Model (Extensible)**
Each response payload contains:
- `format`: logical format string (e.g., `text.markdown`, `code.python`, `table.csv`, `file.pdf`, `html`)
- `mimetype`: standard MIME string if applicable
- `content`: string for inline data OR `attachment_id` reference for generated files
- `metadata`: optional object (language, filename, suggested download name, schema_url)

Initial supported formats:
- `text.markdown` — markdown content to render with a Markdown renderer.
- `code` — code snippet; `metadata.language` indicates language for syntax highlighting; UI shows copy button.
- `file.pdf` / `file.zip` — server emits `attachment.created` and the client shows download/preview.
- `table.csv` / `table.json` — server sends structured data or CSV as attachment; client renders table with export.
- `html` — sanitized preview or sandboxed iframe; for safety prefer download/sandbox rather than executing raw JS.

Registry:
- Provide a small registry mapping `format` => renderer hints and allowed transports. The registry can be a code map (in `app.core` or `app.ai`) or a DB table for dynamic updates.

**Agent Runner Integration**
- Agent Runner interface (async):
```
async def run_agent(chat_id: str, input: str, event_queue: asyncio.Queue, cancel_event: asyncio.Event, response_types: List[str]):
    # Agent yields token deltas and structured events via event_queue.put_nowait(event)
    # Must periodically check cancel_event.is_set() and stop gracefully
```
- Agent implementations in `app/ai/agents/` should be adapted to emit structured events instead of returning only a final string.
- Use in-process async tasks for low-latency streaming demo; for production, consider offloading to a worker (Celery/RQ) and streaming events via an event broker or server-sent events pipeline.

**Streaming & Granularity**
- Emit token-level or chunk-level `content.delta` events for a typing animation effect. To control overhead, allow agent runner config:
  - `stream_chunk_size` (chars/tokens)
  - `stream_granularity_ms` (flush interval)
- Server may batch small tokens into larger `content.delta` messages when the client or transport prefers fewer events.

**Cancellation & Stop Behavior**
- Client-initiated stop (WS): `{ "type":"control", "action":"stop" }` over WS — server cancels task, persists partial output, emits `control.cancelled` and `content.final` (as partial result).
- SSE / HTTP clients: call `POST /v1/agent/chat/{chat_id}/stop`.
- Server behavior when cancelled:
  - If agent supports graceful cancellation, stop and save partial output.
  - If not, best-effort terminate underlying process and mark `status: cancelled` in DB.
  - Provide `resume` or `retry` via additional endpoint or by creating a new chat referencing previous.

**Persistence & Attachments**
- Persist transcripts and event metadata in DB via existing `app.repositories` patterns.
- Store generated files using the repo's storage adapter (S3-compatible or local media). Include attachment metadata in DB and return a download URL via `attachment.created` events.

**Frontend Integration**
- Renderer registry maps `format` -> React components (Markdown renderer, Code block with copy, Table viewer, File preview/download, Sanitized HTML preview with sandbox).
- WebSocket client sample flow:
  - `new WebSocket(wsUrl)`; on open, send optional handshake; receive events and update UI.
  - Stop button sends control stop over WS.
  - On `attachment.created`, render download button; for PDFs, show iframe preview.
- UX cases: show typing cursor for `content.delta`, flush to block on `content.final`, show error banners for `control.error`, show `Stopped — partial result` when cancelled.

**Security & Safety**
- Authenticate WebSocket connections (JWT or session) — check token on handshake.
- Sanitize HTML; do not execute arbitrary JS. For any HTML/JS response, require sandboxed iframe or only allow download.
- Enforce rate-limiting and per-user concurrency quotas to protect Agent resources.

**Observability & Metrics**
- Emit metrics for start/done/cancel/error and token counts.
- Log event sequence for debugging and include seq/timestamp in persisted transcripts.

**Testing**
- Unit tests for event envelope serialization and parsing.
- Integration test: start WS, mock Agent that emits deltas + final, assert event order and final transcript persisted.
- Stop test: send stop mid-stream and assert cancellation and persisted partial result.

**Implementation Plan & Mapping to Todos**
- `Design API & protocol` — completed (this ADR)
- `Implement streaming endpoint` — implement `WS /v1/agent/chat/{chat_id}/ws` and SSE fallback in `app.api.chat`.
- `Add stop/cancel mechanism` — add WS control handling plus `POST /v1/agent/chat/{chat_id}/stop`.
- `Define response-type schema` — code-driven registry and schema (as above) in `app.core.chat_formats`.
- `Integrate Agent pipeline` — adapt `app.ai.agents` to write to `asyncio.Queue` and check `cancel_event`.
- `Frontend changes & examples` — add example client code and a renderer registry in frontend; demo component under `frontend/src/components/StreamingChat`.
- `Tests & docs` — add unit and integration tests in `backend/tests` and update API docs in repository `docs/`.

**Risks & Alternatives**
- Long-running, resource-heavy Agent runs can overload the web process — alternative: offload to a worker queue and stream via a message broker.
- WebSocket scaling across multiple hosts needs sticky routing or centralized event broker (Redis pub/sub). For scale, use a central broker and publish events per `chat_id`.

**Next steps (recommended)**
1. Implement a small prototype (Option A): add a WebSocket endpoint and a mock Agent that streams deltas and supports stop, plus a minimal frontend example. This proves the API and UX quickly.
2. After prototype validation, adapt real `app.ai.agents` to emit structured events and wire storage/DB persistence.
3. Add tests and document the event envelope and response formats in `docs/`.

---

Files to add/modify (suggested):
- `app/api/chat.py` (new): WebSocket & SSE handlers, stop endpoint
- `app/core/chat_formats.py` (new): response-type registry
- `app/ai/agents/<adapted>`: emit events to provided `event_queue`
- `app/repositories/chat_repository.py`: persist transcripts and attachments
- `frontend/src/components/StreamingChat/*`: WS client + renderer components
- `technical-solution/03-chat-system/adr-technical-solution.md` (this file)

If you'd like, I can now implement the Option A prototype in the backend: add a WS handler, a mock Agent runner that streams deltas, and a `POST /v1/agent/chat/{chat_id}/stop` endpoint. Would you like me to proceed with that implementation?