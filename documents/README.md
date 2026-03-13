# My Agents - Documentation Hub

Central documentation registry for the My Agents platform - an AI-powered multi-agent system with knowledge base, chat, and workspace management capabilities.

## Quick Links

| Category | Description |
|----------|-------------|
| [Features](./features/README.md) | Feature specifications & implementation status |
| [Conventions](./conventions/README.md) | Coding standards (backend, frontend, general) |
| [Architecture](./architecture/README.md) | System architecture & technical decisions |
| [Requirements](./requirements/README.md) | Business & technical requirements |
| [Development](./development/README.md) | Setup guides & deployment |

---

## Feature Registry

Master list of all features with current status and ownership.

| # | Feature | Status | Phase | Documentation |
|---|---------|--------|-------|---------------|
| 01 | **Authentication** | ✅ Done | MVP | [View](./features/01-authentication/README.md) |
| 02 | **Agent Management** | ✅ Done | MVP | [View](./features/02-agent-management/README.md) |
| 03 | **Chat System** | ✅ Done | MVP | [View](./features/03-chat-system/README.md) |
| 04 | **Workspace Management** | ✅ Done | MVP | [View](./features/04-workspace-management/README.md) |
| 05 | **Knowledge Base** | 🔄 In Progress | MVP | [View](./features/05-knowledge-base/README.md) |
| 06 | **MCP Integration** | 📋 Planned | Phase 2 | [View](./features/06-mcp-integration/README.md) |
| 07 | **File Storage** | 🔄 In Progress | MVP | [View](./features/07-file-storage/README.md) |
| 08 | **Analytics** | 📋 Planned | Phase 2 | [View](./features/08-analytics/README.md) |

### Status Legend
- ✅ **Done** - Feature complete and in production
- 🔄 **In Progress** - Currently being developed
- 📋 **Planned** - Scheduled for future development
- ⏸️ **On Hold** - Paused or deprioritized

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│    React Components │ i18n │ Auth │ Chat UI │ Knowledge UI  │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API / WebSocket
┌─────────────────────────────▼───────────────────────────────┐
│                      Backend (FastAPI)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Auth &    │  │   Agent     │  │   Knowledge Base    │  │
│  │  Workspace  │  │  LangGraph  │  │   Embeddings/RAG    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Postgres │  │  Redis   │  │  Qdrant  │  │ MinIO (S3)  │  │
│  │  (Data)  │  │ (Events) │  │ (Vector) │  │  (Files)    │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Recent Updates

| Date | Feature | Change |
|------|---------|--------|
| 2026-03-13 | Knowledge Base | Document restructure, file upload planning |
| 2026-03-11 | Knowledge Base | Tool outputs metadata pattern, source citations |
| 2026-03-11 | Text Chunker | UUID chunk IDs for Qdrant compatibility |
| 2026-03-10 | Chat System | WebSocket auth error handling |

---

## Directory Structure

```
documents/
├── README.md                 # This file - Master index
├── features/                 # Feature specifications
│   ├── README.md            # Feature index with status
│   ├── 01-authentication/
│   ├── 02-agent-management/
│   ├── 03-chat-system/
│   ├── 04-workspace-management/
│   ├── 05-knowledge-base/
│   ├── 06-mcp-integration/
│   ├── 07-file-storage/
│   └── 08-analytics/
├── architecture/            # System architecture docs
├── requirements/            # Business requirements
└── development/             # Dev setup & conventions
```

---

## Contributing

1. Feature docs go in `features/<feature-name>/`
2. Each feature folder must have a `README.md`
3. Update the Feature Registry table when adding new features
4. Link technical details from architecture/ folder
