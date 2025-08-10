# API Requirements

## API Overview

### 1. Base Information
- **Base URL**: `https://api.chatapp.com/v1`
- **Authentication**: Bearer token (JWT) with tenant context
- **Content Type**: `application/json`
- **Rate Limiting**: 100 requests per minute per tenant
- **Versioning**: URL versioning (`/v1`, `/v2`)
- **Tenant Identification**: Subdomain, path, or header-based

### 2. Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "errors": [],
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "uuid",
    "tenantId": "tenant_001"
  }
}
```

## Multi-Tenant Authentication

### 3. Tenant-Aware Authentication
```
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/verify-email
POST /auth/verify-email
```

### 4. Tenant Management (Super Admin)
```
GET    /admin/tenants
POST   /admin/tenants
GET    /admin/tenants/{tenantId}
PUT    /admin/tenants/{tenantId}
DELETE /admin/tenants/{tenantId}
POST   /admin/tenants/{tenantId}/provision
POST   /admin/tenants/{tenantId}/decommission
GET    /admin/tenants/{tenantId}/usage
PUT    /admin/tenants/{tenantId}/limits
```

### 5. Tenant Configuration
```
GET    /tenants/config
PUT    /tenants/config
GET    /tenants/branding
PUT    /tenants/branding
GET    /tenants/limits
GET    /tenants/usage
POST   /tenants/usage/reset
```

## LLM Model & API Key Management

### 6. Tenant-Level Model Configuration (Tenant-Isolated)
```
GET    /tenants/models
POST   /tenants/models
GET    /tenants/models/{modelId}
PUT    /tenants/models/{modelId}
DELETE /tenants/models/{modelId}
POST   /tenants/models/{modelId}/test
GET    /tenants/models/{modelId}/usage
POST   /tenants/models/{modelId}/rotate-key
```

### 7. Tenant-Level API Key Management (Tenant-Isolated)
```
GET    /tenants/api-keys
POST   /tenants/api-keys
GET    /tenants/api-keys/{keyId}
PUT    /tenants/api-keys/{keyId}
DELETE /tenants/api-keys/{keyId}
POST   /tenants/api-keys/{keyId}/rotate
GET    /tenants/api-keys/{keyId}/usage
POST   /tenants/api-keys/{keyId}/test
```

### 8. Available Models (System-Wide)
```
GET    /models/available
GET    /models/available/{provider}
GET    /models/available/{provider}/{modelId}
POST   /models/available/test
GET    /models/pricing
GET    /models/features
```

## MCP (Model Context Protocol) Integration

### 9. MCP Server Management
```
GET    /mcp/servers
POST   /mcp/servers
GET    /mcp/servers/{serverId}
PUT    /mcp/servers/{serverId}
DELETE /mcp/servers/{serverId}
POST   /mcp/servers/{serverId}/start
POST   /mcp/servers/{serverId}/stop
POST   /mcp/servers/{serverId}/restart
GET    /mcp/servers/{serverId}/status
GET    /mcp/servers/{serverId}/logs
```

### 10. MCP Tools Management
```
GET    /mcp/tools
GET    /mcp/tools/{toolId}
POST   /mcp/tools/{toolId}/execute
GET    /mcp/tools/{toolId}/schema
GET    /mcp/tools/{toolId}/usage
POST   /mcp/tools/{toolId}/test
```

### 11. MCP Agent Integration
```
GET    /agents/{agentId}/mcp-tools
POST   /agents/{agentId}/mcp-tools/{toolId}/assign
DELETE /agents/{agentId}/mcp-tools/{toolId}/unassign
POST   /agents/{agentId}/mcp-tools/{toolId}/execute
GET    /agents/{agentId}/mcp-tools/{toolId}/history
```

## Custom Agents Management

### 9. Custom Agents (Tenant-Isolated)
```
GET    /agents
POST   /agents
GET    /agents/{agentId}
PUT    /agents/{agentId}
DELETE /agents/{agentId}
POST   /agents/{agentId}/clone
POST   /agents/{agentId}/share
DELETE /agents/{agentId}/share
GET    /agents/{agentId}/analytics
POST   /agents/{agentId}/version
GET    /agents/{agentId}/versions
```

### 10. Agent Model Configuration (Tenant-Isolated)
```
GET    /agents/{agentId}/model
PUT    /agents/{agentId}/model
POST   /agents/{agentId}/model/test
GET    /agents/{agentId}/model/usage
POST   /agents/{agentId}/model/fallback
GET    /agents/{agentId}/model/fallback
```

### 11. Agent API Key Configuration (Tenant-Isolated)
```
GET    /agents/{agentId}/api-keys
POST   /agents/{agentId}/api-keys
GET    /agents/{agentId}/api-keys/{keyId}
PUT    /agents/{agentId}/api-keys/{keyId}
DELETE /agents/{agentId}/api-keys/{keyId}
POST   /agents/{agentId}/api-keys/{keyId}/rotate
GET    /agents/{agentId}/api-keys/{keyId}/usage
POST   /agents/{agentId}/api-keys/{keyId}/test
```

### 12. Agent Knowledge Base (Tenant-Isolated)
```
GET    /agents/{agentId}/knowledge
POST   /agents/{agentId}/knowledge/upload
DELETE /agents/{agentId}/knowledge/{fileId}
GET    /agents/{agentId}/knowledge/{fileId}
POST   /agents/{agentId}/knowledge/web-import
POST   /agents/{agentId}/knowledge/db-connect
GET    /agents/{agentId}/knowledge/search
PUT    /agents/{agentId}/knowledge/organize
```

### 13. Agent Capabilities & Tools (Tenant-Isolated)
```
GET    /agents/{agentId}/capabilities
PUT    /agents/{agentId}/capabilities
POST   /agents/{agentId}/functions
DELETE /agents/{agentId}/functions/{functionId}
GET    /agents/{agentId}/tools
PUT    /agents/{agentId}/tools
POST   /agents/{agentId}/tools/test
```

### 14. Agent Templates (Tenant-Isolated)
```
GET    /agents/templates
GET    /agents/templates/{templateId}
POST   /agents/templates/{templateId}/create
GET    /agents/templates/categories
GET    /agents/templates/search
```

## Agent Conversations

### 15. Agent-Specific Conversations (Tenant-Isolated)
```
GET    /agents/{agentId}/conversations
POST   /agents/{agentId}/conversations
GET    /agents/{agentId}/conversations/{conversationId}
PUT    /agents/{agentId}/conversations/{conversationId}
DELETE /agents/{agentId}/conversations/{conversationId}
POST   /agents/{agentId}/conversations/{conversationId}/rename
POST   /agents/{agentId}/conversations/{conversationId}/archive
POST   /agents/{agentId}/conversations/{conversationId}/pin
```

### 16. Agent Messages (Tenant-Isolated)
```
GET    /agents/{agentId}/conversations/{conversationId}/messages
POST   /agents/{agentId}/conversations/{conversationId}/messages
GET    /agents/{agentId}/messages/{messageId}
PUT    /agents/{agentId}/messages/{messageId}
DELETE /agents/{agentId}/messages/{messageId}
POST   /agents/{agentId}/messages/{messageId}/copy
POST   /agents/{agentId}/messages/{messageId}/share
```

## Authentication Endpoints

### 17. User Authentication (Tenant-Aware)
```
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/verify-email
POST /auth/verify-email
```

### 18. OAuth Integration (Tenant-Aware)
```
GET  /auth/oauth/{provider}
GET  /auth/oauth/{provider}/callback
POST /auth/oauth/{provider}/link
POST /auth/oauth/{provider}/unlink
```

### 19. User Management (Tenant-Isolated)
```
GET    /users/profile
PUT    /users/profile
DELETE /users/profile
GET    /users/settings
PUT    /users/settings
POST   /users/avatar
DELETE /users/avatar
GET    /users/list (admin only)
POST   /users/invite (admin only)
PUT    /users/{userId}/role (admin only)
```

## Conversation Management (Tenant-Isolated)

### 20. Conversations
```
GET    /conversations
POST   /conversations
GET    /conversations/{id}
PUT    /conversations/{id}
DELETE /conversations/{id}
POST   /conversations/{id}/rename
POST   /conversations/{id}/archive
POST   /conversations/{id}/unarchive
POST   /conversations/{id}/pin
POST   /conversations/{id}/unpin
```

### 21. Messages (Tenant-Isolated)
```
GET    /conversations/{id}/messages
POST   /conversations/{id}/messages
GET    /messages/{id}
PUT    /messages/{id}
DELETE /messages/{id}
POST   /messages/{id}/copy
POST   /messages/{id}/share
```

### 22. Folders & Organization (Tenant-Isolated)
```
GET    /folders
POST   /folders
GET    /folders/{id}
PUT    /folders/{id}
DELETE /folders/{id}
POST   /folders/{id}/conversations
DELETE /folders/{id}/conversations/{conversationId}
```

## AI Integration (Tenant-Isolated)

### 23. Chat Completion
```
POST /ai/chat
POST /ai/chat/stream
POST /ai/chat/async
GET  /ai/chat/{requestId}/status
GET  /ai/chat/{requestId}/result
```

### 24. AI Models & Configuration (Tenant-Isolated)
```
GET    /ai/models
GET    /ai/models/{id}
POST   /ai/models/{id}/configure
GET    /ai/usage
GET    /ai/usage/analytics
POST   /ai/usage/reset
```

### 25. AI Features (Tenant-Isolated)
```
POST /ai/embeddings
POST /ai/moderate
POST /ai/translate
POST /ai/summarize
POST /ai/classify
```

## File Management (Tenant-Isolated)

### 26. File Upload & Storage
```
POST   /files/upload
GET    /files
GET    /files/{id}
DELETE /files/{id}
GET    /files/{id}/download
GET    /files/{id}/preview
POST   /files/{id}/analyze
```

### 27. File Processing (Tenant-Isolated)
```
POST /files/process
GET  /files/process/{jobId}/status
GET  /files/process/{jobId}/result
POST /files/extract-text
POST /files/convert
```

## Search & Discovery (Tenant-Isolated)

### 28. Search Functionality
```
GET /search/conversations
GET /search/messages
GET /search/files
GET /search/global
GET /search/suggestions
POST /search/advanced
GET /search/agents
GET /search/knowledge
```

### 29. Analytics & Insights (Tenant-Isolated)
```
GET /analytics/usage
GET /analytics/conversations
GET /analytics/messages
GET /analytics/ai-performance
GET /analytics/user-behavior
POST /analytics/export
GET /analytics/agents
GET /analytics/knowledge
GET /analytics/models
GET /analytics/api-keys
```

## Real-time Communication (Tenant-Isolated)

### 30. WebSocket Events
```
WebSocket: /ws/chat
Events:
- message:receive
- message:typing
- conversation:update
- user:online
- user:offline
- notification:new
- agent:update
- knowledge:update
- model:update
- api-key:update
```

### 31. Push Notifications (Tenant-Isolated)
```
POST /notifications/subscribe
DELETE /notifications/unsubscribe
GET  /notifications
PUT  /notifications/{id}/read
DELETE /notifications/{id}
```

## Team & Collaboration (Tenant-Isolated)

### 32. Team Management
```
GET    /teams
POST   /teams
GET    /teams/{id}
PUT    /teams/{id}
DELETE /teams/{id}
POST   /teams/{id}/members
DELETE /teams/{id}/members/{userId}
PUT    /teams/{id}/members/{userId}/role
```

### 33. Shared Conversations (Tenant-Isolated)
```
POST   /conversations/{id}/share
DELETE /conversations/{id}/share
GET    /conversations/{id}/permissions
PUT    /conversations/{id}/permissions
POST   /conversations/{id}/comments
DELETE /conversations/{id}/comments/{commentId}
```

## Export & Integration (Tenant-Isolated)

### 34. Data Export
```
GET /export/conversations
GET /export/conversations/{id}
POST /export/conversations/{id}/pdf
POST /export/conversations/{id}/markdown
POST /export/conversations/{id}/json
GET /export/user-data
GET /export/agents
GET /export/agents/{agentId}
POST /export/agents/{agentId}/knowledge
GET /export/models
GET /export/api-keys
```

### 35. Third-party Integrations (Tenant-Isolated)
```
GET    /integrations
POST   /integrations
GET    /integrations/{id}
PUT    /integrations/{id}
DELETE /integrations/{id}
POST   /integrations/{id}/webhook
GET    /integrations/{id}/webhook
DELETE /integrations/{id}/webhook
```

## Data Models

### 36. Tenant Model
```json
{
  "id": "tenant_001",
  "name": "Acme Corporation",
  "domain": "acme.app.com",
  "plan": "enterprise",
  "status": "active",
  "limits": {
    "users": 1000,
    "storage_gb": 100,
    "api_calls_per_month": 100000,
    "ai_tokens_per_month": 1000000,
    "agents": 50,
    "knowledge_files": 1000,
    "knowledge_size_gb": 10,
    "models": 20,
    "api_keys": 50
  },
  "features": {
    "file_upload": true,
    "team_collaboration": true,
    "advanced_analytics": true,
    "custom_branding": true,
    "custom_agents": true,
    "knowledge_bases": true,
    "agent_templates": true,
    "custom_models": true,
    "custom_api_keys": true
  },
  "branding": {
    "logo_url": "https://...",
    "primary_color": "#3B82F6",
    "company_name": "Acme Corp"
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 37. Tenant Model Configuration (Tenant-Isolated)
```json
{
  "id": "uuid",
  "tenantId": "tenant_001",
  "name": "OpenAI GPT-4",
  "provider": "openai",
  "model": "gpt-4",
  "version": "latest",
  "api_keys": [
    {
      "id": "uuid",
      "name": "Primary Key",
      "key_hash": "hashed_key_value",
      "is_active": true,
      "usage_count": 15000,
      "last_used": "2024-01-01T00:00:00Z",
      "rate_limit": 3000,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "capabilities": {
    "chat_completion": true,
    "function_calling": true,
    "streaming": true,
    "embeddings": false
  },
  "pricing": {
    "input_tokens_per_1k": 0.03,
    "output_tokens_per_1k": 0.06
  },
  "is_default": true,
  "is_active": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 38. Custom Agent Model (Tenant-Isolated)
```json
{
  "id": "uuid",
  "tenantId": "tenant_001",
  "name": "Sales Assistant Agent",
  "description": "AI assistant specialized in sales and customer service",
  "instructions": "You are a sales assistant...",
  "avatar": "https://...",
  "model_config": {
    "model_id": "uuid",
    "provider": "openai",
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 4000,
    "api_keys": [
      {
        "id": "uuid",
        "name": "Sales Agent Key",
        "is_active": true,
        "usage_count": 5000
      }
    ]
  },
  "capabilities": {
    "web_browsing": true,
    "code_execution": false,
    "file_processing": true,
    "image_generation": false
  },
  "tools": [
    {
      "type": "function",
      "name": "get_customer_info",
      "description": "Get customer information from CRM"
    }
  ],
  "knowledge_base": {
    "files_count": 25,
    "total_size_mb": 150,
    "last_updated": "2024-01-01T00:00:00Z"
  },
  "usage": {
    "conversations_count": 150,
    "messages_count": 2500,
    "tokens_used": 50000
  },
  "is_public": false,
  "is_active": true,
  "version": "1.0.0",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 39. Knowledge Base Model (Tenant-Isolated)
```json
{
  "id": "uuid",
  "agentId": "uuid",
  "tenantId": "tenant_001",
  "name": "Sales Knowledge Base",
  "description": "Sales materials and customer information",
  "files": [
    {
      "id": "uuid",
      "name": "sales_manual.pdf",
      "type": "pdf",
      "size_mb": 5.2,
      "uploaded_at": "2024-01-01T00:00:00Z",
      "processed": true,
      "embeddings_count": 1500
    }
  ],
  "folders": [
    {
      "id": "uuid",
      "name": "Product Information",
      "files_count": 10
    }
  ],
  "total_files": 25,
  "total_size_mb": 150,
  "last_processed": "2024-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 40. User Model (Tenant-Isolated)
```json
{
  "id": "uuid",
  "tenantId": "tenant_001",
  "email": "user@example.com",
  "username": "username",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://...",
  "role": "user|admin|owner",
  "preferences": {
    "theme": "light",
    "language": "en",
    "notifications": true
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 41. Conversation Model (Tenant-Isolated)
```json
{
  "id": "uuid",
  "tenantId": "tenant_001",
  "agentId": "uuid",
  "title": "Conversation Title",
  "description": "Description",
  "folderId": "uuid",
  "isArchived": false,
  "isPinned": false,
  "messageCount": 10,
  "lastMessageAt": "2024-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 42. Message Model (Tenant-Isolated)
```json
{
  "id": "uuid",
  "tenantId": "tenant_001",
  "agentId": "uuid",
  "conversationId": "uuid",
  "content": "Message content",
  "type": "text|code|file|image",
  "role": "user|assistant|system",
  "metadata": {
    "tokens": 150,
    "model": "gpt-4",
    "temperature": 0.7,
    "knowledge_sources": ["sales_manual.pdf", "product_catalog.xlsx"],
    "api_key_used": "uuid",
    "model_provider": "openai"
  },
  "files": [],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Error Handling

### 43. Error Codes
```
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
409 - Conflict
422 - Unprocessable Entity
429 - Too Many Requests
500 - Internal Server Error
503 - Service Unavailable
```

### 44. Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "uuid",
    "tenantId": "tenant_001"
  }
}
```

## Rate Limiting

### 45. Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-Tenant-Limit: 1000
X-Tenant-Used: 150
X-Agent-Limit: 50
X-Agent-Used: 25
X-Model-Limit: 20
X-Model-Used: 5
X-APIKey-Limit: 50
X-APIKey-Used: 10
```

### 46. Rate Limit Rules
- **Authentication**: 5 requests per minute per tenant
- **Chat**: 50 requests per minute per tenant
- **File Upload**: 10 requests per minute per tenant
- **Search**: 30 requests per minute per tenant
- **Export**: 5 requests per minute per tenant
- **Admin Operations**: 10 requests per minute per super admin
- **Agent Creation**: 5 requests per hour per tenant
- **Knowledge Upload**: 20 requests per hour per agent
- **Model Configuration**: 10 requests per hour per tenant
- **API Key Management**: 5 requests per hour per tenant

## Webhooks (Tenant-Isolated)

### 47. Webhook Events
```
conversation.created
conversation.updated
conversation.deleted
message.created
message.updated
message.deleted
user.registered
user.updated
file.uploaded
file.processed
tenant.limit.exceeded
tenant.usage.reset
agent.created
agent.updated
agent.deleted
agent.used
knowledge.uploaded
knowledge.processed
knowledge.deleted
model.created
model.updated
model.deleted
model.used
api-key.created
api-key.updated
api-key.deleted
api-key.rotated
api-key.limit.exceeded
```

### 48. Webhook Payload
```json
{
  "event": "model.created",
  "tenantId": "tenant_001",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "model": {}
  },
  "signature": "sha256=..."
}
``` 