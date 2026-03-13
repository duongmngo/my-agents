# Architecture Documentation

Technical architecture, design decisions, and implementation patterns for the My Agents platform.

## Core Architecture

| Document | Description |
|----------|-------------|
| [Architecture Overview](./architecture-overview.md) | High-level system design |
| [Architecture Diagram](./architecture-diagram.md) | Visual system architecture |

## Component Documentation

### Backend & API
| Document | Description |
|----------|-------------|
| [FastAPI vs Django](./fastapi-vs-django-recommendation.md) | Framework selection rationale |
| [WebSocket Architecture](./websocket-architecture.md) | Real-time communication design |
| [WebSocket Implementation](./WEBSOCKET_IMPLEMENTATION.md) | WebSocket code patterns |
| [WebSocket Handshake](./WEBSOCKET_HANDSHAKE_GUIDE.md) | Auth handshake flow |

### AI & Agents
| Document | Description |
|----------|-------------|
| [LangGraph Agent Guide](./LANGGRAPH_AGENT_GUIDE.md) | Agent implementation patterns |
| [LangGraph Streaming](./LANGGRAPH_STREAMING_IMPLEMENTATION.md) | Streaming response handling |
| [Agent Streaming Response](./agent-streaming-response-handling.md) | Event-based streaming |
| [Tool Outputs Metadata](./tool-outputs-metadata-pattern.md) | Tool result handling pattern |

### Knowledge Base & Embeddings
| Document | Description |
|----------|-------------|
| [Vector Database Selection](./vector-database-selection.md) | Qdrant selection rationale |
| [Vector DB Separation](./vector-database-separation-analysis.md) | Multi-tenant vector isolation |

### Infrastructure
| Document | Description |
|----------|-------------|
| [Multi-Tenant Architecture](./shared-database-multi-tenant.md) | Workspace isolation design |
| [Redis Adapter Comparison](./REDIS_ADAPTER_COMPARISON.md) | Redis client selection |
| [S3-Compatible Storage](./s3-compatible-file-storage.md) | MinIO/S3 integration |
| [Container Deployment](./container-deployment-guide.md) | Docker deployment |

### Internationalization
| Document | Description |
|----------|-------------|
| [i18n & Theming](./internationalization-and-theming.md) | Multi-language support |

### Integrations
| Document | Description |
|----------|-------------|
| [MCP Integration Summary](./mcp-integration-summary.md) | MCP protocol overview |
| [MCP Server Management](./mcp-server-management-service.md) | MCP server service |

## Design Principles

1. **Multi-Tenant First** - All data isolated by workspace_id
2. **Event-Driven** - Redis pub/sub for real-time features
3. **Async by Default** - Non-blocking I/O throughout
4. **Chunked Embeddings** - Large documents split for accuracy
5. **Tool Outputs Pattern** - Generic dataType for extensibility
